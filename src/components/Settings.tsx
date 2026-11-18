import { useRef, useState } from 'react'
import type { Settings } from '../lib/store.ts'

interface SettingsProps {
  settings: Settings
  ghostName: string
  onSettingsChange: (settings: Settings) => void
  onRenameGhost: (name: string) => void
  onExport: () => void
  onImport: (file: File) => void
  onResetAll: () => void
}

function clampInt(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback
  return Math.max(min, Math.min(max, Math.round(value)))
}

export default function Settings({
  settings,
  ghostName,
  onSettingsChange,
  onRenameGhost,
  onExport,
  onImport,
  onResetAll,
}: SettingsProps) {
  const [name, setName] = useState(ghostName)
  const [confirmReset, setConfirmReset] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const set = (patch: Partial<Settings>) => {
    onSettingsChange({ ...settings, ...patch })
  }

  return (
    <section className="panel settings-panel" aria-label="Settings">
      <h2>⚙️ Settings</h2>

      <div className="settings-grid">
        <label>
          Focus length (minutes)
          <input
            type="number"
            min={1}
            max={180}
            value={settings.focusMin}
            onChange={(e) =>
              set({
                focusMin: clampInt(Number(e.target.value), 1, 180, settings.focusMin),
              })
            }
          />
        </label>
        <label>
          Short break (minutes)
          <input
            type="number"
            min={1}
            max={60}
            value={settings.shortBreakMin}
            onChange={(e) =>
              set({
                shortBreakMin: clampInt(
                  Number(e.target.value),
                  1,
                  60,
                  settings.shortBreakMin,
                ),
              })
            }
          />
        </label>
        <label>
          Long break (minutes)
          <input
            type="number"
            min={1}
            max={60}
            value={settings.longBreakMin}
            onChange={(e) =>
              set({
                longBreakMin: clampInt(
                  Number(e.target.value),
                  1,
                  60,
                  settings.longBreakMin,
                ),
              })
            }
          />
        </label>
        <label>
          Ghost name
          <span className="name-row">
            <input
              type="text"
              value={name}
              maxLength={24}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => {
                const trimmed = name.trim()
                if (trimmed && trimmed !== ghostName) onRenameGhost(trimmed)
                else setName(ghostName)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
              }}
            />
          </span>
        </label>
      </div>

      <div className="settings-toggles">
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={settings.soundOn}
            onChange={(e) => set({ soundOn: e.target.checked })}
          />
          Haunted sounds (WebAudio chimes &amp; whispers)
        </label>
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={settings.autoStart}
            onChange={(e) => set({ autoStart: e.target.checked })}
          />
          Auto-start the next phase when one ends
        </label>
      </div>

      <div className="settings-data">
        <button className="btn" onClick={onExport}>
          ⬇ Export data (JSON)
        </button>
        <button
          className="btn"
          onClick={() => fileRef.current?.click()}
        >
          ⬆ Import data
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onImport(file)
            e.target.value = ''
          }}
        />
        {confirmReset ? (
          <span className="reset-confirm">
            <button
              className="btn danger"
              onClick={() => {
                onResetAll()
                setConfirmReset(false)
              }}
            >
              Yes, erase everything
            </button>
            <button className="btn" onClick={() => setConfirmReset(false)}>
              Cancel
            </button>
          </span>
        ) : (
          <button className="btn danger" onClick={() => setConfirmReset(true)}>
            🗑 Reset all data
          </button>
        )}
      </div>
      <p className="panel-sub">
        All data lives only in this browser (localStorage). Export a backup before
        resetting — there is no undo.
      </p>
    </section>
  )
}
