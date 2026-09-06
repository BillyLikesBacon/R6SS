---
name: R6SS — Rainbow Six Squad Stats
description: Terminal-native squad analytics for Rainbow Six Siege
colors:
  void: "#0b0b0b"
  surface-raised: "#111111"
  surface-section-header: "#151515"
  surface-dropdown: "#141414"
  surface-hover: "#252525"
  surface-progress-track: "#242424"
  border-default: "#333333"
  border-subtle: "#252525"
  border-placeholder: "#666666"
  text-primary: "#f5f5f5"
  text-muted: "#888888"
  text-placeholder: "#666666"
  win-positive: "#6fcf97"
  win-positive-border: "#2d5a3d"
  win-positive-bg: "#0d2018"
  loss-negative: "#eb5757"
  loss-negative-border: "#5a2d2d"
  loss-negative-bg: "#200d0d"
  selection-bg: "#f5f5f5"
  selection-text: "#0b0b0b"
typography:
  display:
    fontFamily: '"IBM Plex Mono", "Courier New", monospace'
    fontSize: "15px"
    fontWeight: 700
    lineHeight: 1.45
  headline:
    fontFamily: '"IBM Plex Mono", "Courier New", monospace'
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.45
  title:
    fontFamily: '"IBM Plex Mono", "Courier New", monospace'
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.45
  body:
    fontFamily: '"IBM Plex Mono", "Courier New", monospace'
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: '"IBM Plex Mono", "Courier New", monospace'
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.45
    letterSpacing: "0em"
  micro:
    fontFamily: '"IBM Plex Mono", "Courier New", monospace'
    fontSize: "10px"
    fontWeight: 600
    lineHeight: 1.45
    letterSpacing: "0.08em"
  nano:
    fontFamily: '"IBM Plex Mono", "Courier New", monospace'
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.45
    letterSpacing: "0.04em"
  ui-modal:
    fontFamily: '"IBM Plex Mono", "Courier New", monospace'
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.45
  stat-value:
    fontFamily: '"IBM Plex Mono", "Courier New", monospace'
    fontSize: "21px"
    fontWeight: 600
    lineHeight: 1.2
rounded:
  none: "0px"
  modal: "10px"
  feedback-button: "6px"
spacing:
  xs: "6px"
  sm: "9px"
  md: "14px"
  lg: "18px"
  xl: "28px"
components:
  button-primary:
    backgroundColor: "{colors.text-primary}"
    textColor: "{colors.void}"
    rounded: "{rounded.none}"
    padding: "9px 15px"
  button-primary-hover:
    backgroundColor: "#222222"
    textColor: "{colors.text-muted}"
  button-primary-disabled:
    backgroundColor: "#222222"
    textColor: "#777777"
  input-text:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.none}"
    padding: "9px 10px"
  card:
    backgroundColor: "{colors.void}"
    rounded: "{rounded.none}"
    padding: "{spacing.lg}"
  stat-card:
    backgroundColor: "{colors.void}"
    rounded: "{rounded.none}"
    padding: "12px 14px"
  player-section:
    backgroundColor: "{colors.surface-raised}"
    rounded: "{rounded.none}"
---

# Design System: R6SS — Rainbow Six Squad Stats

## Overview

**Creative North Star: "The Signal in the Noise"**

R6SS is a tool that reads like a terminal session and thinks like an analyst. Every pixel earns its place by serving a specific stat, label, or action — nothing decorates for decoration's sake. The background is not dark grey, it is near-void (#0b0b0b), and surfaces lift only enough to be distinguished from it. IBM Plex Mono is the sole typeface: its fixed-width rhythm turns every number and username into data, not content.

The punctuation system is the personality: `> ` precedes user-controlled fields, `# ` precedes section headings, and `[ status ]` wraps runtime state. These are borrowed directly from shell idiom, making the interface feel like a tool you invoke, not a page you visit.

Color is rationed deliberately. The primary palette is achromatic — void black, near-white text, and a small range of dark greys for surface layering. Color only appears in the results layer, and only to carry semantic meaning: green for positive win rate, red for negative win rate. Nothing else in the UI is colored.

