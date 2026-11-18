# PLAN.md — Focus Ghost (Kiroween 2026)

**Category:** Frankenstein
**Concept:** Pomodoro timer × Tamagotchi virtual pet × GitHub contribution graph × RPG progression — one haunted productivity companion.
**Repo:** `focus-ghost` (public GitHub, MIT license)
**Deployment:** GitHub Pages (static site, no backend, no API keys)
**Deadline:** 4 Dec 2026 22:00 UTC = **5 Dec 2026 05:00 WIB**

> **Honesty note (important):** the `.kiro/` scaffolding in this repo (specs, steering, hooks,
> agents, skills, MCP config) was authored as the starting point for real Kiro CLI sessions.
> It must be **executed, refined, and validated by actual `kiro-cli` sessions after the user
> signs in** (see "Kiro usage plan" below). The submission write-up must describe only what
> Kiro genuinely did. Nothing here claims Kiro built code it did not build. The Kiro session
> log at the bottom of this file is the record of truth — fill it in as sessions happen.

## 1. Concept (one paragraph)

Focus Ghost is a focus app with a soul. A ghost lives in your browser tab. You run
Pomodoro focus sessions to feed it; it gains XP, levels up, and evolves through five
stages (Wisp → Shade → Spook → Wraith → Poltergeist). Switch tabs or go idle during a
focus session and the ghost weakens — its hunger drops, its mood sours, its glow dims.
Every focused day plants a tombstone in the Graveyard, a GitHub-style heatmap of your
habit. The UI is dark, foggy, and glowing: focus as a séance.

## 2. Why Frankenstein (and why this wins)

- **Frankenstein fit:** four incompatible things stitched into one app — timer, virtual pet,
  contribution graph, RPG progression. The stitch is the thesis: *your focus has a soul,
  and the soul is the pet*.
- **All five judging criteria covered:** real problem (focus/procrastination) → Impact;
  deep Kiro usage (specs, steering, hooks, agents, skills, MCP) → Technological
  Implementation; polished spooky product, not a demo → Design; unusual combination →
  Innovation; clear demo story ("feed your ghost") → Presentation.
- **Zero external dependencies at runtime:** fully client-side, `localStorage` only. Judges
  can test the whole app with no account, no key, no backend to be down.
- **Scope is controllable:** the MVP is one screen (timer + ghost + graveyard + stats).
  Stretch features are additive, never load-bearing.

## 3. Features

### MVP (must-have)
1. Pomodoro timer: focus (25 min default) / short break (5) / long break (15), customizable
   lengths, pause/resume/reset, auto-start next phase (optional), desktop notification on
   phase end.
2. Ghost state machine: hunger (0–100), energy (0–100), mood (happy / neutral / hungry /
   weak / ecstatic), XP + level, evolution stage derived from level. Focus session
   completed → +XP, +hunger, +energy. Tab hidden / idle during focus → hunger and energy
   decay (visible warning first).
3. Streaks: daily streak (a day counts if ≥ 1 completed focus session), best streak,
   total focus minutes, sessions completed.
4. Graveyard heatmap: last ~26 weeks of days, intensity by focus minutes; tooltip per day.
5. Stats panel: today / this week / all-time.
6. Settings: timer lengths, sound on/off, ghost name (rename your ghost).
7. Persistence: all state in `localStorage` under a versioned key; export/import JSON.

### Stretch (if time allows)
8. Haunted sounds via WebAudio (chime on complete, whisper on level-up, heartbeat when weak).
9. Ghost "hauntings": random spooky events (flicker, whisper text) during breaks.
10. Session history list + per-day detail view.
11. PWA niceties (installable, offline) — static site already works offline after first load.

## 4. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Build | Vite 6 + React 19 + TypeScript (strict) | Fast, standard, easy for judges to run |
| Styling | Plain CSS, custom properties | No framework risk; full control of spooky theme |
| State | React state + `useReducer`, `localStorage` | No backend; trivially testable pure logic in `src/lib/` |
| Sound | WebAudio API (synthesized, no files) | No audio assets to ship |
| Tests | Vitest + fast-check (property-based) | PBT for timer + streak logic (Kiro skill: `.kiro/skills/pbt/`) |
| Deploy | GitHub Pages (static `dist/`) | Free, reliable, no account beyond GitHub |
| Video | Remotion (already installed as skills) | Scripted demo video, < 3 min, for YouTube |

## 5. Build steps (phased)

### Phase 0 — Kiro sign-in (user action, blocking)
- [ ] User runs `kiro-cli login --use-device-flow` flow: open the URL + enter the code on
      their phone, sign in with Google / GitHub / AWS Builder ID.
- [ ] Verify: `kiro-cli whoami` shows the account; `kiro-cli doctor` is green.
- [ ] Optional but recommended: user decides on the 4,000-credit ID verification
      (selfie + government ID via Didit) and submits the Credit Request Form
      **before 1 Dec 2026 12:00 PT**. Without it, the free tier (50 credits/month,
      cheap open-weight models) is the budget — plan Kiro sessions accordingly.

