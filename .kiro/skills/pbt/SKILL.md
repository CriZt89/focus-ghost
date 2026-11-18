---
name: pbt
description: Write property-based tests with fast-check for Focus Ghost logic (timer, ghost state machine, streaks). Use when adding or changing any pure function in src/lib/.
---

# Property-Based Testing Skill — Focus Ghost

Use this skill whenever you write or change a pure function in `src/lib/`
(`timer.ts`, `ghost.ts`, `streaks.ts`, `store.ts`).

## Rules

1. **Test properties, not examples.** Every `test()` should state an invariant that
   must hold for ALL inputs, using `fast-check` arbitraries — not one hand-picked case.
2. **Import from `fast-check`:** `import fc from 'fast-check'`. Run with Vitest:
   `fc.assert(fc.property(<arbitrary>, (<input>) => { ... }))`.
3. **Generate realistic inputs.** Build arbitraries from the domain: session counts
   0–50, hunger/energy 0–100, XP 0–5000, day-records as dictionaries of
   `YYYY-MM-DD` → `{ focusMinutes 0–300, sessions 0–8 }`.
4. **Keep properties fast.** Default `numRuns: 100` is enough; raise to 500 only for
   the timer phase-cycle property.

## Required properties (from the spec)

### Timer (`timer.ts`)
- Remaining time is never negative after any sequence of ticks.
- Phase transitions form a cycle: focus → break → focus; every 4th focus completion
  yields a long break, the others a short break.
- Completing N focus sessions yields exactly ⌊N/4⌋ long breaks.

### Ghost (`ghost.ts`)
- After any sequence of `applySessionComplete` / `applyDecay` calls, hunger and
  energy stay within 0–100.
- Level never decreases, whatever the event sequence.
- The evolution stage always matches the level (Wisp 1–2, Shade 3–5, Spook 6–9,
  Wraith 10–14, Poltergeist 15+).

### Streaks (`streaks.ts`)
- The streak never exceeds the number of recorded days.
- Adding a session for today never decreases the streak.
- The heatmap bucket for a day is monotonic in focus minutes.

## Example

```ts
import fc from 'fast-check';
import { applyDecay } from './ghost';

test('hunger and energy stay within 0-100 under any event sequence', () => {
  fc.assert(
    fc.property(
      fc.array(fc.record({
        kind: fc.constantFrom('session', 'decay'),
        seconds: fc.integer({ min: 0, max: 3600 }),
      }), { minLength: 0, maxLength: 50 }),
      (events) => {
        let g = { hunger: 70, energy: 80, xp: 0, level: 1 };
        for (const e of events) {
          g = e.kind === 'session' ? applySessionComplete(g) : applyDecay(g, e.seconds);
        }
        expect(g.hunger).toBeGreaterThanOrEqual(0);
        expect(g.hunger).toBeLessThanOrEqual(100);
        expect(g.energy).toBeGreaterThanOrEqual(0);
        expect(g.energy).toBeLessThanOrEqual(100);
      },
    ),
  );
});
```

## When a property fails

1. Shrink: fast-check reports the minimal failing case — reproduce it as a unit test.
2. Fix the implementation, not the property, unless the property itself misstates
   the spec. If the spec is wrong, update the spec first (requirements.md) and note
   why.