**Key Characteristics:**
- Single typeface, fixed-width, at high density — everything is data
- Near-zero radius everywhere; sharp corners communicate precision
- Achromatic except for semantic win/loss indicators in results
- Terminal punctuation (`> `, `# `, `[ ]`) as the primary personality system
- No shadows, no gradients — depth expressed through surface tone steps only
- Status and progress states are first-class UI, not afterthoughts

## Colors

The palette is a strict tonal stack from void to near-white, with two isolated semantic clusters for win/loss.

### Primary
- **Near-White** (`#f5f5f5`): All primary text, primary button fill, range thumb, progress fill, and `::selection` background. The single "light" value in an otherwise dark system.

### Neutral
- **Void** (`#0b0b0b`): Page background and card background — the deepest surface. `--bg` and `--panel` are identical, meaning cards do not visually float; they are flush with the page.
- **Ink** (`#111111`): Inputs, freq boxes, player section body — the second surface step. Just distinguishable from Void under direct light; creates a recessed-field feel.
- **Section Header** (`#151515`): Player section header blocks — a third, slightly lighter step used only to visually cap sections within a player card.
- **Dropdown Surface** (`#141414`): Autocomplete dropdowns — falls between Ink and Section Header.
- **Hover Ghost** (`#252525`): Search item hover, border-subtle dividers — the lightest interactive surface state.
- **Progress Track** (`#242424`): Range slider track and progress bar background.
- **Border Default** (`#333333`): All standard borders — cards, inputs, dropdowns, section dividers.
- **Border Subtle** (`#252525`): Row dividers within frequency lists — lighter to avoid visual competition with card borders.
- **Muted Text** (`#888888`): Secondary labels, counts, metadata, placeholder-adjacent — mid-grey, readable but clearly subordinate.
- **Placeholder** (`#666666`): Input placeholders and dropdown item metas — below muted, barely legible, intentionally.

### Secondary (Semantic only — results layer)
- **Win Green** (`#6fcf97`): Win rate percentage text when ≥ 50%. Border: `#2d5a3d`. Background: `#0d2018`.
- **Loss Red** (`#eb5757`): Win rate percentage text when < 50%. Border: `#5a2d2d`. Background: `#200d0d`.

**The Achromatic Purity Rule.** Color is banned from the interface layer. It enters only when a result carries a binary positive/negative verdict (win rate badges). Any UI chrome element using a non-neutral color is a violation.

**The Semantic Pair Rule.** Win green and loss red always appear together as a system. Never use one without the other being possible in context, and never use either color for non-outcome purposes.

## Typography

**Body/Display Font:** IBM Plex Mono (with "Courier New", monospace fallback)

**Character:** A single monospace family at multiple weights. The fixed-pitch grid means every character occupies identical horizontal space — usernames, numbers, percentages, and labels all share a common beat. This is not a stylistic choice but a functional one: data aligns.

### Hierarchy

- **Display** (700, 15px, 1.45): App title (`R6SS — Rainbow Six Squad Stats`). Appears once, at the top of the page.
- **Headline** (600, 15px, 1.45): Player section names (the `<h3>` inside each player section card). High-value identifiers.
- **Title** (600, 13px, 1.45): Run button, field labels, section headings with `# ` prefix, status label, progress heading. The primary interactive and structural weight.
- **Body** (400, 13px, 1.45): General prose, subtitle, disclaimer. The lightest weight in use.
- **Label** (600, 12px, 1.45): Frequency player names, frequency percentage values, form labels, search item player names. The workhorse data label.
- **Micro** (600, 10px, 1.45, 0.08em letter-spacing, uppercase): Kicker labels (`PLAYER` above each section), stat card titles, match count metas, progress player counts. Always uppercase, always spaced.

**The One Face Rule.** IBM Plex Mono is the only typeface. No serif fallback before "Courier New". No display font stack. Any second font is a violation.

**The Size Floor Rule.** 10px is the absolute minimum. No rendered text goes below it. Text at 10px is always uppercase with 0.08em tracking to maintain legibility.

## Layout

Single-column, centered container capped at 900px with `min(900px, calc(100% - 32px))`, providing 16px gutters on narrow viewports. 28px top padding; 70px bottom clearance to avoid the fixed feedback button.

