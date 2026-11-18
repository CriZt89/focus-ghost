/**
 * Persistence — versioned localStorage state with safe fallbacks.
 * `StorageLike` is injected so tests can pass a fake; in the browser it is
 * `window.localStorage`.
 */
import { defaultGhost, type GhostState } from './ghost.ts'
import type { DaysMap } from './streaks.ts'

export const STORAGE_KEY = 'focus-ghost:v1'
export const STORAGE_VERSION = 1

export interface Settings {
  focusMin: number
  shortBreakMin: number
  longBreakMin: number
  soundOn: boolean
  autoStart: boolean
}

export interface AppStateData {
  version: 1
  ghost: GhostState
  days: DaysMap
  settings: Settings
  sessionsInCycle: number
}

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export function browserStorage(): StorageLike | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage
    }
  } catch {
    // storage unavailable (private mode, SSR) — fall through
  }
  return null
}

export function defaultSettings(): Settings {
  return {
    focusMin: 25,
    shortBreakMin: 5,
    longBreakMin: 15,
    soundOn: true,
    autoStart: false,
  }
}

export function defaultState(): AppStateData {
  return {
    version: 1,
    ghost: defaultGhost(),
    days: {},
    settings: defaultSettings(),
    sessionsInCycle: 0,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

/** Validate an unknown parsed value; returns a full state or null. */
export function validateState(value: unknown): AppStateData | null {
  if (!isRecord(value)) return null
  if (value.version !== STORAGE_VERSION) return null
  const ghost = value.ghost
  const settings = value.settings
  const days = value.days
  if (!isRecord(ghost) || !isRecord(settings) || !isRecord(days)) return null
  if (
    typeof ghost.name !== 'string' ||
    !isFiniteNumber(ghost.hunger) ||
    !isFiniteNumber(ghost.energy) ||
    !isFiniteNumber(ghost.xp) ||
    !isFiniteNumber(ghost.level)
  ) {
    return null
  }
  if (
    !isFiniteNumber(settings.focusMin) ||
    !isFiniteNumber(settings.shortBreakMin) ||
    !isFiniteNumber(settings.longBreakMin) ||
    typeof settings.soundOn !== 'boolean' ||
    typeof settings.autoStart !== 'boolean'
  ) {
    return null
  }
  if (
    settings.focusMin < 1 ||
    settings.focusMin > 180 ||
    settings.shortBreakMin < 1 ||
    settings.shortBreakMin > 60 ||
    settings.longBreakMin < 1 ||
    settings.longBreakMin > 60
  ) {
    return null
  }
  for (const rec of Object.values(days)) {
    if (
      !isRecord(rec) ||
      !isFiniteNumber(rec.focusMinutes) ||
      !isFiniteNumber(rec.sessions)
    ) {
      return null
    }
  }
  if (!isFiniteNumber(value.sessionsInCycle)) return null
  return value as unknown as AppStateData
}

/** Load saved state; missing / corrupt / unknown version → defaults. */
export function loadState(storage: StorageLike | null): AppStateData {
  if (!storage) return defaultState()
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return defaultState()
    const parsed: unknown = JSON.parse(raw)
    return validateState(parsed) ?? defaultState()
  } catch {
    return defaultState()
  }
}

/** Persist the full state. Failures (quota, private mode) are swallowed. */
export function saveState(storage: StorageLike | null, state: AppStateData): void {
  if (!storage) return
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore — the app keeps working in memory
  }
}

export function exportJson(state: AppStateData): string {
  return JSON.stringify(state, null, 2)
}

/** Parse an imported export file; throws on anything invalid. */
export function importJson(json: string): AppStateData {
  const parsed: unknown = JSON.parse(json)
  const state = validateState(parsed)
  if (!state) throw new Error('Invalid Focus Ghost export file.')
  return state
}
