/**
 * Ghost state machine — pure functions.
 * Hunger and energy live in 0–100. XP and level drive evolution stages.
 */

export type GhostStage = 'Wisp' | 'Shade' | 'Spook' | 'Wraith' | 'Poltergeist'
export type GhostMood = 'happy' | 'neutral' | 'hungry' | 'weak' | 'ecstatic'

export interface GhostState {
  name: string
  hunger: number // 0–100
  energy: number // 0–100
  xp: number // XP toward the next level
  level: number // >= 1
}

export type GhostEvent = 'LEVEL_UP' | 'EVOLVED'

export function defaultGhost(): GhostState {
  return { name: 'Boo', hunger: 70, energy: 80, xp: 0, level: 1 }
}

/** XP needed to go from `level` to `level + 1`. */
export function xpForNextLevel(level: number): number {
  return 100 * level
}

export function stageForLevel(level: number): GhostStage {
  if (level >= 15) return 'Poltergeist'
  if (level >= 10) return 'Wraith'
  if (level >= 6) return 'Spook'
  if (level >= 3) return 'Shade'
  return 'Wisp'
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(100, value))
}

/**
 * Apply one completed focus session: hunger +15, energy +10, XP +25.
 * XP carries over across level-ups. Returns LEVEL_UP per level gained and
 * EVOLVED when the stage boundary is crossed.
 */
export function applySessionComplete(ghost: GhostState): {
  ghost: GhostState
  events: GhostEvent[]
} {
  const events: GhostEvent[] = []
  const stageBefore = stageForLevel(ghost.level)
  let { hunger, energy, xp, level } = ghost
  hunger = clamp01(hunger + 15)
  energy = clamp01(energy + 10)
  xp += 25
  while (xp >= xpForNextLevel(level)) {
    xp -= xpForNextLevel(level)
    level += 1
    events.push('LEVEL_UP')
  }
  if (stageForLevel(level) !== stageBefore) events.push('EVOLVED')
  return { ghost: { ...ghost, hunger, energy, xp, level }, events }
}

/**
 * Decay over `seconds` of distraction: hunger −1 per 30 s, energy −1 per 60 s.
 * `prevSeconds`/`newSeconds` are the accumulated distraction seconds before and
 * after this tick, so fractional remainders carry across ticks.
 */
export function decayStep(
  ghost: GhostState,
  prevSeconds: number,
  newSeconds: number,
): GhostState {
  const hungerLoss =
    Math.floor(newSeconds / 30) - Math.floor(prevSeconds / 30)
  const energyLoss =
    Math.floor(newSeconds / 60) - Math.floor(prevSeconds / 60)
  if (hungerLoss === 0 && energyLoss === 0) return ghost
  return {
    ...ghost,
    hunger: clamp01(ghost.hunger - hungerLoss),
    energy: clamp01(ghost.energy - energyLoss),
  }
}

/** Derive the ghost's mood. `ecstatic` is a transient celebration flag. */
export function deriveMood(ghost: GhostState, ecstatic: boolean): GhostMood {
  if (ecstatic) return 'ecstatic'
  if (ghost.energy < 25) return 'weak'
  if (ghost.hunger < 25) return 'hungry'
  if (ghost.hunger >= 60 && ghost.energy >= 60) return 'happy'
  return 'neutral'
}
