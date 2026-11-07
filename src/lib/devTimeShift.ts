// Dev-only demo helper: age the pet's clocks so cookie expiry and pet age can
// be demoed without waiting. Only pet clocks shift — completion history, which
// now drives streaks, stays untouched.
import type { Pet } from '../types/models'
import { getPet, setPet } from '../stores/pet.svelte'
import { putPetRaw } from '../data/petDevTools'

export async function applyDevTimeShift(): Promise<void> {
  if (!import.meta.env.DEV) return
  const params = new URLSearchParams(window.location.search)
  const hours = Number(params.get('demo-age-hours'))
  if (!Number.isFinite(hours) || hours <= 0) return
  const key = `streakpet-demo-aged:${hours}`
  if (window.sessionStorage.getItem(key)) return
  window.sessionStorage.setItem(key, '1')
  await agePetClocksBy(hours * 60 * 60 * 1000)
}

async function agePetClocksBy(shiftMs: number): Promise<void> {
  const current = await getPet()
  if (current === null) return
  const pet: Pet = { ...current, createdAt: Math.max(0, current.createdAt - shiftMs) }
  if (typeof pet.cookieEarnerAt === 'number' && pet.cookieEarnerAt - shiftMs >= 0) {
    pet.cookieEarnerAt = pet.cookieEarnerAt - shiftMs
  }
  await putPetRaw(pet)
  const next = await getPet()
  if (next !== null) setPet(next)
}
