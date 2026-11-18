import {
  deriveMood,
  stageForLevel,
  xpForNextLevel,
  type GhostMood,
  type GhostState,
} from '../lib/ghost.ts'

interface GhostProps {
  ghost: GhostState
  ecstatic: boolean
  whisper: string | null
}

const MOOD_FACE: Record<GhostMood, { eyes: string; mouth: string; label: string }> = {
  happy: {
    eyes: 'M -14 -4 Q -10 -10 -6 -4 M 6 -4 Q 10 -10 14 -4',
    mouth: 'M -8 8 Q 0 16 8 8',
    label: 'happy',
  },
  neutral: {
    eyes: 'M -14 -6 A 4 4 0 1 1 -6 -6 M 6 -6 A 4 4 0 1 1 14 -6',
    mouth: 'M -6 10 L 6 10',
    label: 'neutral',
  },
  hungry: {
    eyes: 'M -14 -6 A 4 4 0 1 1 -6 -6 M 6 -6 A 4 4 0 1 1 14 -6',
    mouth: 'M -8 12 Q 0 6 8 12',
    label: 'hungry',
  },
  weak: {
    eyes: 'M -14 -10 L -6 -2 M -6 -10 L -14 -2 M 6 -10 L 14 -2 M 14 -10 L 6 -2',
    mouth: 'M -6 12 Q 0 8 6 12',
    label: 'weak',
  },
  ecstatic: {
    eyes:
      'M -14 -12 L -12 -6 L -18 -6 L -13 -2 L -15 4 L -10 0 L -5 -4 M 14 -12 L 12 -6 L 18 -6 L 13 -2 L 15 4 L 10 0 L 5 -4',
    mouth: 'M -10 6 Q 0 20 10 6',
    label: 'ecstatic',
  },
}

export default function Ghost({ ghost, ecstatic, whisper }: GhostProps) {
  const stage = stageForLevel(ghost.level)
  const mood = deriveMood(ghost, ecstatic)
  const face = MOOD_FACE[mood]
  const xpNeeded = xpForNextLevel(ghost.level)
  const xpPct = Math.round((ghost.xp / xpNeeded) * 100)
  // Bigger ghost at higher stages; dimmer when hungry or weak.
  const scale = 0.85 + Math.min(ghost.level, 15) * 0.03
  const dimmed = mood === 'hungry' || mood === 'weak'

  return (
    <section
      className={`panel ghost-panel mood-${mood}`}
      aria-label={`Your ghost, ${ghost.name}`}
    >
      <div className="ghost-stage">
        <div className="ghost-svg-wrap" style={{ transform: `scale(${scale})` }}>
          <svg
            viewBox="-40 -50 80 100"
            width="180"
            height="220"
            role="img"
            aria-label={`${ghost.name}, a level ${ghost.level} ${stage} ghost, feeling ${face.label}`}
          >
            <g className={dimmed ? 'ghost-body dimmed' : 'ghost-body'}>
              <path
                d="M -32 22 L -32 -12 A 32 32 0 0 1 32 -12 L 32 22 L 24 14 L 16 22 L 8 14 L 0 22 L -8 14 L -16 22 L -24 14 Z"
                fill="currentColor"
              />
              <path
                d={face.eyes}
                stroke="#0b0714"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d={face.mouth}
                stroke="#0b0714"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
            </g>
            {ghost.level >= 6 && (
              <g className="ghost-wisps" fill="currentColor" opacity="0.45">
                <circle cx="-38" cy="8" r="4" />
                <circle cx="38" cy="2" r="3" />
                <circle cx="-30" cy="-34" r="3" />
              </g>
            )}
          </svg>
        </div>
        <p className="ghost-name" aria-live="polite">
          {ghost.name}
        </p>
        <p className="ghost-stage-label">
          Level {ghost.level} · {stage} · feeling {face.label}
        </p>
        {whisper && <p className="ghost-whisper">“{whisper}”</p>}
      </div>

      <div className="ghost-bars">
        <label className="bar-row">
          <span>🍖 Hunger</span>
          <span className="bar-value">{Math.round(ghost.hunger)} / 100</span>
          <span className="bar-track">
            <span
              className="bar-fill hunger"
              style={{ width: `${ghost.hunger}%` }}
            />
          </span>
        </label>
        <label className="bar-row">
          <span>⚡ Energy</span>
          <span className="bar-value">{Math.round(ghost.energy)} / 100</span>
          <span className="bar-track">
            <span
              className="bar-fill energy"
              style={{ width: `${ghost.energy}%` }}
            />
          </span>
        </label>
        <label className="bar-row">
          <span>✨ XP</span>
          <span className="bar-value">
            {ghost.xp} / {xpNeeded} to level {ghost.level + 1}
          </span>
          <span className="bar-track">
            <span className="bar-fill xp" style={{ width: `${xpPct}%` }} />
          </span>
        </label>
      </div>
    </section>
  )
}
