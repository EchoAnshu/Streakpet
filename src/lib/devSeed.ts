// Dev-only demo seeder: write a few days of fake history so the streak
// mechanics can be watched on demand without waiting for real calendar days.
// Each scenario builds a clean baseline (pet record + its own completion
// days) so the demos behave the same no matter which order you visit them.
// Excluded from production builds via the import.meta.env.DEV guard.
import type { Completion, Pet } from '../types/models'
import { addDaysToKey, getLocalDateKey } from '../domain/dates'
import {
  clearCompletionsRaw,
  getPetRaw,
  putCompletionsRaw,
  putPetRaw,
} from '../data/petDevTools'

export type DemoSeedScenario = 'hungry' | 'milestone' | 'cookie-save' | 'vanish'

const SCENARIOS: DemoSeedScenario[] = ['hungry', 'milestone', 'cookie-save', 'vanish']

function keyOfToday(index: number): string {
  return addDaysToKey(getLocalDateKey(new Date()), index)
}

function seededCompletions(dayIndices: number[]): Completion[] {
  return dayIndices.map((index, order) => ({
    id: `demo-seed-${index}-${order}`,
    habitId: 'demo-seed-habit',
    date: keyOfToday(index),
    completedAt: Date.now() - (Math.abs(index) + 1) * 60_000,
  }))
}

export async function applyDevSeed(): Promise<void> {
  if (!import.meta.env.DEV) return
  const params = new URLSearchParams(window.location.search)
  const scenario = params.get('demo-streak') as DemoSeedScenario | null
  if (scenario === null || !SCENARIOS.includes(scenario)) return
  const sessionKey = `streakpet-demo-seed:${scenario}`
  if (window.sessionStorage.getItem(sessionKey)) return
  if (scenario === 'cookie-save') await seedCookieSave()
  else if (scenario === 'vanish') await seedVanish()
  else if (scenario === 'milestone') await seedMilestone()
  else await seedHungry()
  window.sessionStorage.setItem(sessionKey, '1')
}

/**
 * Healthy yesterday, nothing today yet: the hungry 🥺 pet you first see in
 * the morning, with a live streak and cookies in the bank.
 */
async function seedHungry(): Promise<void> {
  const basis = await prepareBasis()
  const completions = seededCompletions([-2, -1])
  const pet: Pet = {
    ...basis,
    xp: completions.length * 10,
    cookies: 1,
    petStatus: 'hungry',
    streakAnchorDate: keyOfToday(-3),
  }
  resetLedgers(pet)
  await putCompletionsRaw(completions)
  await putPetRaw(pet)
}

/**
 * Six active days in the book, no cookies: completing any habit today is the
 * 7th active day and mints the next cookie automatically.
 */
async function seedMilestone(): Promise<void> {
  const basis = await prepareBasis()
  const completions = seededCompletions([-6, -5, -4, -3, -2, -1])
  const pet: Pet = {
    ...basis,
    xp: completions.length * 10,
    cookies: 0,
    petStatus: 'hungry',
    streakAnchorDate: keyOfToday(-7),
  }
  resetLedgers(pet)
  await putCompletionsRaw(completions)
  await putPetRaw(pet)
}

/**
 * A streak saved yesterday by burning the last cookie: `-3 -2` completed,
 * `-1` missed (cookie burned at settlement), today pending. The streak and
 * the run both survive — complete any habit today to end the day healthy.
 */
async function seedCookieSave(): Promise<void> {
  const basis = await prepareBasis()
  const completions = seededCompletions([-3, -2])
  const pet: Pet = {
    ...basis,
    xp: completions.length * 10,
    cookies: 1,
    petStatus: 'hungry',
    streakAnchorDate: keyOfToday(-4),
  }
  resetLedgers(pet)
  await putCompletionsRaw(completions)
  await putPetRaw(pet)
}

/**
 * A streak that just died: `-6 -5 -4` completed, then two consecutive missed
 * days. Settlement releases the pet and the run — the "Adopt" screen appears
 * with the run-away note while the record stat keeps its old best.
 */
async function seedVanish(): Promise<void> {
  const basis = await prepareBasis()
  const completions = seededCompletions([-6, -5, -4])
  const pet: Pet = {
    ...basis,
    xp: completions.length * 10,
    cookies: 2,
    petStatus: 'hungry',
    streakAnchorDate: keyOfToday(-7),
  }
  resetLedgers(pet)
  delete (pet as Partial<Pet>).lastRunAwayAt
  await putCompletionsRaw(completions)
  await putPetRaw(pet)
}

async function prepareBasis(): Promise<Pet> {
  await clearCompletionsRaw()
  const existing = await getPetRaw()
  return existing ?? defaultPet()
}

function resetLedgers(pet: Pet): void {
  delete pet.cookieSpendDates
  delete pet.cookieMilestoneDates
}

function defaultPet(): Pet {
  const now = Date.now()
  return {
    id: 'pet',
    species: null,
    name: null,
    xp: 0,
    createdAt: now,
    cookies: 0,
    currentStreak: 0,
    activeDays: 0,
    longestStreak: 0,
    petStatus: 'healthy',
    streakAnchorDate: getLocalDateKey(new Date()),
  }
}
