import { useEffect, useReducer, useRef, useState } from 'react'
import Timer from './components/Timer.tsx'
import Ghost from './components/Ghost.tsx'
import Graveyard from './components/Graveyard.tsx'
import Stats from './components/Stats.tsx'
import Settings from './components/Settings.tsx'
import {
  advanceTimer,
  initialTimerState,
  phaseLabel,
  phaseLengthSeconds,
  type Phase,
  type TimerState,
} from './lib/timer.ts'
import {
  applySessionComplete,
  decayStep,
  deriveMood,
} from './lib/ghost.ts'
import {
  addSessionOnKey,
  computeBestStreak,
  computeStreak,
  dayKey,
} from './lib/streaks.ts'
import {
  browserStorage,
  defaultState,
  exportJson,
  importJson,
  loadState,
  saveState,
  type AppStateData,
  type Settings as AppSettings,
} from './lib/store.ts'
import { ensureAudioOnGesture, playSound } from './lib/audio.ts'

interface ReducerState {
  data: AppStateData
  timer: TimerState
  /** Day key of the day the current focus phase started (midnight credit). */
  focusStartKey: string
  /** Accumulated distraction seconds in the current episode (for decay math). */
  decaySeconds: number
}

type Action =
  | { type: 'ADVANCE'; timer: TimerState; completedFocus: boolean; focusMinutes: number }
  | { type: 'START' }
  | { type: 'PAUSE' }
  | { type: 'RESET_PHASE' }
  | { type: 'SKIP_PHASE' }
  | { type: 'SELECT_PHASE'; phase: Phase }
  | { type: 'SETTINGS'; settings: AppSettings }
  | { type: 'RENAME'; name: string }
  | { type: 'DECAY_TICK'; prevSeconds: number; newSeconds: number }
  | { type: 'IMPORT'; data: AppStateData }
  | { type: 'RESET_ALL' }

function lengthsOf(data: AppStateData) {
  return {
    focusMin: data.settings.focusMin,
    shortBreakMin: data.settings.shortBreakMin,
    longBreakMin: data.settings.longBreakMin,
  }
}

function reducer(state: ReducerState, action: Action): ReducerState {
  switch (action.type) {
    case 'ADVANCE': {
      let { data, focusStartKey } = state
      if (action.completedFocus) {
        const { ghost } = applySessionComplete(data.ghost)
        data = {
          ...data,
          ghost,
          days: addSessionOnKey(data.days, focusStartKey, action.focusMinutes),
          sessionsInCycle: action.timer.sessionsInCycle,
        }
      }
      // Track the day a fresh focus phase starts.
      if (action.timer.phase === 'focus' && state.timer.phase !== 'focus') {
        focusStartKey = dayKey(new Date())
      }
      return { ...state, data, timer: action.timer, focusStartKey }
    }
    case 'START':
      return { ...state, timer: { ...state.timer, running: true } }
    case 'PAUSE':
      return { ...state, timer: { ...state.timer, running: false } }
    case 'RESET_PHASE': {
      const lengths = lengthsOf(state.data)
      return {
        ...state,
        timer: {
          ...state.timer,
          remainingSeconds: phaseLengthSeconds(state.timer.phase, lengths),
          running: false,
        },
      }
    }
    case 'SKIP_PHASE': {
      const lengths = lengthsOf(state.data)
      let nextPhase: Phase
      if (state.timer.phase === 'focus') {
        // Skip without credit: no session recorded, no cycle increment.
        nextPhase = state.timer.sessionsInCycle % 4 === 3 ? 'longBreak' : 'shortBreak'
      } else {
        nextPhase = 'focus'
      }
      return {
        ...state,
        timer: {
          phase: nextPhase,
          remainingSeconds: phaseLengthSeconds(nextPhase, lengths),
          sessionsInCycle: state.timer.sessionsInCycle,
          running: false,
        },
        focusStartKey:
          nextPhase === 'focus' ? dayKey(new Date()) : state.focusStartKey,
      }
    }
    case 'SELECT_PHASE': {
      const lengths = lengthsOf(state.data)
      return {
        ...state,
        timer: {
          phase: action.phase,
          remainingSeconds: phaseLengthSeconds(action.phase, lengths),
          sessionsInCycle: state.timer.sessionsInCycle,
          running: false,
        },
        focusStartKey:
          action.phase === 'focus' ? dayKey(new Date()) : state.focusStartKey,
      }
    }
    case 'SETTINGS': {
      const data = { ...state.data, settings: action.settings }
      // If the timer is idle, apply the new length to the current phase.
      if (state.timer.running) return { ...state, data }
      const lengths = lengthsOf(data)
      return {
        ...state,
        data,
        timer: {
          ...state.timer,
          remainingSeconds: phaseLengthSeconds(state.timer.phase, lengths),
        },
      }
    }
    case 'RENAME':
      return { ...state, data: { ...state.data, ghost: { ...state.data.ghost, name: action.name } } }
    case 'DECAY_TICK':
      return {
        ...state,
        data: {
          ...state.data,
          ghost: decayStep(state.data.ghost, action.prevSeconds, action.newSeconds),
        },
        decaySeconds: action.newSeconds,
      }
    case 'IMPORT': {
      const lengths = lengthsOf(action.data)
      return {
        data: action.data,
        timer: initialTimerState(lengths),
        focusStartKey: dayKey(new Date()),
        decaySeconds: 0,
      }
    }
    case 'RESET_ALL': {
      const data = defaultState()
      return {
        data,
        timer: initialTimerState(lengthsOf(data)),
        focusStartKey: dayKey(new Date()),
        decaySeconds: 0,
      }
    }
  }
}

