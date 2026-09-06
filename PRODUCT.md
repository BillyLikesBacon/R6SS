# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Node.js + Express backend, vanilla HTML/CSS/JS frontend. Deployed on Render via GitHub. Supabase for user feedback storage.

## Users

Rainbow Six Siege players — PC and console — who want to know how often they queue with specific people (squadmates, suspected smurfs, recurring teammates). Used alongside their squad, not just solo. Public tool, no login required.

## Product Purpose

R6SS (Rainbow Six Squad Stats) automatically cross-references a player's recent ranked match history against a list of named players to surface co-queue frequency, win percentage together, and more. It removes the manual effort of comparing match histories across multiple stats.cc profiles.

## Positioning

The only tool that cross-references multiple players' match histories simultaneously to calculate shared queue frequency and win rate — stats.cc shows one player at a time; R6SS shows the relationship between players across a chosen match window.

## Operating Context

- User pastes or searches a stats.cc profile (URL, UUID, or username) for the main player
- User enters up to 5 squad member usernames to cross-check
- User selects a match window (1–500 recent ranked matches)
- Results show per-player co-queue frequency, win rate when queued together, and pairwise stats across the whole group
- Used casually after a session or to investigate recurring lobby members

## Capabilities and Constraints

- Data sourced exclusively from stats.cc API (no Ubisoft direct access)
- Match data is ranked only
- Usernames matched case-insensitively
- Up to 5 squad members at a time
- Match window up to 500
- "More stats to come" — feature set is actively expanding

## Brand Commitments

- Name: **R6SS** — stands for Rainbow Six Squad Stats; keep this always
- Aesthetic: terminal-inspired, dark-first design; monospace type; minimal chrome
- Dark/light mode: dark is the default and preferred; a mode switcher is a confirmed desired feature
- Tone: direct, no fluff

## Evidence on Hand

- Live implementation at `/public/index.html` and `/public/style.css`
- Incumbent visual system: IBM Plex Mono, near-black background (#0b0b0b), light text (#f5f5f5), no color accents, terminal punctuation decorators ("> ", "# ", "[ ]")

## Product Principles

1. **Relationship over individual** — the value is always in the connection between players, not any single player's stats in isolation.
2. **Zero friction** — no accounts, no setup; paste a URL and get results.
3. **Terminal honesty** — the UI should feel like a tool, not a product. Information density over decoration.
4. **Dark by default** — dark mode is not a preference toggle, it is the identity; light mode is an accommodation.
5. **Expandable foundation** — the stat set is deliberately open-ended; architecture and UI should absorb new metrics without a redesign.

## Accessibility & Inclusion

Standard web accessibility expected. Dark/light mode switcher should respect `prefers-color-scheme` as the initial default.
