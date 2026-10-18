import { getMuted } from '../stores/settings.svelte'

interface AudioWindow extends Window {
  webkitAudioContext?: typeof AudioContext
}

let audioContext: AudioContext | null = null

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const ctor = window.AudioContext ?? (window as AudioWindow).webkitAudioContext
  if (!ctor) return null
  try {
    audioContext ??= new ctor()
    if (audioContext.state === 'suspended') void audioContext.resume()
    return audioContext
  } catch {
    return null
  }
}

function tone(
  context: AudioContext,
  frequency: number,
  startOffset: number,
  duration: number,
  type: OscillatorType = 'triangle',
  peak = 0.14
): void {
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  const start = context.currentTime + startOffset
  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, start)
  gain.gain.setValueAtTime(0, start)
  gain.gain.linearRampToValueAtTime(peak, start + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  oscillator.connect(gain).connect(context.destination)
  oscillator.start(start)
  oscillator.stop(start + duration + 0.05)
}

export function playComplete(): void {
  const context = getContext()
  if (!context || getMuted()) return
  tone(context, 523.25, 0, 0.14)
  tone(context, 659.25, 0.06, 0.14)
  tone(context, 783.99, 0.12, 0.2)
}

export function playCelebrate(): void {
  const context = getContext()
  if (!context || getMuted()) return
  tone(context, 523.25, 0, 0.14)
  tone(context, 659.25, 0.08, 0.14)
  tone(context, 783.99, 0.16, 0.14)
  tone(context, 1046.5, 0.24, 0.32, 'triangle', 0.16)
  tone(context, 783.99, 0.32, 0.24)
}

export function playUndo(): void {
  const context = getContext()
  if (!context || getMuted()) return
  tone(context, 392, 0, 0.1, 'sine', 0.11)
  tone(context, 311.13, 0.07, 0.16, 'sine', 0.11)
}

export function playFeed(): void {
  const context = getContext()
  if (!context || getMuted()) return
  tone(context, 440, 0, 0.07, 'square', 0.07)
  tone(context, 587.33, 0.08, 0.12, 'triangle', 0.12)
}

export function playAdopt(): void {
  const context = getContext()
  if (!context || getMuted()) return
  tone(context, 523.25, 0, 0.12)
  tone(context, 659.25, 0.1, 0.12)
  tone(context, 783.99, 0.2, 0.12)
  tone(context, 1046.5, 0.3, 0.3, 'triangle', 0.16)
}