const WHISPERS = [
  'psst… the fog remembers every session.',
  'somewhere, a candle flickers for your focus.',
  'the graveyard grows quieter when you show up.',
  'boo. (that was encouragement.)',
  'your streak is a lantern in the dark.',
  'the walls whisper: one more session…',
]

const DISTRACTION_GRACE_SECONDS = 10

function initState(): ReducerState {
  const data = loadState(browserStorage())
  return {
    data,
    timer: initialTimerState(lengthsOf(data)),
    focusStartKey: dayKey(new Date()),
    decaySeconds: 0,
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, initState)
  const [announcement, setAnnouncement] = useState(
    'Welcome back. Your ghost is waiting.',
  )
  const [ecstatic, setEcstatic] = useState(false)
  const [warning, setWarning] = useState<number | null>(null) // seconds left in grace
  const [whisper, setWhisper] = useState<string | null>(null)
  const [importMessage, setImportMessage] = useState<string | null>(null)

  const stateRef = useRef(state)
  stateRef.current = state
  const lastTickRef = useRef<number>(Date.now())
  const lastActivityRef = useRef<number>(Date.now())
  const warningStartRef = useRef<number | null>(null)
  const decaySecondsRef = useRef(0)
  const lastWhisperRef = useRef<number>(0)

  const { data, timer } = state
  const ghost = data.ghost
  const mood = deriveMood(ghost, ecstatic)
  const today = new Date()
  const streak = computeStreak(data.days, today)
  const bestStreak = computeBestStreak(data.days)

  // Persist (debounced) on every data change.
  useEffect(() => {
    const handle = window.setTimeout(() => {
      saveState(browserStorage(), stateRef.current.data)
    }, 300)
    return () => window.clearTimeout(handle)
  }, [data])

  // Main tick loop: 250 ms, timestamp-based so background throttling can't drift.
  useEffect(() => {
    const id = window.setInterval(() => {
      const now = Date.now()
      const elapsed = (now - lastTickRef.current) / 1000
      lastTickRef.current = now
      const current = stateRef.current
      if (!current.timer.running) return
      const lengths = lengthsOf(current.data)
      const { state: nextTimer, events } = advanceTimer(
        current.timer,
        lengths,
        elapsed,
      )
      const sessionCompleted = events.includes('SESSION_COMPLETED')
      const focusMinutes = lengths.focusMin
      dispatch({
        type: 'ADVANCE',
        timer: {
          ...nextTimer,
          running: current.data.settings.autoStart
            ? true
            : events.length === 0,
        },
        completedFocus: sessionCompleted,
        focusMinutes,
      })
      if (sessionCompleted) {
        const { events: ghostEvents } = applySessionComplete(current.data.ghost)
        if (current.data.settings.soundOn) playSound('chime', true)
        if (ghostEvents.includes('LEVEL_UP')) {
          if (current.data.settings.soundOn) playSound('levelup', true)
          setEcstatic(true)
          window.setTimeout(() => setEcstatic(false), 5000)
        }
        if (ghostEvents.includes('EVOLVED')) {
          if (current.data.settings.soundOn) playSound('whisper', true)
        }
        setAnnouncement(
          `Focus session complete! ${current.data.ghost.name} gained 25 XP and feels stronger.`,
        )
        if (
          'Notification' in window &&
          Notification.permission === 'granted'
        ) {
          new Notification('Focus session complete! 👻', {
            body: `${current.data.ghost.name} gained 25 XP. Time for a break.`,
          })
        }
      } else if (events.includes('BREAK_COMPLETED')) {
        setAnnouncement('Break over. Time to focus again.')
        if (
          'Notification' in window &&
          Notification.permission === 'granted'
        ) {
          new Notification('Break over — back to focus! 👻', {
            body: 'Your ghost is ready for the next session.',
          })
        }
      }
    }, 250)
    return () => window.clearInterval(id)
  }, [])

  // Distraction detection: tab hidden or 60 s idle during a focus phase.
  useEffect(() => {
    const markActivity = () => {
      lastActivityRef.current = Date.now()
    }
    const onVisibility = () => {
      if (!document.hidden) markActivity()
    }
    window.addEventListener('mousemove', markActivity)
    window.addEventListener('keydown', markActivity)
    document.addEventListener('visibilitychange', onVisibility)

    const id = window.setInterval(() => {
      const current = stateRef.current
      const isFocusRunning =
        current.timer.running && current.timer.phase === 'focus'
      const idleSeconds = (Date.now() - lastActivityRef.current) / 1000
      const distracted = isFocusRunning && (document.hidden || idleSeconds >= 60)
      if (!distracted) {
        if (warningStartRef.current !== null) {
          warningStartRef.current = null
          decaySecondsRef.current = 0
          setWarning(null)
          dispatch({ type: 'DECAY_TICK', prevSeconds: 0, newSeconds: 0 })
        }
        return
      }
      if (warningStartRef.current === null) {
        warningStartRef.current = Date.now()
      }
      const warnedFor = (Date.now() - warningStartRef.current) / 1000
      if (warnedFor < DISTRACTION_GRACE_SECONDS) {
        setWarning(Math.ceil(DISTRACTION_GRACE_SECONDS - warnedFor))
        return
      }
      setWarning(null)
      const prev = decaySecondsRef.current
      const next = prev + 1
      decaySecondsRef.current = next
      dispatch({ type: 'DECAY_TICK', prevSeconds: prev, newSeconds: next })
    }, 1000)
    return () => {
      window.clearInterval(id)
      window.removeEventListener('mousemove', markActivity)
      window.removeEventListener('keydown', markActivity)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  // Haunted whispers during breaks.
  useEffect(() => {
    const id = window.setInterval(() => {
      const current = stateRef.current
      if (current.timer.phase === 'focus') {
        if (whisper) setWhisper(null)
        return
      }
      if (Date.now() - lastWhisperRef.current > 18000) {
        lastWhisperRef.current = Date.now()
        setWhisper(WHISPERS[Math.floor(Math.random() * WHISPERS.length)] ?? null)
      }
    }, 2000)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [whisper])

  const handleStart = () => {
    ensureAudioOnGesture()
    if ('Notification' in window && Notification.permission === 'default') {
      void Notification.requestPermission()
    }
    lastTickRef.current = Date.now()
    lastActivityRef.current = Date.now()
    dispatch({ type: 'START' })
    setAnnouncement(`${phaseLabel(timer.phase)} started. Stay with your ghost.`)
  }

  const handleExport = () => {
    const blob = new Blob([exportJson(data)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'focus-ghost-export.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async (file: File) => {
    try {
      const text = await file.text()
      const imported = importJson(text)
      dispatch({ type: 'IMPORT', data: imported })
      setImportMessage('Import complete — your ghost and history were restored.')
    } catch {
      setImportMessage('That file is not a valid Focus Ghost export.')
    }
  }

  return (
    <div className="app">
      <div className="fog fog-a" aria-hidden="true" />
      <div className="fog fog-b" aria-hidden="true" />

      <header className="header">
        <h1>
          👻 FOCUS GHOST
        </h1>
        <p className="tagline">Your focus has a soul. Feed it, or it fades.</p>
      </header>

      <div className="sr-only" aria-live="polite">
        {announcement}
      </div>

      {warning !== null && (
        <div className="warning-banner" role="alert">
          ⚠️ Your ghost senses you drifting away… return within {warning}s or
          it weakens.
        </div>
      )}
      {mood === 'weak' && warning === null && timer.running && timer.phase === 'focus' && (
        <div className="warning-banner weak" role="alert">
          🥀 {ghost.name} is weak — finish this session to feed it.
        </div>
      )}

      <main className="layout">
        <Ghost ghost={ghost} ecstatic={ecstatic} whisper={whisper} />
        <Timer
          timer={timer}
          totalSeconds={phaseLengthSeconds(
            timer.phase,
            lengthsOf(data),
          )}
          onStart={handleStart}
          onPause={() => dispatch({ type: 'PAUSE' })}
          onReset={() => dispatch({ type: 'RESET_PHASE' })}
          onSkip={() => dispatch({ type: 'SKIP_PHASE' })}
          onSelectPhase={(phase) => dispatch({ type: 'SELECT_PHASE', phase })}
        />
        <Graveyard days={data.days} today={today} />
        <Stats
          days={data.days}
          today={today}
          currentStreak={streak}
          bestStreak={bestStreak}
        />
        <Settings
          settings={data.settings}
          ghostName={ghost.name}
          onSettingsChange={(settings) => dispatch({ type: 'SETTINGS', settings })}
          onRenameGhost={(name) => dispatch({ type: 'RENAME', name })}
          onExport={handleExport}
          onImport={(file) => void handleImport(file)}
          onResetAll={() => dispatch({ type: 'RESET_ALL' })}
        />
      </main>

      {importMessage && (
        <p className="import-message" role="status">
          {importMessage}
        </p>
      )}

      <footer className="footer">
        <p>
          Focus Ghost — Kiroween 2026, Frankenstein category. Fully client-side:
          no account, no backend, no tracking. Your ghost lives only in this
          browser.
        </p>
      </footer>
    </div>
  )
}
