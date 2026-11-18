import { useState } from 'react'
import {
  heatmapWeeks,
  type DaysMap,
} from '../lib/streaks.ts'

interface GraveyardProps {
  days: DaysMap
  today: Date
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

function formatDay(date: Date, minutes: number, sessions: number): string {
  const month = MONTHS[date.getMonth()] ?? ''
  const day = date.getDate()
  const year = date.getFullYear()
  if (sessions === 0) return `${month} ${day}, ${year}: no focus yet — the grave is empty.`
  const plural = sessions === 1 ? 'session' : 'sessions'
  return `${month} ${day}, ${year}: ${minutes} focus minutes, ${sessions} ${plural}.`
}

export default function Graveyard({ days, today }: GraveyardProps) {
  const weeks = heatmapWeeks(days, today)
  const [selected, setSelected] = useState<string | null>(null)

  let selectedDetail: string | null = null
  if (selected) {
    outer: for (const week of weeks) {
      for (const cell of week) {
        if (cell.key === selected) {
          selectedDetail = formatDay(cell.date, cell.focusMinutes, cell.sessions)
          break outer
        }
      }
    }
  }

  return (
    <section className="panel graveyard-panel" aria-label="Graveyard — focus history heatmap">
      <h2>🪦 The Graveyard</h2>
      <p className="panel-sub">
        Every day you focus, a tombstone glows. 26 weeks of showing up.
      </p>
      <div className="heatmap" role="grid" aria-label="Focus minutes per day, last 26 weeks">
        {weeks.map((week, wi) => (
          <div key={wi} className="heatmap-week" role="row">
            {week.map((cell) => (
              <button
                key={cell.key}
                type="button"
                role="gridcell"
                className={`heatmap-cell level-${cell.level}${cell.inFuture ? ' future' : ''}${selected === cell.key ? ' selected' : ''}`}
                title={formatDay(cell.date, cell.focusMinutes, cell.sessions)}
                aria-label={formatDay(cell.date, cell.focusMinutes, cell.sessions)}
                disabled={cell.inFuture}
                onClick={() => setSelected(cell.key)}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="heatmap-legend" aria-hidden="true">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((l) => (
          <span key={l} className={`heatmap-cell level-${l} legend-cell`} />
        ))}
        <span>More</span>
      </div>
      <p className="day-detail" aria-live="polite">
        {selectedDetail ??
          'Select a tombstone to see that day — or hover for a quick peek.'}
      </p>
    </section>
  )
}
