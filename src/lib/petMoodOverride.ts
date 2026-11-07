// Dev-only debug helper: force a pet mood with ?pet-mood=happy|content|hungry|sad
// Compiled out of production builds via import.meta.env.DEV.
import type { PetMood } from '../domain/pet'

export function petMoodOverride(): PetMood | null {
  if (!import.meta.env.DEV) return null
  if (typeof window === 'undefined') return null
  const value = new URLSearchParams(window.location.search).get('pet-mood')
  return value === 'happy' || value === 'content' || value === 'hungry' || value === 'sad'
    ? value
    : null
}
