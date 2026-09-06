// server.js
//
// Rainbow Six Match Checker — Node/Express backend.
//
// API:
//   POST /api/start
//   GET  /api/status/:jobId
//   GET  /api/result/:jobId
//
// No cookies file is required.

const express = require("express");
const crypto = require("crypto");

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 5000;
const SITE_URL = "https://stats.cc";
const API_BASE = "https://r6.stats.cc/v2";

const MIN_DELAY = 1000;
const MAX_DELAY = 2000;
const MAX_RETRIES = 6;
const RATE_LIMIT_WAIT = 20000;
const ERROR_WAIT = 15000;
const DEFAULT_TARGET_MATCHES = 50;
const MAX_CONCURRENT_PLAYER_SCRAPES = 3;

const UUID_PATTERN =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

const INVALID_NAMES = new Set([
  "null",
  "none",
  "undefined",
  "matches",
  "leaderboards",
  "leaderboard",
  "siege",
  "ranks",
  "operators",
  "players",
]);

const JOBS = new Map();

const { createClient } = require("@supabase/supabase-js");

const supabase = (process.env.SUPABASE_URL && process.env.SUPABASE_KEY)
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
  : null;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function updateJob(jobId, fields) {
  const job = JOBS.get(jobId);
  if (!job) return;

  Object.assign(job, fields);
}

function setStatus(jobId, status) {
  updateJob(jobId, { status });
}

function setProgress(jobId, current, total) {
  updateJob(jobId, {
    progress: {
      current,
      total,
    },
  });
}

function setPlayerProgress(jobId, index, current) {
  const job = JOBS.get(jobId);
  if (!job || !job.player_progress || !job.player_progress[index]) return;

  const playerProgress = [...job.player_progress];
  playerProgress[index] = {
    ...playerProgress[index],
    current,
  };

  updateJob(jobId, {
    player_progress: playerProgress,
  });
}

function cleanPlayerUrl(value) {
  let url = String(value || "").trim();

  const markdownMatch = url.match(/\]\((https?:\/\/[^)]+)\)/);

  if (markdownMatch) {
    url = markdownMatch[1];
  }

  return url.replace(/\\&/g, "&");
}

function extractPlayerUuid(playerUrl) {
  const url = cleanPlayerUrl(playerUrl);

  let parsed;

  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Invalid player URL.");
  }

  const parts = parsed.pathname
    .split("/")
    .filter(Boolean);

  for (let i = parts.length - 1; i >= 0; i--) {
    if (UUID_PATTERN.test(parts[i])) {
      return {
        uuid: parts[i],
        url,
      };
    }
  }

  throw new Error(
    "Could not find a valid player UUID in the supplied URL."
  );
}

function cleanPlayerName(name) {
  if (typeof name !== "string") {
    return "";
  }

  let value = decodeURIComponent(name);
  value = decodeURIComponent(value);

  return value
    .replace(/\x00/g, "")
    .replace(/\\x00/g, "")
    .trim();
}

function isUuid(value) {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function apiHeaders() {
  return {
    Accept: "application/json",
    "Accept-Language": "en-US,en;q=0.6",
    Origin: SITE_URL,
    Referer: `${SITE_URL}/`,
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
      "AppleWebKit/537.36 (KHTML, like Gecko) " +
      "Chrome/151.0.0.0 Safari/537.36",
    "X-Locale": "en",
    "X-Stats-CC-Client": "web-csr",

    // Request identifier rather than a stored cookie.
    "X-API-Key": crypto.randomUUID(),
  };
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);

  const text = await response.text();

  let data;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(
      `API returned invalid JSON (HTTP ${response.status}).`
    );
  }

  return {
    response,
    data,
  };
}

function retryAfterSeconds(response, fallback) {
  const header = response.headers.get("retry-after");

  let seconds = Number.parseInt(header, 10);

  if (!Number.isFinite(seconds)) {
    seconds = fallback / 1000;
  }

  return seconds * 1000 + randomDelay(1000, 5000);
}

