# Structure — Focus Ghost

```
focus-ghost/
├── .kiro/
│   ├── steering/          # product.md, tech.md, structure.md (always-on context)
│   ├── specs/
│   │   └── focus-ghost/   # requirements.md, design.md, tasks.md
│   ├── hooks/             # lint-on-save.json, test-on-task-complete.json
│   ├── skills/
│   │   └── pbt/           # property-based testing skill (SKILL.md)
│   ├── agents/            # ghost-writer.json (spec/design review agent)
│   ├── settings/
│   │   └── mcp.json       # MCP servers (fetch)
│   └── prompts/           # demo-script.md (demo video script prompt)
├── public/                # static assets (favicon, manifest)
├── src/
│   ├── components/
│   │   ├── Timer.tsx      # timer display + controls
│   │   ├── Ghost.tsx      # ghost rendering (SVG, mood/stage driven)
│   │   ├── Graveyard.tsx  # contribution heatmap
│   │   ├── Stats.tsx      # today/week/all-time stats
│   │   └── Settings.tsx   # timer lengths, sound, ghost name
│   ├── lib/
│   │   ├── timer.ts       # timer engine (pure)
│   │   ├── ghost.ts       # ghost state machine + evolution (pure)
│   │   ├── streaks.ts     # streak + graveyard math (pure)
│   │   ├── store.ts       # localStorage persistence (versioned)
│   │   └── audio.ts       # WebAudio sounds
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css          # spooky theme (custom properties)
├── index.html
├── package.json
├── PLAN.md
└── README.md
```

## Persistence schema

- Single `localStorage` key: `focus-ghost:v1`.
- Value: JSON object `{ version: 1, ghost: {...}, settings: {...}, days: { "YYYY-MM-DD": { focusMinutes, sessions } }, streak: {...} }`.
- On load, unknown/missing fields fall back to defaults; a future `v2` migrates from `v1`.

## Ghost evolution stages (by level)

| Level | Stage | Name |
|---|---|---|
| 1–2 | Wisp | a tiny glowing wisp |
| 3–5 | Shade | a small shade |
| 6–9 | Spook | a proper spook |
| 10–14 | Wraith | a wraith |
| 15+ | Poltergeist | a mighty poltergeist |

## File naming

- Components: `PascalCase.tsx`. Lib modules: `lowercase.ts`.
- Tests: colocated `*.test.ts` / `*.test.tsx` next to the module they test.
- Never commit `node_modules/` or `dist/`. Never add `.kiro/` to `.gitignore`.
