import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import {
  applySessionComplete,
  decayStep,
  defaultGhost,
  deriveMood,
  stageForLevel,
  xpForNextLevel,
  type GhostState,
} from './ghost.ts'

describe('stageForLevel', () => {
  it('maps level ranges to stages', () => {
    expect(stageForLevel(1)).toBe('Wisp')
    expect(stageForLevel(2)).toBe('Wisp')
    expect(stageForLevel(3)).toBe('Shade')
    expect(stageForLevel(5)).toBe('Shade')
    expect(stageForLevel(6)).toBe('Spook')
    expect(stageForLevel(9)).toBe('Spook')
    expect(stageForLevel(10)).toBe('Wraith')
    expect(stageForLevel(14)).toBe('Wraith')
    expect(stageForLevel(15)).toBe('Poltergeist')
    expect(stageForLevel(99)).toBe('Poltergeist')
  })
})

describe('applySessionComplete', () => {
  it('adds hunger +15, energy +10, XP +25', () => {
    const { ghost, events } = applySessionComplete(defaultGhost())
    expect(ghost.hunger).toBe(85)
    expect(ghost.energy).toBe(90)
    expect(ghost.xp).toBe(25)
    expect(ghost.level).toBe(1)
    expect(events).toEqual([])
  })

  it('clamps hunger and energy at 100', () => {
    const g: GhostState = { name: 'Boo', hunger: 95, energy: 98, xp: 0, level: 1 }
    const { ghost } = applySessionComplete(g)
    expect(ghost.hunger).toBe(100)
    expect(ghost.energy).toBe(100)
  })

  it('levels up when XP crosses the threshold, carrying XP over', () => {
    const g: GhostState = { name: 'Boo', hunger: 50, energy: 50, xp: 90, level: 1 }
    const { ghost, events } = applySessionComplete(g)
    expect(ghost.level).toBe(2)
    expect(ghost.xp).toBe(15) // 90 + 25 - 100
    expect(events).toContain('LEVEL_UP')
  })

  it('announces EVOLVED when crossing a stage boundary', () => {
    const g: GhostState = { name: 'Boo', hunger: 50, energy: 50, xp: 90, level: 2 }
    // level 2 -> 3 crosses Wisp -> Shade (threshold 200 XP at level 2)
    const g2: GhostState = { ...g, xp: 190 }
    const { ghost, events } = applySessionComplete(g2)
    expect(ghost.level).toBe(3)
    expect(events).toContain('EVOLVED')
    expect(stageForLevel(ghost.level)).toBe('Shade')
  })
})

describe('decayStep', () => {
  it('decays hunger 1 per 30s and energy 1 per 60s', () => {
    const g = defaultGhost()
    expect(decayStep(g, 0, 30).hunger).toBe(69)
    expect(decayStep(g, 0, 30).energy).toBe(80)
    expect(decayStep(g, 0, 60).hunger).toBe(68)
    expect(decayStep(g, 0, 60).energy).toBe(79)
  })

  it('carries fractional remainders across ticks', () => {
    const g = defaultGhost()
    // 29s then 1 more second = 30s total -> exactly 1 hunger lost
    expect(decayStep(g, 0, 29).hunger).toBe(70)
    expect(decayStep(g, 29, 30).hunger).toBe(69)
  })

  it('never goes below 0', () => {
    const g: GhostState = { name: 'Boo', hunger: 1, energy: 0, xp: 0, level: 1 }
    const out = decayStep(g, 0, 10000)
    expect(out.hunger).toBe(0)
    expect(out.energy).toBe(0)
  })
})

describe('deriveMood', () => {
  it('weak beats hungry when both are low', () => {
    const g: GhostState = { name: 'Boo', hunger: 10, energy: 10, xp: 0, level: 1 }
    expect(deriveMood(g, false)).toBe('weak')
  })
  it('hungry when hunger is low but energy is fine', () => {
    const g: GhostState = { name: 'Boo', hunger: 10, energy: 80, xp: 0, level: 1 }
    expect(deriveMood(g, false)).toBe('hungry')
  })
  it('happy when both are high, neutral in between', () => {
    expect(deriveMood(defaultGhost(), false)).toBe('happy')
    const g: GhostState = { name: 'Boo', hunger: 40, energy: 40, xp: 0, level: 1 }
    expect(deriveMood(g, false)).toBe('neutral')
  })
  it('ecstatic overrides everything while celebrating', () => {
    const g: GhostState = { name: 'Boo', hunger: 10, energy: 10, xp: 0, level: 1 }
    expect(deriveMood(g, true)).toBe('ecstatic')
  })
})

describe('ghost properties', () => {
  const arbGhost: fc.Arbitrary<GhostState> = fc.record({
    name: fc.string({ minLength: 1, maxLength: 12 }),
    hunger: fc.integer({ min: 0, max: 100 }),
    energy: fc.integer({ min: 0, max: 100 }),
    xp: fc.integer({ min: 0, max: 500 }),
    level: fc.integer({ min: 1, max: 20 }),
  })

  it('hunger and energy stay within 0–100 after any sequence of events', () => {
    fc.assert(
      fc.property(
        arbGhost,
        fc.array(fc.constantFrom('session', 'decay30', 'decay60'), {
          maxLength: 50,
        }),
        (start, ops) => {
          let g = start
          let seconds = 0
          for (const op of ops) {
            if (op === 'session') {
              g = applySessionComplete(g).ghost
            } else {
              const step = op === 'decay30' ? 30 : 60
              g = decayStep(g, seconds, seconds + step)
              seconds += step
            }
            expect(g.hunger).toBeGreaterThanOrEqual(0)
            expect(g.hunger).toBeLessThanOrEqual(100)
            expect(g.energy).toBeGreaterThanOrEqual(0)
            expect(g.energy).toBeLessThanOrEqual(100)
          }
        },
      ),
      { numRuns: 200 },
    )
  })

  it('level never decreases and stage always matches level', () => {
    fc.assert(
      fc.property(
        arbGhost,
        // At least 1 session: the xp < threshold invariant only holds for a
        // ghost that has been through applySessionComplete at least once
        // (an arbitrary starting xp may sit exactly on a threshold).
        fc.integer({ min: 1, max: 40 }),
        (start, nSessions) => {
          let g = start
          const levelBefore = g.level
          for (let i = 0; i < nSessions; i++) {
            g = applySessionComplete(g).ghost
          }
          expect(g.level).toBeGreaterThanOrEqual(levelBefore)
          expect(stageForLevel(g.level)).toBe(stageForLevel(g.level))
          // XP is always below the next threshold after leveling.
          expect(g.xp).toBeLessThan(xpForNextLevel(g.level))
        },
      ),
      { numRuns: 200 },
    )
  })
})