async function resolvePlayerUuid(identifier) {
  if (!identifier || typeof identifier !== "string") {
    return null;
  }

  const trimmed = identifier.trim();
  if (!trimmed) return null;

  if (isUuid(trimmed)) {
    return trimmed;
  }

  try {
    const { uuid } = extractPlayerUuid(trimmed);
    if (uuid) return uuid;
  } catch {
    // Not a URL containing a UUID
  }

  for (const platform of ["pc", "xbox", "playstation"]) {
    try {
      const url =
        "https://r6.stats.cc/v2/profiles/search?username=" +
        encodeURIComponent(trimmed) +
        "&platform=" +
        platform +
        "&include_aliases=true&limit=10";

      const { response, data } = await fetchJson(url, {
        method: "GET",
        headers: apiHeaders(),
      });

      if (response.ok && Array.isArray(data) && data.length > 0) {
        // Try exact case-insensitive match first
        for (const item of data) {
          const profile = item.profile || item;
          const uuid = profile.id || profile.user_id || profile.userId;
          const uname = profile.username || profile.displayName || profile.name;
          if (isUuid(uuid) && uname && uname.toLowerCase() === trimmed.toLowerCase()) {
            return uuid;
          }
        }
        // Fallback to first profile returned
        const first = data[0].profile || data[0];
        const uuid = first.id || first.user_id || first.userId;
        if (isUuid(uuid)) {
          return uuid;
        }
      }
    } catch {
      // Ignore and try next platform
    }
  }

  return null;
}

async function loadMatches(
  playerUuid,
  targetMatches,
  jobId,
  label = "Loading matches",
  baseLoaded = 0,
  totalToFetch = targetMatches,
  onProgress = null
) {
  const matches = [];
  let before = null;

  const reportProgress = (loaded) => {
    if (onProgress) {
      onProgress(loaded);
      return;
    }

    setProgress(jobId, baseLoaded + loaded, totalToFetch);
  };

  setStatus(
    jobId,
    `${label}...`
  );

  reportProgress(0);

  while (matches.length < targetMatches) {
    const params = new URLSearchParams();

    params.set("playlist", "ranked");

    if (before) {
      params.set("before", before);
    }

    const url =
      `${API_BASE}/profiles/${encodeURIComponent(playerUuid)}/matches` +
      `?${params.toString()}`;

    let result;

    try {
      result = await fetchJson(url, {
        method: "GET",
        headers: apiHeaders(),
      });
    } catch (error) {
      throw new Error(
        `Match API request failed: ${error.message}`
      );
    }

    const { response, data } = result;

    if (response.status === 429) {
      const wait = retryAfterSeconds(
        response,
        RATE_LIMIT_WAIT
      );

      setStatus(
        jobId,
        `Match API rate limited - waiting ${Math.ceil(
          wait / 1000
        )}s`
      );

      await sleep(wait);
      continue;
    }

    if (
      response.status === 401 ||
      response.status === 403
    ) {
      throw new Error(
        `Stats.cc rejected the match API request with HTTP ${response.status}.`
      );
    }

    if (!response.ok) {
      throw new Error(
        `Match API returned HTTP ${response.status}: ` +
        `${JSON.stringify(data).slice(0, 500)}`
      );
    }

    if (!data) {
      break;
    }

    if (!Array.isArray(data)) {
      throw new Error(
        "Stats.cc returned an unexpected match response."
      );
    }

    if (data.length === 0) {
      break;
    }

    matches.push(...data);

    before = data[data.length - 1]?.id;

    if (!before) {
      break;
    }

    const loaded = Math.min(
      matches.length,
      targetMatches
    );

    reportProgress(loaded);

    setStatus(
      jobId,
      `${label} - ${loaded} / ${targetMatches}`
    );

    if (matches.length < targetMatches) {
      await sleep(
        randomDelay(MIN_DELAY, MAX_DELAY)
      );
    }
  }

  return matches.slice(0, targetMatches);
}

function createMatchUrls(matches, playerUuid) {
  return matches
    .filter((match) => match && match.id)
    .map(
      (match) =>
        `${SITE_URL}/siege/matches/${match.id}` +
        `?originId=${playerUuid}`
    );
}

