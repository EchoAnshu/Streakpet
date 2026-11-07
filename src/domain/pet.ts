import type { Pet } from '../types/models'
import { addDaysToKey, compareDateKeys, daysBetweenKeys } from './dates'

export type PetStage = 'baby' | 'teen' | 'adult'
export type PetStatus = 'healthy' | 'hungry' | 'gone'
export type PetMood = 'happy' | 'content' | 'hungry' | 'sad'

export const PET_SPECIES = ['cat', 'dog', 'dolphin', 'bunny', 'fox', 'panda'] as const
export type PetSpecies = (typeof PET_SPECIES)[number]

export const SPECIES_LABELS: Record<PetSpecies, string> = {
  cat: 'Cat',
  dog: 'Dog',
  dolphin: 'Dolphin',
  bunny: 'Bunny',
  fox: 'Fox',
  panda: 'Panda',
}

const DAY_MS = 24 * 60 * 60 * 1000

export const TEEN_THRESHOLD = 100
export const ADULT_THRESHOLD = 300

// One habit completion drives growth.
export const XP_PER_COMPLETION = 10

// Cookies patch isolated missed days. Ordinary habit completions never mint them.
export const COOKIE_INVENTORY_MAX = 2
export const COOKIE_EXPIRY_MS = 7 * DAY_MS
export const COOKIE_MILESTONE_ACTIVE_DAYS = 7

export const STATUS_LABELS: Record<PetStatus, string> = {
  healthy: 'Healthy',
  hungry: 'Hungry',
  gone: 'Gone',
}

export const MOOD_LABELS: Record<PetMood, string> = {
  happy: 'Happy',
  content: 'Content',
  hungry: 'Hungry',
  sad: 'Sad',
}

export const STAGE_LABELS: Record<PetStage, string> = {
  baby: 'Baby',
  teen: 'Teen',
  adult: 'Adult',
}

export function isPetSpecies(value: string): value is PetSpecies {
  return (PET_SPECIES as readonly string[]).includes(value)
}

export function createDefaultPet(now: number, todayKey: string): Pet {
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
    petStatus: 'gone',
    streakAnchorDate: todayKey,
  }
}

export function stageForXp(totalXp: number): PetStage {
  if (totalXp >= ADULT_THRESHOLD) return 'adult'
  if (totalXp >= TEEN_THRESHOLD) return 'teen'
  return 'baby'
}

export function petAgeInDays(createdAt: number, now: number): number {
  return Math.max(0, Math.floor((now - createdAt) / DAY_MS))
}

export interface StageProgress {
  stage: PetStage
  earned: number
  goal: number | null
  nextStage: PetStage | null
}

export function stageProgress(totalXp: number): StageProgress {
  const stage = stageForXp(totalXp)
  if (stage === 'baby') {
    return { stage, earned: totalXp, goal: TEEN_THRESHOLD, nextStage: 'teen' }
  }
  if (stage === 'teen') {
    return {
      stage,
      earned: totalXp - TEEN_THRESHOLD,
      goal: ADULT_THRESHOLD - TEEN_THRESHOLD,
      nextStage: 'adult',
    }
  }
  return { stage, earned: 0, goal: null, nextStage: null }
}

// --- Survival engine -------------------------------------------------------
//
// Fully derived from the completion record on every settlement pass:
//   - a day is ACTIVE when at least one habit was completed on it
//   - RESOLVED days are every local calendar day strictly before today; today
//     is always pending and can still save itself
//   - walking chronologically from the pet's streak anchor:
//       active day            -> streak counts it
//       isolated missed day   -> one cookie is burned, day counts as protected
//       second consecutive missed day, or a miss with no cookie left -> death
//   - a death breaks the segment: longestStreak keeps the best run, and the
//     current streak only survives through a fresh adoption
// Ledgers (spend + milestones) make the pass idempotent — replaying the same
// history never double-burns cookies, double-awards milestones, or double-feeds.

export interface SurvivalResult {
  pet: Pet
  vanished: boolean
  /** Local date key the streak died on, when a vanish fires during this pass. */
  vanishDate?: string
  cookieEarned?: boolean
  cookieSpent?: boolean
}

