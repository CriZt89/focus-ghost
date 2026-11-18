/**
 * Timer engine — pure functions, no DOM, no hidden clock.
 * The component drives `advanceTimer` with elapsed seconds computed from
 * explicit timestamps, so background-tab throttling cannot drift the timer.
 */

export type Phase = 'focus' | 'shortBreak' | 'longBreak'

export interface TimerLengths {
  focusMin: number
  shortBreakMin: number
  longBreakMin: number
}

export interface TimerState {
  phase: Phase
  remainingSeconds: number
  sessionsInCycle: number
  running: boolean
}

export type TimerEvent = 'SESSION_COMPLETED' | 'BREAK_COMPLETED'

export function phaseLengthSeconds(phase: Phase, lengths: TimerLengths): number {
  switch (phase) {
    case 'focus':
      return lengths.focusMin * 60
    case 'shortBreak':
      return lengths.shortBreakMin * 60
    case 'longBreak':
      return lengths.longBreakMin * 60
  }
}

export function initialTimerState(lengths: TimerLengths): TimerState {
  return {
    phase: 'focus',
    remainingSeconds: phaseLengthSeconds('focus', lengths),
    sessionsInCycle: 0,
    running: false,
  }
}

export function phaseLabel(phase: Phase): string {
  switch (phase) {
    case 'focus':
      return 'Focus'
    case 'shortBreak':
      return 'Short Break'
    case 'longBreak':
      return 'Long Break'
  }
}

/**
 * Advance the timer by `elapsedSeconds` (may span several phase boundaries).
 * Returns the new state plus the events that fired, in order.
 * `remainingSeconds` is never negative.
 */
export function advanceTimer(
  state: TimerState,
  lengths: TimerLengths,
  elapsedSeconds: number,
): { state: TimerState; events: TimerEvent[] } {
  let { phase, remainingSeconds, sessionsInCycle } = state
  const events: TimerEvent[] = []
  let remaining = elapsedSeconds

  while (remaining > 0) {
    if (remainingSeconds > remaining) {
      remainingSeconds -= remaining
      remaining = 0
    } else {
      remaining -= remainingSeconds
      if (phase === 'focus') {
        sessionsInCycle += 1
        events.push('SESSION_COMPLETED')
        phase = sessionsInCycle % 4 === 0 ? 'longBreak' : 'shortBreak'
      } else {
        events.push('BREAK_COMPLETED')
        phase = 'focus'
      }
      remainingSeconds = phaseLengthSeconds(phase, lengths)
    }
  }

  return { state: { phase, remainingSeconds, sessionsInCycle, running: state.running }, events }
}

/** Format seconds as mm:ss. */
export function formatTime(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds))
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}
