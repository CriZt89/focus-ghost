import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import {
  advanceTimer,
  formatTime,
  initialTimerState,
  phaseLengthSeconds,
  type TimerLengths,
  type TimerState,
} from './timer.ts'

const lengths: TimerLengths = { focusMin: 25, shortBreakMin: 5, longBreakMin: 15 }

describe('phaseLengthSeconds', () => {
  it('returns configured lengths in seconds', () => {
    expect(phaseLengthSeconds('focus', lengths)).toBe(1500)
    expect(phaseLengthSeconds('shortBreak', lengths)).toBe(300)
    expect(phaseLengthSeconds('longBreak', lengths)).toBe(900)
  })
})

describe('formatTime', () => {
  it('formats mm:ss with zero padding', () => {
    expect(formatTime(1500)).toBe('25:00')
    expect(formatTime(65)).toBe('01:05')
    expect(formatTime(0)).toBe('00:00')
    expect(formatTime(-5)).toBe('00:00')
  })
})

describe('advanceTimer', () => {
  it('counts down within a phase without events', () => {
    const start = initialTimerState(lengths)
    const { state, events } = advanceTimer(start, lengths, 60)
    expect(state.phase).toBe('focus')
    expect(state.remainingSeconds).toBe(1440)
    expect(events).toEqual([])
  })

  it('completes a focus phase into a short break with a session event', () => {
    const start = initialTimerState(lengths)
    const { state, events } = advanceTimer(start, lengths, 1500)
    expect(events).toEqual(['SESSION_COMPLETED'])
    expect(state.phase).toBe('shortBreak')
    expect(state.remainingSeconds).toBe(300)
    expect(state.sessionsInCycle).toBe(1)
  })

  it('gives a long break after the 4th focus session', () => {
    let state: TimerState = {
      phase: 'focus',
      remainingSeconds: 1500,
      sessionsInCycle: 3,
      running: true,
    }
    const res = advanceTimer(state, lengths, 1500)
    state = res.state
    expect(res.events).toEqual(['SESSION_COMPLETED'])
    expect(state.phase).toBe('longBreak')
    expect(state.sessionsInCycle).toBe(4)
  })

  it('returns to focus after a break', () => {
    const start: TimerState = {
      phase: 'shortBreak',
      remainingSeconds: 300,
      sessionsInCycle: 1,
      running: true,
    }
    const { state, events } = advanceTimer(start, lengths, 300)
    expect(events).toEqual(['BREAK_COMPLETED'])
    expect(state.phase).toBe('focus')
    expect(state.remainingSeconds).toBe(1500)
  })

  it('pausing is the component concern — advanceTimer never goes negative', () => {
    const start = initialTimerState(lengths)
    const { state } = advanceTimer(start, lengths, 100000)
    expect(state.remainingSeconds).toBeGreaterThanOrEqual(0)
  })
})

describe('timer properties', () => {
  const arbLengths = fc.record({
    focusMin: fc.integer({ min: 1, max: 60 }),
    shortBreakMin: fc.integer({ min: 1, max: 30 }),
    longBreakMin: fc.integer({ min: 1, max: 30 }),
  })
  const arbState = (): fc.Arbitrary<TimerState> =>
    fc.record({
      phase: fc.constantFrom('focus', 'shortBreak', 'longBreak') as fc.Arbitrary<
        TimerState['phase']
      >,
      remainingSeconds: fc.integer({ min: 1, max: 3600 }),
      sessionsInCycle: fc.integer({ min: 0, max: 12 }),
      running: fc.boolean(),
    })

  it('remaining time is never negative, for any advance', () => {
    fc.assert(
      fc.property(arbLengths, fc.integer({ min: 0, max: 200000 }), (l, secs) => {
        const start = initialTimerState(l)
        const { state } = advanceTimer(start, l, secs)
        expect(state.remainingSeconds).toBeGreaterThanOrEqual(0)
        expect(state.remainingSeconds).toBeLessThanOrEqual(
          Math.max(
            phaseLengthSeconds('focus', l),
            phaseLengthSeconds('shortBreak', l),
            phaseLengthSeconds('longBreak', l),
          ),
        )
      }),
      { numRuns: 200 },
    )
  })

  it('phase transitions form a cycle: focus -> break -> focus', () => {
    fc.assert(
      fc.property(arbLengths, arbState(), (l, s) => {
        const { state, events } = advanceTimer(s, l, s.remainingSeconds)
        if (events.includes('SESSION_COMPLETED')) {
          expect(state.phase === 'shortBreak' || state.phase === 'longBreak').toBe(
            true,
          )
        }
        if (events.includes('BREAK_COMPLETED')) {
          expect(state.phase).toBe('focus')
        }
      }),
      { numRuns: 200 },
    )
  })

  it('N focus sessions yield exactly floor(N/4) long breaks', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 40 }), (n) => {
        let state = initialTimerState(lengths)
        let longBreaks = 0
        // Run focus -> break cycles until n sessions complete.
        for (let i = 0; i < n; i++) {
          const focus = advanceTimer(
            { ...state, phase: 'focus', remainingSeconds: lengths.focusMin * 60 },
            lengths,
            lengths.focusMin * 60,
          )
          state = focus.state
          if (state.phase === 'longBreak') longBreaks += 1
          // Complete the break to return to focus.
          const brk = advanceTimer(
            state,
            lengths,
            phaseLengthSeconds(state.phase, lengths),
          )
          state = brk.state
        }
        expect(longBreaks).toBe(Math.floor(n / 4))
        expect(state.sessionsInCycle).toBe(n)
      }),
      { numRuns: 100 },
    )
  })
})