function buildPairKey(a, b) {
  // Consistent key regardless of argument order
  return [a, b].sort().join(" <> ");
}

async function fetchMatchProfiles(matchId) {
  // Fetches /v2/matches/{uuid} and returns the profiles array (all players in
  // the lobby with their usernames).  Returns [] on any error.
  const url = `${API_BASE}/matches/${encodeURIComponent(matchId)}`;
  let retries = 0;

  while (retries <= MAX_RETRIES) {
    let result;
    try {
      result = await fetchJson(url, { method: "GET", headers: apiHeaders() });
    } catch {
      return [];
    }

    const { response, data } = result;

    if (response.status === 429) {
      const wait = retryAfterSeconds(response, RATE_LIMIT_WAIT);
      await sleep(wait);
      retries++;
      continue;
    }

    if (!response.ok) return [];

    return Array.isArray(data?.profiles) ? data.profiles : [];
  }

  return [];
}

// Build a matchId → outcome map from the main player's match list.
// Each match from /profiles/:uuid/matches includes player_summary.outcome.
function buildOutcomeMap(matches) {
  const map = new Map();
  for (const match of matches) {
    if (match && match.id && match.player_summary) {
      const outcome = match.player_summary.outcome;
      if (outcome === "win" || outcome === "loss") {
        map.set(match.id, outcome);
      }
    }
  }
  return map;
}



