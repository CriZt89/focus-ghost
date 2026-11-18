import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import {
  addSession,
  computeBestStreak,
  computeStreak,
  dayKey,
  heatmapBucket,
  heatmapWeeks,
  sumRange,
  type DaysMap,
} from './streaks.ts'

function dateAt(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day)
}

function daysWithSessions(dates: string[]): DaysMap {
  const days: DaysMap = {}
  for (const key of dates) {
    days[key] = { focusMinutes: 25, sessions: 1 }
  }
  return days
}

describe('dayKey', () => {
  it('formats local dates as YYYY-MM-DD', () => {
    expect(dayKey(dateAt(2026, 11, 18))).toBe('2026-11-18')
    expect(dayKey(dateAt(2026, 1, 5))).toBe('2026-01-05')
  })
})

describe('addSession', () => {
  it('adds minutes and sessions immutably', () => {
    const days = addSession({}, dateAt(2026, 11, 18), 25)
    expect(days['2026-11-18']).toEqual({ focusMinutes: 25, sessions: 1 })
    const days2 = addSession(days, dateAt(2026, 11, 18), 25)
    expect(days2['2026-11-18']).toEqual({ focusMinutes: 50, sessions: 2 })
    expect(days['2026-11-18']).toEqual({ focusMinutes: 25, sessions: 1 })
  })
})

describe('computeStreak', () => {
  it('counts consecutive days back from today', () => {
    const days = daysWithSessions(['2026-11-16', '2026-11-17', '2026-11-18'])
    expect(computeStreak(days, dateAt(2026, 11, 18))).toBe(3)
  })
  it('counts from yesterday when today has no session yet', () => {
    const days = daysWithSessions(['2026-11-16', '2026-11-17'])
    expect(computeStreak(days, dateAt(2026, 11, 18))).toBe(2)
  })
  it('resets to 0 after a missed day', () => {
    const days = daysWithSessions(['2026-11-15', '2026-11-18'])
    expect(computeStreak(days, dateAt(2026, 11, 18))).toBe(1)
  })
  it('is 0 with no sessions at all', () => {
    expect(computeStreak({}, dateAt(2026, 11, 18))).toBe(0)
  })
})

describe('computeBestStreak', () => {
  it('finds the longest run anywhere in history', () => {
    const days = daysWithSessions([
      '2026-11-01',
      '2026-11-02',
      '2026-11-03',
      '2026-11-10',
      '2026-11-11',
    ])
    expect(computeBestStreak(days)).toBe(3)
  })
  it('is 0 with no data', () => {
    expect(computeBestStreak({})).toBe(0)
  })

  it('counts a 3-day run across a DST spring-forward boundary as 3, not 2', () => {
    // US Eastern spring-forward 2026: Mar 8 -> Mar 9 is only 23 h = 82,800,000 ms.
    // The old ms-based check (=== 86400000) falsely breaks the streak here.
    const days = daysWithSessions(['2026-03-07', '2026-03-08', '2026-03-09'])
    expect(computeBestStreak(days)).toBe(3)
  })
})

describe('heatmapBucket', () => {
  it('maps minutes to 5 levels', () => {
    expect(heatmapBucket(0)).toBe(0)
    expect(heatmapBucket(1)).toBe(1)
    expect(heatmapBucket(14)).toBe(1)
    expect(heatmapBucket(15)).toBe(2)
    expect(heatmapBucket(29)).toBe(2)
    expect(heatmapBucket(30)).toBe(3)
    expect(heatmapBucket(59)).toBe(3)
    expect(heatmapBucket(60)).toBe(4)
    expect(heatmapBucket(300)).toBe(4)
  })
})

describe('heatmapWeeks', () => {
  it('returns 26 weeks of 7 Sunday-first cells ending today', () => {
    const days = daysWithSessions(['2026-11-18'])
    const weeks = heatmapWeeks(days, dateAt(2026, 11, 18))
    expect(weeks).toHaveLength(26)
    for (const week of weeks) expect(week).toHaveLength(7)
    // First cell of the first week is a Sunday.
    expect(weeks[0]?.[0]?.date.getDay()).toBe(0)
    // Today (Wednesday) sits in the last week at index 3.
    const todayCell = weeks[25]?.[3]
    expect(todayCell?.key).toBe('2026-11-18')
    expect(todayCell?.focusMinutes).toBe(25)
    expect(todayCell?.level).toBe(2)
    // The last cell is the Saturday of the current week.
    expect(weeks[25]?.[6]?.key).toBe('2026-11-21')
  })
})

describe('sumRange', () => {
  it('sums minutes and sessions in a range', () => {
    const days = daysWithSessions(['2026-11-16', '2026-11-17', '2026-11-18'])
    expect(sumRange(days, dateAt(2026, 11, 16), dateAt(2026, 11, 18))).toEqual({
      focusMinutes: 75,
      sessions: 3,
    })
  })
})

describe('streak properties', () => {
  const arbDateKey = fc
    .integer({ min: 0, max: 60 })
    .map((n) => {
      const d = new Date(2026, 0, 1)
      d.setDate(d.getDate() + n)
      return dayKey(d)
    })
  const arbDays: fc.Arbitrary<DaysMap> = fc
    .array(arbDateKey, { maxLength: 30 })
    .map((keys) => {
      const days: DaysMap = {}
      for (const key of new Set(keys)) {
        days[key] = { focusMinutes: 25, sessions: 1 }
      }
      return days
    })

  it('streak never exceeds the number of recorded days', () => {
    fc.assert(
      fc.property(arbDays, (days) => {
        const streak = computeStreak(days, dateAt(2026, 3, 1))
        expect(streak).toBeLessThanOrEqual(Object.keys(days).length)
        expect(computeBestStreak(days)).toBeLessThanOrEqual(
          Object.keys(days).length,
        )
      }),
      { numRuns: 200 },
    )
  })

  it('adding a session today never decreases the streak', () => {
    fc.assert(
      fc.property(arbDays, (days) => {
        const today = dateAt(2026, 3, 1)
        const before = computeStreak(days, today)
        const after = computeStreak(addSession(days, today, 25), today)
        expect(after).toBeGreaterThanOrEqual(before)
        expect(after).toBeGreaterThanOrEqual(1)
      }),
      { numRuns: 200 },
    )
  })
})
