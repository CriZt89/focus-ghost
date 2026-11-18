import { formatTime, phaseLabel, type Phase, type TimerState } from '../lib/timer.ts'

interface TimerProps {
  timer: TimerState
  totalSeconds: number
  onStart: () => void
  onPause: () => void
  onReset: () => void
  onSkip: () => void
  onSelectPhase: (phase: Phase) => void
}

const PHASES: Phase[] = ['focus', 'shortBreak', 'longBreak']

export default function Timer({
  timer,
  totalSeconds,
  onStart,
  onPause,
  onReset,
  onSkip,
  onSelectPhase,
}: TimerProps) {
  const progress =
    totalSeconds > 0
      ? Math.max(0, Math.min(1, timer.remainingSeconds / totalSeconds))
      : 0
  const progressPct = Math.round(progress * 100)

  return (
    <section className="panel timer-panel" aria-label="Pomodoro timer">
      <div className="phase-tabs" role="tablist" aria-label="Timer phase">
        {PHASES.map((phase) => (
          <button
            key={phase}
            role="tab"
            aria-selected={timer.phase === phase}
            className={timer.phase === phase ? 'phase-tab active' : 'phase-tab'}
            onClick={() => onSelectPhase(phase)}
            disabled={timer.running}
          >
            {phaseLabel(phase)}
          </button>
        ))}
      </div>

      <div
        className="countdown"
        role="timer"
        aria-label={`${phaseLabel(timer.phase)} timer, ${formatTime(timer.remainingSeconds)} remaining`}
      >
        {formatTime(timer.remainingSeconds)}
      </div>

      <div
        className="progress-track"
        role="progressbar"
        aria-valuenow={progressPct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Time remaining in this phase"
      >
        <div className="progress-fill" style={{ width: `${progressPct}%` }} />
      </div>

      <p className="cycle-note">
        {timer.sessionsInCycle % 4 === 0 && timer.sessionsInCycle > 0
          ? `${timer.sessionsInCycle} focus sessions done — long break earned.`
          : `${timer.sessionsInCycle % 4} of 4 focus sessions toward a long break.`}
      </p>

      <div className="timer-controls">
        {timer.running ? (
          <button className="btn primary" onClick={onPause}>
            ⏸ Pause
          </button>
        ) : (
          <button className="btn primary" onClick={onStart}>
            ▶ Start {phaseLabel(timer.phase)}
          </button>
        )}
        <button className="btn" onClick={onReset}>
          ↺ Reset
        </button>
        <button className="btn" onClick={onSkip}>
          ⏭ Skip
        </button>
      </div>
    </section>
  )
}