async function runScraper(
  jobId,
  playerUrl,
  names,
  targetMatches
) {
  try {
    // ── Step 1: resolve main player UUID ────────────────────────────────────
    setStatus(jobId, "Resolving main player profile...");

    updateJob(jobId, {
      player_progress: [
        { name: playerUrl, current: 0, total: targetMatches },
      ],
      progress: { current: 0, total: targetMatches },
    });

    const mainUuid = await resolvePlayerUuid(playerUrl);
    if (!mainUuid) {
      throw new Error("Could not resolve the main player's profile.");
    }

    // ── Step 2: load main player's recent ranked matches ─────────────────────
    const mainMatches = await loadMatches(
      mainUuid,
      targetMatches,
      jobId,
      "Loading matches",
      0,
      targetMatches,
      (loaded) => {
        setPlayerProgress(jobId, 0, loaded);
        setProgress(jobId, loaded, targetMatches);
      }
    );

    if (!mainMatches.length) {
      throw new Error("No matches were loaded for the main player.");
    }

    // Build outcome map from the match list (player_summary.outcome on each item)
    const outcomeMap = buildOutcomeMap(mainMatches);

    // ── Step 3: fetch match details to find squad members in the lobby ───────
    // For each match we fetch /v2/matches/{uuid} which includes a profiles[]
    // array with every player's username.  We check case-insensitively whether
    // any of the entered squad names appear in that list.

    const lowerNames = names.map((n) => n.toLowerCase());

    // Track per squad-member: which match IDs they appeared in
    // matchPresence[i] = Set of match UUIDs where names[i] was found
    const matchPresence = names.map(() => new Set());

    setStatus(jobId, `Checking ${mainMatches.length} matches for squad members...`);
    // Phase 2 progress offset: Phase 1 already counted targetMatches steps
    const phase2Offset = targetMatches;
    setProgress(jobId, phase2Offset, targetMatches * 2);

    // Fetch match details with controlled concurrency
    let detailIdx = 0;
    let detailsDone = 0;
    const total = mainMatches.length;

    async function processNextMatch() {
      while (detailIdx < total) {
        const match = mainMatches[detailIdx++];
        if (!match?.id) {
          detailsDone++;
          setProgress(jobId, phase2Offset + detailsDone, targetMatches * 2);
          continue;
        }

        const profiles = await fetchMatchProfiles(match.id);

        for (const profile of profiles) {
          const uname = (profile.username || "").toLowerCase();
          for (let i = 0; i < lowerNames.length; i++) {
            if (uname === lowerNames[i]) {
              matchPresence[i].add(match.id);
            }
          }
        }

        detailsDone++;
        setProgress(jobId, phase2Offset + detailsDone, targetMatches * 2);
        setStatus(jobId, `Checking matches... ${detailsDone} / ${total}`);

        await sleep(randomDelay(MIN_DELAY, MAX_DELAY));
      }
    }

    await Promise.all(
      Array.from({ length: MAX_CONCURRENT_PLAYER_SCRAPES }, () => processNextMatch())
    );

    // ── Step 4: calculate frequencies ───────────────────────────────────────
    setStatus(jobId, "Calculating frequencies...");

    const mainMatchSet = new Set(mainMatches.map((m) => m.id));

    const playerFrequencies = names.map((name, i) => {
      const count = matchPresence[i].size;
      const total = mainMatchSet.size;
      let wins = 0;
      let losses = 0;
      for (const id of matchPresence[i]) {
        const outcome = outcomeMap.get(id);
        if (outcome === "win") wins++;
        else if (outcome === "loss") losses++;
      }
      const decided = wins + losses;
      return {
        name,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
        wins,
        losses,
        win_percentage: decided > 0 ? (wins / decided) * 100 : null,
      };
    });

    // Pairwise frequencies — matches where both squad members appeared
    // together in the main player's games.  Win/loss comes from the main
    // player's own outcome for those shared matches.
    const pairFrequencies = [];
    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        const setA = matchPresence[i];
        const setB = matchPresence[j];
        let count = 0;
        let wins = 0;
        let losses = 0;
        for (const id of setA) {
          if (setB.has(id)) {
            count++;
            const outcome = outcomeMap.get(id);
            if (outcome === "win") wins++;
            else if (outcome === "loss") losses++;
          }
        }
        const total = Math.max(setA.size, setB.size);
        const decided = wins + losses;
        pairFrequencies.push({
          players: [names[i], names[j]],
          count,
          total,
          percentage: total > 0 ? (count / total) * 100 : 0,
          wins,
          losses,
          win_percentage: decided > 0 ? (wins / decided) * 100 : null,
        });
      }
    }

    // Include main player in the pair data so the frontend can show
    // main ↔ each squad member alongside squad ↔ squad pairs
    const mainPlayerName = playerUrl;
    for (const freq of playerFrequencies) {
      pairFrequencies.push({
        players: [mainPlayerName, freq.name],
        count: freq.count,
        total: mainMatchSet.size,
        percentage: freq.percentage,
        wins: freq.wins,
        losses: freq.losses,
        win_percentage: freq.win_percentage,
      });
    }

    const matchUrls = createMatchUrls(mainMatches, mainUuid);

    const result = {
      match_urls: matchUrls,
      total_groups: mainMatchSet.size,
      main_player: mainPlayerName,
      player_frequencies: playerFrequencies,
      pair_frequencies: pairFrequencies,
    };

    updateJob(jobId, {
      status: "Complete",
      progress: { current: total, total },
      done: true,
      error: null,
      result,
    });
  } catch (error) {
    updateJob(jobId, {
      status: "Failed",
      done: true,
      error: error.message,
      result: null,
    });
  }
}

// -----------------------------------------------------------------------------
// Routes
// -----------------------------------------------------------------------------

const path = require("path");

app.use(
  express.static(
    path.join(__dirname, "public")
  )
);

app.post("/api/feedback", async (req, res) => {
  try {
    const message =
      String(req.body.message || "").trim();

    const deviceInfo =
      req.body.device_info || {};

    if (!message) {
      return res.status(400).json({
        error: "Feedback cannot be empty."
      });
    }

    if (message.length > 2000) {
      return res.status(400).json({
        error: "Feedback is too long."
      });
    }

    if (!supabase) {
      return res.status(500).json({
        error: "Feedback submission is not configured."
      });
    }

    const { error } = await supabase
      .from("feedback")
      .insert({
        message: message,
        device_info: deviceInfo
      });

    if (error) {
      console.error("Supabase error:", error);

      return res.status(500).json({
        error: "Failed to save feedback."
      });
    }

    res.json({
      success: true
    });

  } catch (error) {
    console.error("Feedback error:", error);

    res.status(500).json({
      error: "Failed to submit feedback."
    });
  }
});

