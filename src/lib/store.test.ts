import { describe, expect, it } from 'vitest'
import {
  defaultState,
  exportJson,
  importJson,
  loadState,
  saveState,
  STORAGE_KEY,
  type AppStateData,
  type StorageLike,
} from './store.ts'

function fakeStorage(initial?: Record<string, string>): StorageLike {
  const map = new Map<string, string>(Object.entries(initial ?? {}))
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => {
      map.set(k, v)
    },
    removeItem: (k) => {
      map.delete(k)
    },
  }
}

describe('loadState', () => {
  it('returns defaults with no storage', () => {
    const state = loadState(null)
    expect(state.ghost.level).toBe(1)
    expect(state.ghost.name).toBe('Boo')
    expect(state.days).toEqual({})
    expect(state.settings.focusMin).toBe(25)
  })

  it('returns defaults with empty storage', () => {
    expect(loadState(fakeStorage()).ghost.level).toBe(1)
  })

  it('returns defaults on corrupt JSON', () => {
    const storage = fakeStorage({ [STORAGE_KEY]: '{not json' })
    expect(loadState(storage).ghost.level).toBe(1)
  })

  it('returns defaults on unknown schema version', () => {
    const storage = fakeStorage({
      [STORAGE_KEY]: JSON.stringify({ version: 99, ghost: {}, days: {} }),
    })
    expect(loadState(storage).ghost.level).toBe(1)
  })

  it('returns defaults when required fields are missing', () => {
    const storage = fakeStorage({
      [STORAGE_KEY]: JSON.stringify({ version: 1, ghost: { name: 'Boo' } }),
    })
    expect(loadState(storage).ghost.level).toBe(1)
  })
})

describe('saveState / loadState round-trip', () => {
  it('restores ghost, days, and settings exactly', () => {
    const storage = fakeStorage()
    const state: AppStateData = {
      ...defaultState(),
      ghost: { name: 'Casper', hunger: 42, energy: 33, xp: 55, level: 3 },
      days: { '2026-11-18': { focusMinutes: 50, sessions: 2 } },
      sessionsInCycle: 2,
    }
    saveState(storage, state)
    const loaded = loadState(storage)
    expect(loaded).toEqual(state)
  })
})

describe('exportJson / importJson', () => {
  it('round-trips through JSON', () => {
    const state = defaultState()
    expect(importJson(exportJson(state))).toEqual(state)
  })

  it('throws on invalid JSON', () => {
    expect(() => importJson('nope')).toThrow()
  })

  it('throws on a wrong-version export', () => {
    expect(() => importJson(JSON.stringify({ version: 2 }))).toThrow()
  })
})
