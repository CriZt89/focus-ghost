import {
  dayKey,
  sumRange,
  type DaysMap,
} from '../lib/streaks.ts'

interface StatsProps {
  days: DaysMap
  today: Date
  currentStreak: number
  bestStreak: number
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

function shortDate(date: Date): string {
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`
}

export default function Stats({ days, today, currentStreak, bestStreak }: StatsProps) {
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const startOfWeek = addDays(startOfToday, -((startOfToday.getDay() + 6) % 7)) // Monday
  const todayStats = sumRange(days, startOfToday, startOfToday)
  const weekStats = sumRange(days, startOfWeek, startOfToday)
  const allTime = sumRange(days, new Date(2000, 0, 1), startOfToday)

  // Last 7 days with sessions, newest first.
  const recent: { date: Date; minutes: number; sessions: number }[] = []
  for (let i = 0; i < 14 && recent.length < 7; i++) {
    const date = addDays(startOfToday, -i)
    const rec = days[dayKey(date)]
    if (rec && rec.sessions > 0) {
      recent.push({ date, minutes: rec.focusMinutes, sessions: rec.sessions })
    }
  }

  return (
    <section className="panel stats-panel" aria-label="Focus statistics">
      <h2>📊 Stats</h2>
      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-value">{todayStats.focusMinutes}m</span>
          <span className="stat-label">Today · {todayStats.sessions} sessions</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{weekStats.focusMinutes}m</span>
          <span className="stat-label">This week · {weekStats.sessions} sessions</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{allTime.focusMinutes}m</span>
          <span className="stat-label">All time · {allTime.sessions} sessions</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">
            🔥 {currentStreak} <small>/ best {bestStreak}</small>
          </span>
          <span className="stat-label">Day streak</span>
        </div>
      </div>

      <h3>Recent focus days</h3>
      {recent.length === 0 ? (
        <p className="panel-sub">
          No sessions yet. Finish one focus session and your first day appears here.
        </p>
      ) : (
        <ul className="history-list">
          {recent.map(({ date, minutes, sessions }) => (
            <li key={dayKey(date)}>
              <span>{shortDate(date)}</span>
              <span>
                {minutes} min · {sessions} {sessions === 1 ? 'session' : 'sessions'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