No grid system — layout is component-specific:
- **Stats summary:** 3-column equal grid (`repeat(3, 1fr)`, 8px gap), collapses to 1-column at 700px
- **Names row:** 5-column equal grid (`repeat(5, minmax(0, 1fr))`, 6px gap), collapses to 2-column at 700px, 1-column at 430px
- **Player sections:** 2-column equal grid (`repeat(2, minmax(0, 1fr))`, 10px gap), collapses to 1-column at 700px and 430px
- **Frequency rows:** 4-column grid (`minmax(0, 1fr) auto auto auto`) — name expands, stats are fixed-width

Vertical rhythm: 18px between cards. 17px below inputs before next field. Internal card padding is uniformly 18px; stat cards use 12px×14px.

**The Flatness Rule.** Cards sit flush against the page background because `--panel` equals `--bg` (#0b0b0b). Do not introduce card `background` values that lift cards off the page surface.

## Elevation & Depth

This system is entirely flat. No `box-shadow` is used anywhere in the interface layer. The feedback modal overlay uses `rgba(0, 0, 0, 0.7)` as a scrim — this is the only "depth" effect, and it is modal-exclusive.

Depth is communicated purely through tonal steps:
1. Void (`#0b0b0b`) — page / cards
2. Ink (`#111111`) — inputs, interactive containers
3. Section Header (`#151515`) — section cap bars within cards

**The No-Shadow Rule.** No `box-shadow` outside the focus ring (`0 0 0 1px var(--text)` on focused inputs, which is a focus indicator, not elevation). Adding shadows to cards or buttons is a violation.

## Shapes

Hard-edged everywhere. `border-radius: 0` on all interactive elements, cards, inputs, range sliders, progress bars. This is non-negotiable — the sharp corner is load-bearing for the terminal identity.

Two deliberate exceptions that are explicitly out-of-system (and candidates for future alignment):
- **Feedback modal box**: `border-radius: 10px` — rounded, softer, visually separated from the tool's identity
- **Feedback trigger button**: `border-radius: 6px` — same exception zone

Win rate badges use no border-radius (they inherit the system default of 0), creating pill-less rectangular chips with colored borders — a small data tag, not a UI badge.

**The Zero-Radius Rule.** All new components default to `border-radius: 0`. The feedback modal's rounding is a legacy exception, not a precedent.

## Components

### Buttons

**Sharp, inverted, minimal.** The primary button is the only inverted element in the entire UI — light fill on dark ground, reversed from everything else.

- **Shape:** Zero radius, full square corners
- **Primary (Run Checker):** `background: #f5f5f5`, `color: #0b0b0b`, `border: 1px solid #f5f5f5`, `padding: 9px 15px`, 600 weight, 13px, monospace. Margin-top: 15px.
- **Hover:** Inverts to `background: #222`, `color: #777` — the button retreats on hover, which is unusual. It communicates "I can be pressed again" rather than "I am exciting."
- **Disabled:** `background: #222`, `color: #777`, `border-color: #444`, `cursor: not-allowed`
- **Focus:** `outline: 2px solid #f5f5f5`, `outline-offset: 2px`

**The Retreating Hover Rule.** The primary button darkens on hover rather than brightening. This deliberately avoids any "excitement" signal and keeps the tool register.

### Inputs / Fields

- **Style:** Zero radius, `background: #111`, `border: 1px solid #333`, `color: #f5f5f5`, `padding: 9px 10px`, 13px, monospace
- **Placeholder:** `color: #666`
- **Focus:** `border-color: #f5f5f5`, `box-shadow: 0 0 0 1px #f5f5f5` (double-stroke focus ring — border + 1px shadow = 2px total emphasis)
- **Margin:** 17px below each field (tight vertical rhythm)

### Autocomplete Dropdown

- **Background:** `#141414`, `border: 1px solid #333`, `border-top: none` (attaches seamlessly to input)
- **Item:** `padding: 8px 12px`, `border-bottom: 1px solid #222`, flex row with name left / meta right
- **Item hover / highlighted:** `background: #252525`
- **Name:** 600 weight; **Meta:** muted `#888`, 11px
- **Positioning:** Left-aligned by default; 4th and 5th squad member dropdowns right-align to avoid viewport overflow

### Range Slider

- **Track:** 4px tall, `background: #333`, zero radius
- **Thumb:** 14px×14px square, `background: #f5f5f5`, zero radius, `cursor: grab` → `grabbing`
- **Focus:** `outline: 1px solid #f5f5f5`, 3px offset

### Cards

- **Background:** `#0b0b0b` (flush with page)
- **Border:** `1px solid #333`
- **Radius:** 0
- **Padding:** 18px
- **Gap between cards:** 18px

### Stat Cards (results summary)

A sub-variant of card for the 3-column summary grid:
- **Title:** 10px, 600, `#888`, uppercase
- **Value:** 21px, 600 — the largest text in the application

### Player Section Cards

The primary results component — a bordered container with a header cap:
- **Body background:** `#111111`
- **Header cap background:** `#151515` with `border-bottom: 1px solid #333`
- **Kicker:** 10px, 600, `#888`, uppercase, 0.08em tracking (e.g., "PLAYER")
- **Player name h3:** 15px, 600, truncated with `text-overflow: ellipsis`

### Frequency Rows

4-column grid rows inside player sections:
- **Divider:** `border-bottom: 1px solid #252525`; last row has no border
- **Player name:** 12px, 600
- **Match count:** 10px, `#888`
- **Percentage:** 13px, `#f5f5f5`, `min-width: 52px`, right-aligned
- **Win rate badge:** 11px, 600, `padding: 2px 6px`, `border: 1px solid`, zero radius — colored green/red/muted depending on outcome

### Progress Bars

Used for per-player scrape progress during a job run:
- **Track:** 5px tall, `background: #242424`
- **Fill:** `background: #f5f5f5`, `transition: width 0.25s ease`

### Status Label

Signature component — the live job status indicator:
- **Format:** `[ status text ]` — brackets are CSS `::before`/`::after` pseudo-elements in muted grey
- **Weight:** 600, 13px
- **Example:** `[ Loading matches - 23 / 50 ]`

### Win Rate Badge

Semantic chip — the only colored component:
- **Positive (≥50%):** `color: #6fcf97`, `border: 1px solid #2d5a3d`, `background: #0d2018`
- **Negative (<50%):** `color: #eb5757`, `border: 1px solid #5a2d2d`, `background: #200d0d`
- **N/A:** `color: #888`, `border: 1px solid #333`, `background: transparent`
- **Radius:** 0 — rectangular, not pill

## Do's and Don'ts

### Do:
- **Do** use `border-radius: 0` on every new interactive element, card, input, and container.
- **Do** prefix field labels with `> ` (CSS `::before`, muted color) and section headings with `# ` (same treatment).
- **Do** wrap runtime status text in `[ ]` brackets via pseudo-elements.
- **Do** use `#111111` for input backgrounds and interactive containers that should feel recessed relative to cards.
- **Do** use the micro style (10px, 600, uppercase, 0.08em tracking) for all kicker/descriptor labels.
- **Do** keep the stat card value at 21px, 600 — it is the largest text on the page and the visual anchor of the results summary.
- **Do** use IBM Plex Mono at all sizes — never swap to a proportional face.
- **Do** match `--panel` to `--bg` (#0b0b0b) so cards sit flush rather than floating.

### Don't:
- **Don't** use any color outside the win/loss semantic pair (`#6fcf97` / `#eb5757`) in new UI chrome.
- **Don't** add `box-shadow` to cards, buttons, or containers — the feedback modal scrim (`rgba(0,0,0,0.7)`) is the only depth effect permitted.
- **Don't** introduce a second typeface, even as an accent or display face.
- **Don't** use `border-radius` on new components — the feedback modal's `10px` radius is a legacy exception, not a pattern to extend.
- **Don't** brighten buttons on hover — the primary button's hover state darkens intentionally.
- **Don't** use color to communicate hierarchy or emphasis — use weight (400→600→700) and size steps instead.
- **Don't** go below 10px for any rendered text, and always apply uppercase + 0.08em tracking at that size.