### Phase 1 — Spec & scaffold (17–19 Nov)
- [ ] Kiro CLI session 1: review `.kiro/specs/focus-ghost/` (requirements/design/tasks),
      refine, approve.
- [ ] Scaffold Vite app (`npm create vite@latest` or manual), install deps, verify
      `npm run dev` + `npm run build` work.
- [ ] Kiro CLI session 2: implement skeleton (layout, routing-free single page, theme CSS).

### Phase 2 — Core features (20–26 Nov)
- [ ] Timer engine (`src/lib/timer.ts`) + tests — pure logic, PBT via the pbt skill.
- [ ] Ghost state machine (`src/lib/ghost.ts`) + evolution + decay rules + tests.
- [ ] Streaks + storage (`src/lib/store.ts`) + Graveyard heatmap component.
- [ ] Stats + Settings + sounds (WebAudio).
- [ ] Hooks run on every save (typecheck) and after each spec task (tests).

### Phase 3 — Polish & deploy (27 Nov–1 Dec)
- [ ] UI polish pass (spooky design language: fog, glow, ghost animation states).
- [ ] Accessibility + mobile layout pass (judges may open on phones).
- [ ] Deploy to GitHub Pages; verify the live URL end-to-end.
- [ ] Credit Request Form submitted (if user agreed) before 1 Dec 12:00 PT.

### Phase 4 — Demo & submit (2–4 Dec)
- [ ] Demo video script (`.kiro/prompts/demo-script.md`) → Remotion render → < 3 min.
- [ ] Upload video to public YouTube (user action).
- [ ] README final, Kiro-usage write-up (from the session log below, truthful only).
- [ ] Devpost draft saved early; final submit before **5 Dec 2026 05:00 WIB**.
- [ ] Optional bonuses: X post with `#KiroweenHackathon26` (Social Blitz), public blog
      post about Kiro + this project (Bonus Blog, top 100).

## 6. Kiro usage plan (what Kiro genuinely does)

| Kiro feature | How it is used in this project |
|---|---|
| Spec-driven dev | `.kiro/specs/focus-ghost/` — requirements (EARS) → design → tasks; tasks executed in order |
| Steering | `.kiro/steering/` product/tech/structure — always-on context for every session |
| Custom agent | `.kiro/agents/ghost-writer.json` — reviews each change against spec + design language |
| Hooks | `.kiro/hooks/` — typecheck on save; full test suite after each spec task |
| Skills | `.kiro/skills/pbt/` — property-based testing skill for timer/streak logic |
| MCP | `.kiro/settings/mcp.json` — fetch server so Kiro can pull reference docs |
| Powers | (to be added after first session if a fitting power is found; not claimed otherwise) |

**Validation rule:** all `.kiro/*.json` configs (hooks, agents, MCP) must be validated by
`kiro-cli doctor` / the first Kiro session after sign-in. Fix schema errors there, not by
guessing. The Kiro CLI version in use is 3.4.0.

## 7. Submission checklist (Devpost)

- [ ] Public GitHub repo, MIT license visible, `/.kiro` at root and NOT in `.gitignore`
- [ ] Working app URL (GitHub Pages), free to test, no login needed
- [ ] Text description (features + functionality)
- [ ] Demo video < 3 min, public on YouTube
- [ ] Category: Frankenstein (+ Bonus Blog / Social Blitz if done)
- [ ] Kiro-usage write-up (truthful, from the session log)
- [ ] No third-party trademarks / copyrighted music in the video

## 8. Kiro session log (record of truth — fill in as sessions happen)

| # | Date (WIB) | Session | What Kiro did | Credits/model (if known) |
|---|---|---|---|---|
| 0 | 17 Nov 2026 | — | Repo scaffold + `.kiro/` starting specs/steering/hooks/agents/skills authored (by Muse, pre-Kiro-sign-in) — NOT Kiro work; Kiro sessions start after user sign-in. | — |
| 0b | 18 Nov 2026 | — | **App built by Muse (NOT Kiro):** full Vite + React + TS implementation per `.kiro/specs/focus-ghost/tasks.md` tasks 1–18 (timer engine, ghost state machine, streaks/graveyard, store, WebAudio, all 5 components, styles). 47 tests pass (unit + fast-check PBT); production build green; headless-browser E2E verified the full session loop, persistence, keyboard nav, and 360px layout; fixed a mobile overflow bug (grid min-width) and a missing favicon. No Kiro session was involved — Kiro CLI still not signed in. | — |
| 1 | | | | |
| 2 | | | | |

## 9. Open questions

- Which sign-in will the user use for Kiro (Google / GitHub / AWS Builder ID)?
- Is the user willing to do the Didit ID verification for the 4,000 credits? (Deadline 1 Dec 12:00 PT.)
- Ghost name default: "Boo"? (decide in Phase 1; user can rename in Settings anyway.)
