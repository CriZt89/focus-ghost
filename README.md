# 👻 FOCUS GHOST

> *Your focus has a soul. Feed it, or it fades.*

**Focus Ghost** is a focus & productivity web app with a haunted twist: a virtual ghost lives in your browser tab. Run Pomodoro focus sessions to feed and strengthen your ghost. Get distracted — switch tabs, go idle — and it weakens. Build streaks, level it up, watch it evolve from a tiny wisp into a mighty poltergeist, and grow a **graveyard** — a GitHub-style heatmap of every day you showed up.

Built for **Kiroween 2026** (Devpost), category **Frankenstein**: it stitches four seemingly incompatible things into one app — a Pomodoro timer, a Tamagotchi-style virtual pet, a GitHub contribution graph, and RPG progression — into a single, unexpectedly coherent productivity companion.

## Features

- ⏱️ **Pomodoro timer** — focus / short break / long break, fully customizable lengths, auto-start options
- 👻 **A living ghost** — hunger, energy, and mood that respond to your sessions; 5 evolution stages (Wisp → Shade → Spook → Wraith → Poltergeist)
- 🔥 **Streaks & levels** — daily streaks, XP, and level-ups that evolve your ghost
- 🪦 **The Graveyard** — a contribution-graph heatmap of your focus days
- 📊 **Session stats** — total focus time, sessions completed, best streak, per-day breakdown
- 🔊 **Haunted sounds** — optional WebAudio chimes and ghostly whispers (no audio files needed)
- 💾 **Fully local** — all data in `localStorage`; no account, no backend, no tracking
- 🌙 **Spooky design** — dark, foggy, glowing UI that makes focus feel like a séance

## Tech stack

- **Vite + React + TypeScript** (strict mode)
- Plain CSS with custom properties (no CSS framework)
- WebAudio API for sounds · `localStorage` for persistence
- **Vitest + fast-check** for unit and property-based tests
- Deployed as a static site on **GitHub Pages**

## Status (18 Nov 2026)

App complete and verified locally: `npm run typecheck` clean, 48 tests pass
(unit + property-based), production build succeeds, and a headless-browser
end-to-end run confirmed the full loop (start a 1-minute focus session →
session completes → ghost gains XP/hunger/energy → break phase → state
persists across reload). Mobile 360px layout verified with no overflow.
Not yet deployed (GitHub Pages) or submitted — those steps need the user
(Kiro sign-in, Devpost account, YouTube demo).

## Quick start

```bash
npm install
npm run dev      # start dev server
npm run build    # production build -> dist/
npm run preview  # preview the production build
npm run test     # unit + property-based tests
npm run typecheck
```

## How Kiro was used

> **Honesty note:** as of 18 Nov 2026, the app code itself was built by Muse (the
> operator's other coding agent) following the spec in `.kiro/specs/` — Kiro did
> **not** build the app from scratch. What Kiro genuinely did, in a real signed-in
> session on 18 Nov 2026 (Kiro CLI 3.4.0, Builder ID, session
> `sess_61d1046b-cabc-4df4-83ad-cecc39ab9782`): reviewed the codebase, confirmed
> the 47-test baseline, found a real DST bug in `computeBestStreak`
> (`src/lib/streaks.ts`, millisecond comparison falsely broke streaks across a
> spring-forward night), fixed it with calendar arithmetic, added one regression
> test, and verified typecheck + 48/48 tests + build pass. The submission
> write-up will describe only what Kiro genuinely did — nothing here claims
> otherwise. See the Kiro session log in [`PLAN.md`](PLAN.md).

The `.kiro/` directory is the record of the intended Kiro workflow:

- **Specs** — `.kiro/specs/focus-ghost/` contains `requirements.md` (EARS notation), `design.md`, and `tasks.md`; implementation followed the task list.
- **Steering** — `.kiro/steering/` holds `product.md`, `tech.md`, and `structure.md`, the always-on context for every Kiro session.
- **Hooks** — `.kiro/hooks/` automates typechecking on save and the test suite after each spec task.
- **Custom agent** — `.kiro/agents/ghost-writer.json` is a review agent that checks every change against the spec and the spooky design language.
- **Skills** — `.kiro/skills/pbt/` is an Agent Skill for property-based testing of the timer and streak logic.
- **MCP** — `.kiro/settings/mcp.json` wires the fetch MCP server so Kiro can pull reference docs during development.

See [`PLAN.md`](PLAN.md) for the full build plan and the Kiro session log.

## Project structure

```
focus-ghost/
├── .kiro/            # Kiro specs, steering, hooks, agents, skills, MCP
├── public/           # static assets
├── src/              # React + TypeScript source
│   ├── components/   # Timer, Ghost, Graveyard, Stats, Settings
│   ├── lib/          # timer engine, ghost state machine, storage, audio
│   └── App.tsx
├── index.html
├── package.json
├── PLAN.md
└── README.md
```

## License

MIT — see [LICENSE](LICENSE).
