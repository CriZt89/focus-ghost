# Tech — Focus Ghost

## Stack

- **Vite 6 + React 19 + TypeScript** (strict mode, `tsc -b` for builds).
- **Plain CSS** with custom properties. No CSS framework, no component library.
- **WebAudio API** for synthesized sounds (no audio files).
- **`localStorage`** for persistence (versioned key, see Structure).
- **Vitest + fast-check** for unit tests and property-based tests.
- Deployed as a static site on **GitHub Pages** (`npm run build` → `dist/`).

## Commands

```bash
npm install     # install dependencies
npm run dev     # dev server (Vite)
npm run build   # tsc -b && vite build
npm run preview # preview the production build
npm run test    # vitest run (unit + property-based)
npm run typecheck  # tsc --noEmit
```

## Conventions

- **Pure logic lives in `src/lib/`** as framework-free TypeScript modules with no DOM
  or React imports, so it can be unit-tested and property-tested in isolation:
  `timer.ts` (timer engine), `ghost.ts` (ghost state machine + evolution),
  `streaks.ts` (streak + graveyard math), `store.ts` (persistence),
  `audio.ts` (WebAudio sounds).
- **Components in `src/components/`** are thin: they render state and dispatch actions.
  No business logic inside components.
- **State:** one `useReducer` at the App level; every state transition is a named
  action (`START_FOCUS`, `COMPLETE_SESSION`, `TAB_HIDDEN`, ...). No ad-hoc mutation.
- **Time:** the timer engine works on explicit "now" timestamps passed in, never on
  hidden `Date.now()` calls inside pure functions — this makes it testable.
- **No network calls at runtime.** The app must work fully offline after first load.
- **Accessibility:** all interactive elements are keyboard reachable; timer status is
  announced via `aria-live`; color is never the only signal (ghost mood also has text).
- **TypeScript strict:** no `any`, no unused locals, no implicit returns.
- **English UI copy.** (Kiroween requires English submission materials.)

## Definition of done (per spec task)

1. `npm run typecheck` passes.
2. `npm run test` passes (including property-based tests for the touched logic).
3. Feature works in `npm run dev` on desktop and on a narrow (360px) viewport.
4. No new network dependency, no new secret, no new account requirement.
