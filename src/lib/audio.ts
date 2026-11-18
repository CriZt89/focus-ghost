/**
 * Haunted sounds — synthesized with the WebAudio API, no audio files.
 * Everything is behind the sound toggle and no-ops when audio is
 * unavailable (SSR, old browsers) or disabled.
 */

export type SoundName = 'chime' | 'levelup' | 'whisper'

let ctx: AudioContext | null = null

function ensureCtx(): AudioContext | null {
  try {
    if (typeof window === 'undefined') return null
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext
    if (!AC) return null
    if (!ctx) ctx = new AC()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

/** Call from a user gesture so the AudioContext is allowed to start. */
export function ensureAudioOnGesture(): void {
  ensureCtx()
}

function tone(
  audio: AudioContext,
  freq: number,
  startAt: number,
  duration: number,
  volume: number,
  type: OscillatorType = 'sine',
): void {
  const osc = audio.createOscillator()
  const gain = audio.createGain()
  osc.type = type
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0, audio.currentTime + startAt)
  gain.gain.linearRampToValueAtTime(volume, audio.currentTime + startAt + 0.02)
  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    audio.currentTime + startAt + duration,
  )
  osc.connect(gain)
  gain.connect(audio.destination)
  osc.start(audio.currentTime + startAt)
  osc.stop(audio.currentTime + startAt + duration + 0.05)
}

function whisperNoise(audio: AudioContext): void {
  const duration = 1.2
  const buffer = audio.createBuffer(1, audio.sampleRate * duration, audio.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) {
    // Slow swell, like a breath — no harshness.
    const t = i / data.length
    const envelope = Math.sin(Math.PI * t) ** 2
    data[i] = (Math.random() * 2 - 1) * envelope * 0.25
  }
  const src = audio.createBufferSource()
  src.buffer = buffer
  const filter = audio.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = 900
  filter.Q.value = 2.5
  const gain = audio.createGain()
  gain.gain.value = 0.12
  src.connect(filter)
  filter.connect(gain)
  gain.connect(audio.destination)
  src.start()
}

export function playSound(name: SoundName, enabled: boolean): void {
  if (!enabled) return
  const audio = ensureCtx()
  if (!audio) return
  try {
    switch (name) {
      case 'chime':
        tone(audio, 660, 0, 0.5, 0.18)
        tone(audio, 880, 0.18, 0.7, 0.18)
        break
      case 'levelup':
        ;[523, 659, 784, 1047].forEach((freq, i) => {
          tone(audio, freq, i * 0.12, 0.4, 0.16)
        })
        break
      case 'whisper':
        whisperNoise(audio)
        break
    }
  } catch {
    // Audio is decorative — never let it break the app.
  }
}
