/**
 * Streaks and Graveyard math — pure functions over local calendar days.
 */

export interface DayRecord {
  focusMinutes: number
  sessions: number
}

export type DaysMap = Record<string, DayRecord>

/** Local date as YYYY-MM-DD. */
export function dayKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseDayKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

/** Immutable: record one completed focus session on the given day key. */
export function addSessionOnKey(
  days: DaysMap,
  key: string,
  focusMinutes: number,
): DaysMap {
  const prev = days[key] ?? { focusMinutes: 0, sessions: 0 }
  return {
    ...days,
    [key]: {
      focusMinutes: prev.focusMinutes + focusMinutes,
      sessions: prev.sessions + 1,
    },
  }
}

/** Immutable: record one completed focus session on `date`. */
export function addSession(
  days: DaysMap,
  date: Date,
  focusMinutes: number,
): DaysMap {
  return addSessionOnKey(days, dayKey(date), focusMinutes)
}

/**
 * Current streak: consecutive days with >= 1 session, walking backwards from
 * `today` (or from yesterday if today has no session yet).
 */
export function computeStreak(days: DaysMap, today: Date): number {
  let cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  if ((days[dayKey(cursor)]?.sessions ?? 0) === 0) {
    cursor = addDays(cursor, -1)
  }
  let streak = 0
  while ((days[dayKey(cursor)]?.sessions ?? 0) > 0) {
    streak += 1
    cursor = addDays(cursor, -1)
  }
  return streak
}

/** Longest run of consecutive days with >= 1 session in the whole record. */
export function computeBestStreak(days: DaysMap): number {
  const keys = Object.keys(days)
    .filter((k) => (days[k]?.sessions ?? 0) > 0)
    .sort()
  let best = 0
  let run = 0
  let prevKey: string | null = null
  for (const key of keys) {
    // Use dayKey(addDays(prev, 1)) instead of millisecond arithmetic so that
    // DST transitions (where two local midnights are only 23 h apart) don't
    // falsely break a consecutive-day run.
    if (prevKey !== null && dayKey(addDays(parseDayKey(prevKey), 1)) === key) {
      run += 1
    } else {
      run = 1
    }
    best = Math.max(best, run)
    prevKey = key
  }
  return best
}

/** Heatmap intensity level from focus minutes: 0, 1–14, 15–29, 30–59, 60+. */
export function heatmapBucket(focusMinutes: number): 0 | 1 | 2 | 3 | 4 {
  if (focusMinutes <= 0) return 0
  if (focusMinutes < 15) return 1
  if (focusMinutes < 30) return 2
  if (focusMinutes < 60) return 3
  return 4
}

export interface HeatmapCell {
  date: Date
  key: string
  focusMinutes: number
  sessions: number
  level: 0 | 1 | 2 | 3 | 4
  inFuture: boolean
}

/**
 * 26 weeks of cells ending on `today`, Sunday-first columns (like GitHub).
 * Returns weeks in chronological order; each week has 7 cells (Sun..Sat).
 */
export function heatmapWeeks(
  days: DaysMap,
  today: Date,
  weeks = 26,
): HeatmapCell[][] {
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  // Align the grid so the last cell is the Saturday of the current week,
  // and the first cell is the Sunday 26 weeks earlier.
  const endSaturday = addDays(end, 6 - end.getDay())
  const startSunday = addDays(endSaturday, -(weeks * 7 - 1))
  const result: HeatmapCell[][] = []
  for (let w = 0; w < weeks; w++) {
    const week: HeatmapCell[] = []
    for (let d = 0; d < 7; d++) {
      const date = addDays(startSunday, w * 7 + d)
      const key = dayKey(date)
      const rec = days[key]
      const minutes = rec?.focusMinutes ?? 0
      week.push({
        date,
        key,
        focusMinutes: minutes,
        sessions: rec?.sessions ?? 0,
        level: heatmapBucket(minutes),
        inFuture: date.getTime() > end.getTime(),
      })
    }
    result.push(week)
  }
  return result
}

/** Sum focus minutes and sessions in an inclusive date range. */
export function sumRange(
  days: DaysMap,
  start: Date,
  end: Date,
): { focusMinutes: number; sessions: number } {
  let focusMinutes = 0
  let sessions = 0
  for (let cursor = new Date(start); cursor <= end; cursor = addDays(cursor, 1)) {
    const rec = days[dayKey(cursor)]
    if (rec) {
      focusMinutes += rec.focusMinutes
      sessions += rec.sessions
    }
  }
  return { focusMinutes, sessions }
}