export function reconcileSurvival(
  pet: Pet,
  completionsByDate: Set<string>,
  todayKey: string,
): SurvivalResult {
  const activeKeys = [...completionsByDate].sort(compareDateKeys)
  const anchor = pet.streakAnchorDate

  const spendDates = new Set(pet.cookieSpendDates ?? [])
  const milestoneDates = new Set(pet.cookieMilestoneDates ?? [])
  let cookies = pet.cookies
  let cookieEarnerAt = pet.cookieEarnerAt
  if (pet.cookieEarnerAt !== undefined && Date.now() >= pet.cookieEarnerAt + COOKIE_EXPIRY_MS) {
    // One shared expiry cycle for the whole inventory; it never resets.
    cookies = 0
    cookieEarnerAt = undefined
  }

  const canSpendCookies = pet.species !== null
  let aliveNow = pet.species !== null
  let vanished = false
  let vanishDate: string | undefined
  let cookieEarned = false
  let cookieSpent = false

  // The streak walk over every active day known to the app.
  let run = 0
  let bestRun = 0
  let previousKey: string | null = null
  let runBelongsToCurrentLife = anchor === undefined
  let crossedAnchor = anchor === undefined

  for (const key of activeKeys) {
    if (previousKey !== null) {
      const gapIdleDays = daysBetweenKeys(previousKey, key) - 1
      if (gapIdleDays >= 2) {
        // Two or more consecutive resolved missed days: no protection applies.
        if (bestRun < run) bestRun = run
        run = 0
        if (runBelongsToCurrentLife && aliveNow) {
          aliveNow = false
          vanished = true
          vanishDate = addDaysToKey(previousKey, 2)
        }
      } else if (gapIdleDays === 1) {
        // Isolated missed day: protectable via one cookie, ledger deduped.
        const missedKey = addDaysToKey(previousKey, 1)
        if (!spendDates.has(missedKey)) {
          if (canSpendCookies && aliveNow && cookies > 0) {
            cookies -= 1
            spendDates.add(missedKey)
            cookieSpent = true
          } else if (runBelongsToCurrentLife && aliveNow) {
            // Protection required, none available: the streak ends here.
            if (bestRun < run) bestRun = run
            run = 0
            aliveNow = false
            vanished = true
            vanishDate = missedKey
          } else {
            if (bestRun < run) bestRun = run
            run = 0
          }
        }
      }
    }
    // The day the current streak life begins on starts a clean run.
    if (anchor !== undefined && !crossedAnchor && compareDateKeys(key, anchor) >= 0) {
      crossedAnchor = true
      runBelongsToCurrentLife = true
      if (bestRun < run) bestRun = run
      run = 0
    }
    run += 1
    if (
      runBelongsToCurrentLife &&
      aliveNow &&
      pet.species !== null &&
      run % COOKIE_MILESTONE_ACTIVE_DAYS === 0 &&
      !milestoneDates.has(key)
    ) {
      milestoneDates.add(key)
      if (cookies < COOKIE_INVENTORY_MAX) {
        const balanceWasEmpty = cookies === 0
        cookies += 1
        // Earning never resets or extends a running expiry cycle; only
        // the first cookie of an empty inventory starts the 7-day clock.
        if (balanceWasEmpty) cookieEarnerAt = Date.now()
        cookieEarned = true
      }
    }
    previousKey = key
  }

  // Trailing resolved misses after the last completion (idling periods).
  // A single trailing miss is protectable; two or more consecutive trailing
  // misses are a run death with no protection possible for the pair.
  if (previousKey !== null) {
    const trailingMisses = Math.max(0, daysBetweenKeys(previousKey, todayKey) - 1)
    const firstMissedKey = addDaysToKey(previousKey, 1)
    if (trailingMisses === 1) {
      if (!spendDates.has(firstMissedKey)) {
        if (canSpendCookies && aliveNow && cookies > 0) {
          cookies -= 1
          spendDates.add(firstMissedKey)
          cookieSpent = true
        } else if (canSpendCookies && aliveNow) {
          if (bestRun < run) bestRun = run
          run = 0
          aliveNow = false
          vanished = true
          vanishDate = firstMissedKey
        }
      }
    } else if (trailingMisses >= 2) {
      const secondMissedKey = addDaysToKey(previousKey, 2)
      if (canSpendCookies && aliveNow && !spendDates.has(secondMissedKey)) {
        if (bestRun < run) bestRun = run
        run = 0
        aliveNow = false
        vanished = true
        vanishDate = secondMissedKey
      }
    }
  }
  if (bestRun < run) bestRun = run

  const petStatus: PetStatus =
    pet.species === null || !aliveNow ? 'gone' : completionsByDate.has(todayKey) ? 'healthy' : 'hungry'
  const currentStreak =
    pet.species !== null && aliveNow && (anchor === undefined || crossedAnchor) ? run : 0

  const next: Pet = {
    ...pet,
    cookies,
    cookieSpendDates: [...spendDates].sort(compareDateKeys),
    cookieMilestoneDates: [...milestoneDates].sort(compareDateKeys),
    currentStreak,
    activeDays: activeKeys.length,
    // Only the living pet extends the record; a released pet's books freeze.
    longestStreak: pet.species !== null ? Math.max(pet.longestStreak, bestRun) : pet.longestStreak,
    petStatus,
  }
  if (cookies === 0) delete next.cookieEarnerAt
  else if (cookieEarnerAt !== undefined) next.cookieEarnerAt = cookieEarnerAt
  return { pet: next, vanished, vanishDate, cookieEarned, cookieSpent }
}

/** Apply a vanished pet's consequences: released, streak 0, history survives. */
export function applyVanish(pet: Pet, todayKey: string, now: number): Pet {
  return {
    ...pet,
    species: null,
    name: null,
    xp: 0,
    currentStreak: 0,
    petStatus: 'gone',
    // Fresh starts are only earned by adopting a new companion.
    streakAnchorDate: addDaysToKey(todayKey, 1),
    lastRunAwayAt: now,
  }
}

export function cookieExpiryDate(pet: Pet): number | null {
  return pet.cookies > 0 && pet.cookieEarnerAt !== undefined
    ? pet.cookieEarnerAt + COOKIE_EXPIRY_MS
    : null
}

export function activeDaysToNextCookie(activeDays: number): number {
  const remainder = activeDays % COOKIE_MILESTONE_ACTIVE_DAYS
  return remainder === 0 ? COOKIE_MILESTONE_ACTIVE_DAYS : COOKIE_MILESTONE_ACTIVE_DAYS - remainder
}

export function moodForStatus(status: PetStatus): PetMood {
  if (status === 'healthy') return 'happy'
  if (status === 'hungry') return 'hungry'
  return 'sad'
}
