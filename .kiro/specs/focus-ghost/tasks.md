# Tasks — Focus Ghost

> Execute in order. Each task: implement, run `npm run typecheck`, run the tests for
> the touched module, tick the box only when green. The PostTaskExec hook runs the
> full test suite after each task.

## Phase 1 — Scaffold

- [x] 1. Scaffold Vite + React + TypeScript app (`npm create vite@latest` or manual
      `package.json` + `index.html`); verify `npm run dev` and `npm run build`.
      _Req: 5.3_
- [x] 2. Theme CSS: custom properties, fog layers, ghost glow, responsive single-column
      → desktop grid layout, `prefers-reduced-motion` support.
      _Req: 6.1, 6.5_
- [x] 3. App shell: `useReducer` state, panel layout (Timer, Ghost, Graveyard, Stats,
      Settings), `aria-live` region for timer status.
      _Req: 6.3, 6.4_

## Phase 2 — Core logic (pure modules + tests)

- [x] 4. `src/lib/timer.ts`: phase machine (`focus`/`shortBreak`/`longBreak`),
      `tick()` from explicit timestamps, 4-session long-break cycle.
      _Req: 1.1–1.5_
- [x] 5. Property tests for timer (fast-check, skill `.kiro/skills/pbt/`): remaining
      never negative; phase cycle correct; ⌊N/4⌋ long breaks per N sessions.
      _Req: 1.1–1.3_
- [x] 6. `src/lib/ghost.ts`: hunger/energy/XP/level/stage, `applySessionComplete`,
      `applyDecay`, mood derivation.
      _Req: 2.1–2.6_
- [x] 7. Property tests for ghost: values clamped 0–100; level monotonic; stage
      matches level.
      _Req: 2.1–2.5_
- [x] 8. `src/lib/streaks.ts`: `computeStreak`, heatmap buckets, 26-week window.
      _Req: 3.1–3.5_
- [x] 9. Property tests for streaks: streak ≤ recorded days; adding today's session
      never decreases streak.
      _Req: 3.1–3.2_
- [x] 10. `src/lib/store.ts`: versioned `localStorage` load/save, defaults, export/import
       with validation.
       _Req: 5.1–5.4_

## Phase 3 — UI components

- [x] 11. `Timer.tsx`: countdown display, start/pause/reset, phase indicator,
       notification + sound on phase end.
       _Req: 1.1–1.6_
- [x] 12. `Ghost.tsx`: SVG ghost per stage, mood expressions, glow states, level-up
       celebration, rename display.
       _Req: 2.3–2.6, 6.2_
- [x] 13. Distraction detection: `visibilitychange` + 60s idle timer, 10s warning,
       then decay via `ghost.ts`.
       _Req: 2.2_
- [x] 14. `Graveyard.tsx`: 26-week heatmap, tooltips, focused-day detail line.
       _Req: 3.4–3.5_
- [x] 15. `Stats.tsx`: today / week / all-time minutes + sessions + best streak.
       _Req: 3.3, 4.1_
- [x] 16. `Settings.tsx`: timer lengths, sound toggle, ghost name, export/import.
       _Req: 4.2–4.4_
- [x] 17. `audio.ts`: WebAudio chime / level-up arpeggio / whisper, behind sound toggle,
       lazy AudioContext.
       _Req: 1.6_

## Phase 4 — Polish, deploy, submit

- [x] 18. Mobile + keyboard + screen-reader pass; fix layout at 360px.
       _Req: 6.3–6.5_
- [ ] 19. Deploy to GitHub Pages; verify live URL end-to-end (fresh profile, no data).
- [ ] 20. Demo video: script from `.kiro/prompts/demo-script.md`, render with Remotion,
       < 3 min, upload to public YouTube.
- [ ] 21. README final + Kiro-usage write-up (from PLAN.md session log, truthful only).
- [ ] 22. Devpost draft → final submit before 5 Dec 2026 05:00 WIB.
