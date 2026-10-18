import type { Feeding, Pet } from '../types/models'

export type PetStage = 'baby' | 'teen' | 'adult'
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

export const TEEN_THRESHOLD = 100
export const ADULT_THRESHOLD = 300

export const HUNGER_MAX = 100
export const HUNGER_DECAY_PER_DAY = 50
export const FEED_HUNGER_RESTORE = 20
export const FEED_XP = 10
export const FULL_TOLERANCE = 1
export const TREATS_PER_COMPLETION = 1
export const FULL_DAY_BONUS_TREATS = 1

const DAY_MS = 24 * 60 * 60 * 1000

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

export function createDefaultPet(now: number): Pet {
  return {
    id: 'pet',
    species: null,
    name: null,
    xp: 0,
    treats: 0,
    hunger: HUNGER_MAX,
    lastHungerAt: now,
    createdAt: now,
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

export function hungerAt(hunger: number, lastHungerAt: number, now: number): number {
  const elapsed = Math.max(0, now - lastHungerAt)
  const decayed = hunger - HUNGER_DECAY_PER_DAY * (elapsed / DAY_MS)
  return Math.max(0, Math.min(HUNGER_MAX, decayed))
}

export function moodForHunger(hunger: number): PetMood {
  if (hunger >= 70) return 'happy'
  if (hunger >= 40) return 'content'
  if (hunger >= 15) return 'hungry'
  return 'sad'
}

export interface FeedCheck {
  ok: boolean
  reason?: string
}

export function canFeed(pet: Pet, now: number): FeedCheck {
  if (!pet.species) {
    return { ok: false, reason: 'Adopt a pet first.' }
  }
  if (pet.treats <= 0) {
    return { ok: false, reason: 'No treats yet — complete a habit to earn one.' }
  }
  if (hungerAt(pet.hunger, pet.lastHungerAt, now) >= HUNGER_MAX - FULL_TOLERANCE) {
    return { ok: false, reason: 'Your pet is full for now.' }
  }
  return { ok: true }
}

export interface FeedResult {
  pet: Pet
  feeding: Feeding
}

export function applyFeed(pet: Pet, now: number, feedingId: string): FeedResult {
  const hungerBefore = hungerAt(pet.hunger, pet.lastHungerAt, now)
  const hungerAfter = Math.min(HUNGER_MAX, hungerBefore + FEED_HUNGER_RESTORE)
  return {
    pet: {
      ...pet,
      treats: Math.max(0, pet.treats - 1),
      xp: pet.xp + FEED_XP,
      hunger: hungerAfter,
      lastHungerAt: now,
    },
    feeding: {
      id: feedingId,
      at: now,
      xp: FEED_XP,
      hungerBefore,
      hungerAfter,
    },
  }
}
