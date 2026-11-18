# Design — Focus Ghost

## Overview

A single-page React app (Vite + TypeScript). One `useReducer` holds all state at the
App level. Pure logic modules in `src/lib/` are framework-free and fully tested. The
UI is five panels: Timer, Ghost, Graveyard, Stats, Settings. No backend, no network
calls at runtime, all state in `localStorage`.

## Architecture

```
┌─────────────────────────────────────────────────┐
│ App.tsx  (useReducer, wires everything)         │
│  ├─ Timer.tsx     (countdown + controls)        │
│  ├─ Ghost.tsx     (SVG ghost, mood/stage)       │
│  ├─ Graveyard.tsx (26-week heatmap)             │
│  ├─ Stats.tsx     (today/week/all-time)         │
│  └─ Settings.tsx  (lengths, sound, name)        │
├─────────────────────────────────────────────────┤
│ src/lib/ (pure, tested)                         │
│  ├─ timer.ts    — phase machine, tick math      │
│  ├─ ghost.ts    — hunger/energy/XP/level/stage  │
│  ├─ streaks.ts  — streak + heatmap buckets      │
│  ├─ store.ts    — localStorage load/save/migrate│
│  └─ audio.ts    — WebAudio chimes/whispers      │
└─────────────────────────────────────────────────┘
```

### Timer engine (`timer.ts`)

- State: `{ phase: 'focus' | 'shortBreak' | 'longBreak', remainingSeconds, sessionsInCycle, running }`.
- `tick(state, now)` is pure: it takes an explicit timestamp and returns the new state
  plus events (`PHASE_COMPLETE`, ...). The component drives it with `setInterval` and
  passes `Date.now()`. No hidden clock inside pure functions (testability).
- Phase transitions: focus → short break; after 4 focus sessions → long break; break →
  focus. Completing a focus phase emits a `SESSION_COMPLETED` event that the ghost
  reducer consumes.

### Ghost state machine (`ghost.ts`)

- State: `{ name, hunger 0–100, energy 0–100, xp, level, mood }`.
- Stage derived from level: 1–2 Wisp, 3–5 Shade, 6–9 Spook, 10–14 Wraith, 15+
  Poltergeist.
- `applySessionComplete(ghost)` → hunger +15, energy +10, xp +25; level-ups while
  `xp >= 100 * level` (xp carries over). Returns events (`LEVEL_UP`, `EVOLVED`).
- `applyDecay(ghost, secondsHiddenOrIdle)` → hunger −1 per 30s, energy −1 per 60s,
  clamped at 0. Mood derived: energy < 25 → "weak"; hunger < 25 → "hungry";
  level-up moment → "ecstatic" (5s); else "happy" if hunger & energy ≥ 60, "neutral".
- Distraction detection: `document.visibilitychange` + a 60s idle timer (no mouse/key
  activity). Warning shown for 10s before decay starts, so the user can return.

### Streaks & Graveyard (`streaks.ts`)

- Days stored as `{ "YYYY-MM-DD": { focusMinutes, sessions } }` (local dates).
- `computeStreak(days, today)`: walk backwards from today (or yesterday if today has
  no session yet); count consecutive days with ≥ 1 session.
- Heatmap buckets by focus minutes: 0, 1–14, 15–29, 30–59, 60+ → 5 intensity levels.
- 26 weeks × 7 days, columns = weeks, rows = weekdays (Sunday-first), like GitHub.

### Persistence (`store.ts`)

- Key `focus-ghost:v1`, JSON. `load()` returns defaults on missing/corrupt/unknown
  version. `save()` debounced (~300ms) on state change. Export downloads the JSON;
  import validates `version === 1` and required fields before replacing state.

### Audio (`audio.ts`)

- WebAudio oscillators only (no files): focus-complete chime (two-note), level-up
  arpeggio, soft "whisper" (filtered noise, low volume) on evolution. All behind the
  sound toggle; `AudioContext` created lazily on first user gesture.

## UI / visual design

- **Palette:** background `#0b0714` (near-black violet), surface `#17102a`, ghost glow
  `#b7f7c9` (spectral green) → `#8ecbff` at high stages, accent amber `#ffb454`
  (candlelight), danger `#ff6b81` (starving ghost). Text `#efeaff`.
- **Ghost:** inline SVG, drawn per stage (wisp = small blob; poltergeist = large with
  trailing wisps). Glow via CSS `drop-shadow` + slow float animation; dimmed/desaturated
  when hungry/weak. Mood changes eyes/mouth paths.
- **Graveyard:** CSS grid heatmap; each cell a "tombstone" (rounded top). Tooltip via
  `title` + a focused detail line below.
- **Fog:** two absolutely-positioned radial-gradient layers drifting slowly (CSS
  keyframes, `prefers-reduced-motion` respected — animation off then).
- **Layout:** single column on mobile; desktop grid: ghost+timer hero on top, graveyard
  and stats below, settings in a collapsible panel.

## Testing strategy

- **Unit tests** (Vitest) for every pure function in `src/lib/`.
- **Property-based tests** (fast-check, via the `.kiro/skills/pbt/` skill) for:
  - timer: remaining time never negative; phase transitions are a cycle; completing N
    sessions always yields exactly ⌊N/4⌋ long breaks.
  - ghost: hunger/energy always within 0–100 after any sequence of events; level is
    monotonic non-decreasing; stage matches level.
  - streaks: streak never exceeds the number of recorded days; adding a session today
    never decreases the streak.
- **Manual checks:** 360px viewport, keyboard-only navigation, screen-reader
  announcement of phase changes.

## Correctness / risks

- **Clock drift:** `setInterval` throttling in background tabs — mitigated by computing
  remaining time from timestamps, not by counting ticks.
- **Midnight rollover:** streak math uses local calendar days; a session crossing
  midnight is credited to the day it started.
- **Storage quota:** state is tiny (< 50 KB); export/import guards against corrupt JSON.