app.get("/api/search-players", async (req, res) => {
  const query = String(req.query.q || "").trim();

  if (!query || query.length < 2) {
    return res.json([]);
  }

  try {
    const results = [];
    const seenNames = new Set();

    for (const platform of ["pc", "xbox", "playstation"]) {
      try {
        const url =
          "https://r6.stats.cc/v2/profiles/search?username=" +
          encodeURIComponent(query) +
          "&platform=" +
          platform +
          "&include_aliases=true&limit=10";

        const { response, data } = await fetchJson(url, {
          method: "GET",
          headers: apiHeaders(),
        });

        if (response.ok && Array.isArray(data)) {
          for (const item of data) {
            const profile = item.profile || item;
            const name = profile.username || profile.displayName || profile.name;
            const uuid = profile.id || profile.user_id || profile.userId;

            if (name && !seenNames.has(name.toLowerCase())) {
              seenNames.add(name.toLowerCase());
              results.push({
                name,
                uuid: uuid || null,
                platform: profile.platform || platform,
                level: profile.level || null,
              });
            }
          }
        }
      } catch {
        // Continue to next platform if error
      }

      if (results.length >= 10) break;
    }

    return res.json(results.slice(0, 10));
  } catch (error) {
    console.error("Player search error:", error);
    return res.status(500).json({
      error: "Failed to search players."
    });
  }
});

app.get("/", (req, res) => {
  res.sendFile(
    path.join(
      __dirname,
      "public",
      "index.html"
    )
  );
});

app.post("/api/start", (req, res) => {
  const data = req.body || {};

  const playerUrl =
    String(data.player_url || "").trim();

  const names = Array.isArray(data.names)
    ? data.names
      .map((name) =>
        String(name || "").trim()
      )
      .filter(Boolean)
      .slice(0, 5)
    : [];

  let targetMatches =
    Number.parseInt(
      data.target_matches,
      10
    );

  if (!Number.isFinite(targetMatches)) {
    targetMatches =
      DEFAULT_TARGET_MATCHES;
  }

  targetMatches = Math.max(
    1,
    Math.min(500, targetMatches)
  );

  if (!playerUrl) {
    return res.status(400).json({
      error: "Player URL is required.",
    });
  }

  if (!names.length) {
    return res.status(400).json({
      error:
        "Enter at least one player to check.",
    });
  }

  const jobId = crypto.randomUUID();
  // Phase 1: load main player matches (targetMatches)
  // Phase 2: fetch each match detail (targetMatches)
  const totalToFetch = targetMatches * 2;

  JOBS.set(jobId, {
    status: "Starting...",
    player_progress: [
      { name: playerUrl, current: 0, total: targetMatches },
    ],
    progress: {
      current: 0,
      total: totalToFetch,
    },
    done: false,
    error: null,
    result: null,
  });

  runScraper(
    jobId,
    playerUrl,
    names,
    targetMatches
  );

  return res.json({
    job_id: jobId,
  });
});

app.get(
  "/api/status/:jobId",
  (req, res) => {
    const job =
      JOBS.get(req.params.jobId);

    if (!job) {
      return res.status(404).json({
        error: "Unknown job id.",
      });
    }

    return res.json({
      status: job.status,
      player_progress: job.player_progress,
      progress: job.progress,
      done: job.done,
      error: job.error,
    });
  }
);

app.get(
  "/api/result/:jobId",
  (req, res) => {
    const job =
      JOBS.get(req.params.jobId);

    if (!job) {
      return res.status(404).json({
        error: "Unknown job id.",
      });
    }

    if (!job.done) {
      return res.status(425).json({
        error: "Job still running.",
      });
    }

    if (job.error) {
      return res.status(500).json({
        error: job.error,
      });
    }

    return res.json(job.result);
  }
);

// Remove old jobs periodically.
setInterval(() => {
  const cutoff = Date.now() - 60 * 60 * 1000;

  for (const [jobId, job] of JOBS) {
    if (
      job.createdAt &&
      job.createdAt < cutoff
    ) {
      JOBS.delete(jobId);
    }
  }
}, 10 * 60 * 1000);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Rainbow Six Match Checker running on port ${PORT}`);
});