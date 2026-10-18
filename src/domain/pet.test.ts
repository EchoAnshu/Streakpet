import { describe, expect, it } from 'vitest'
import type { Pet } from '../types/models'
import {
  ADULT_THRESHOLD,
  FEED_HUNGER_RESTORE,
  FEED_XP,
  FULL_DAY_BONUS_TREATS,
  FULL_TOLERANCE,
  HUNGER_DECAY_PER_DAY,
  HUNGER_MAX,
  PET_SPECIES,
  TEEN_THRESHOLD,
  TREATS_PER_COMPLETION,
  applyFeed,
  canFeed,
  createDefaultPet,
  hungerAt,
  isPetSpecies,
  moodForHunger,
  petAgeInDays,
  stageForXp,
  stageProgress,
} from './pet'

const DAY_MS = 24 * 60 * 60 * 1000
const NOW = 1_800_000_000_000

function makePet(partial: Partial<Pet> = {}): Pet {
  return { ...createDefaultPet(NOW), species: 'cat', ...partial }
}

describe('economy constants', () => {
  it('uses the documented values', () => {
    expect(TREATS_PER_COMPLETION).toBe(1)
    expect(FULL_DAY_BONUS_TREATS).toBe(1)
    expect(FEED_HUNGER_RESTORE).toBe(20)
    expect(FEED_XP).toBe(10)
    expect(FULL_TOLERANCE).toBe(1)
    expect(HUNGER_MAX).toBe(100)
    expect(HUNGER_DECAY_PER_DAY).toBe(50)
    expect(TEEN_THRESHOLD).toBe(100)
    expect(ADULT_THRESHOLD).toBe(300)
  })
})

describe('species', () => {
  it('offers cat, dog, dolphin, bunny, fox, and panda', () => {
    expect(PET_SPECIES).toEqual(['cat', 'dog', 'dolphin', 'bunny', 'fox', 'panda'])
  })

  it('validates species values', () => {
    expect(isPetSpecies('cat')).toBe(true)
    expect(isPetSpecies('dragon')).toBe(false)
  })
})

describe('stageForXp', () => {
  it('maps XP to stages at the boundaries', () => {
    expect(stageForXp(0)).toBe('baby')
    expect(stageForXp(99)).toBe('baby')
    expect(stageForXp(100)).toBe('teen')
    expect(stageForXp(299)).toBe('teen')
    expect(stageForXp(300)).toBe('adult')
  })
})

describe('stageProgress', () => {
  it('measures progress inside the baby stage', () => {
    expect(stageProgress(0)).toEqual({ stage: 'baby', earned: 0, goal: 100, nextStage: 'teen' })
    expect(stageProgress(45)).toEqual({ stage: 'baby', earned: 45, goal: 100, nextStage: 'teen' })
  })

  it('measures progress inside the teen stage', () => {
    expect(stageProgress(100)).toEqual({ stage: 'teen', earned: 0, goal: 200, nextStage: 'adult' })
    expect(stageProgress(250)).toEqual({ stage: 'teen', earned: 150, goal: 200, nextStage: 'adult' })
  })

  it('reports no goal for the adult stage', () => {
    expect(stageProgress(300)).toEqual({ stage: 'adult', earned: 0, goal: null, nextStage: null })
  })
})

describe('petAgeInDays', () => {
  const createdAt = NOW - 3 * DAY_MS - 12 * 60 * 60 * 1000

  it('counts whole days since adoption', () => {
    expect(petAgeInDays(createdAt, NOW)).toBe(3)
  })

  it('reports age zero on adoption day', () => {
    expect(petAgeInDays(NOW, NOW)).toBe(0)
  })

  it('never goes negative on clock skew', () => {
    expect(petAgeInDays(NOW, NOW - DAY_MS)).toBe(0)
  })
})

describe('hungerAt', () => {
  it('keeps the stored value for the same moment', () => {
    expect(hungerAt(80, NOW, NOW)).toBe(80)
  })

  it('decays linearly over time', () => {
    expect(hungerAt(100, NOW, NOW + DAY_MS)).toBe(50)
    expect(hungerAt(100, NOW, NOW + 2 * DAY_MS)).toBe(0)
    expect(hungerAt(100, NOW, NOW + DAY_MS / 2)).toBeCloseTo(75)
  })

  it('never drops below zero', () => {
    expect(hungerAt(20, NOW, NOW + 10 * DAY_MS)).toBe(0)
  })

  it('ignores clock skew into the past', () => {
    expect(hungerAt(50, NOW, NOW - DAY_MS)).toBe(50)
  })
})

describe('moodForHunger', () => {
  it('maps hunger thresholds to moods', () => {
    expect(moodForHunger(100)).toBe('happy')
    expect(moodForHunger(70)).toBe('happy')
    expect(moodForHunger(69)).toBe('content')
    expect(moodForHunger(40)).toBe('content')
    expect(moodForHunger(39)).toBe('hungry')
    expect(moodForHunger(15)).toBe('hungry')
    expect(moodForHunger(14)).toBe('sad')
    expect(moodForHunger(0)).toBe('sad')
  })
})

describe('canFeed', () => {
  it('requires an adopted pet', () => {
    const pet = makePet({ species: null, treats: 3 })
    expect(canFeed(pet, NOW)).toEqual({ ok: false, reason: 'Adopt a pet first.' })
  })

  it('requires at least one treat', () => {
    const pet = makePet({ treats: 0 })
    expect(canFeed(pet, NOW).ok).toBe(false)
  })

  it('rejects when the pet is full', () => {
    const pet = makePet({ treats: 2, hunger: HUNGER_MAX, lastHungerAt: NOW })
    expect(canFeed(pet, NOW).ok).toBe(false)
  })

  it('keeps a one-point tolerance so a just-fed pet is not wasteful', () => {
    expect(canFeed(makePet({ treats: 2, hunger: 99, lastHungerAt: NOW }), NOW).ok).toBe(false)
    expect(canFeed(makePet({ treats: 2, hunger: 98, lastHungerAt: NOW }), NOW).ok).toBe(true)
  })

  it('allows feeding a hungry pet with treats', () => {
    const pet = makePet({ treats: 2, hunger: 40, lastHungerAt: NOW })
    expect(canFeed(pet, NOW).ok).toBe(true)
  })

  it('rejects when hunger decayed to full', () => {
    const pet = makePet({ treats: 2, hunger: HUNGER_MAX, lastHungerAt: NOW + DAY_MS })
    expect(canFeed(pet, NOW).ok).toBe(false)
  })
})

describe('applyFeed', () => {
  it('spends a treat, restores hunger, and awards XP', () => {
    const pet = makePet({ treats: 3, xp: 50, hunger: 40, lastHungerAt: NOW })
    const { pet: fed, feeding } = applyFeed(pet, NOW, 'feeding-1')

    expect(fed.treats).toBe(2)
    expect(fed.xp).toBe(60)
    expect(fed.hunger).toBe(60)
    expect(fed.lastHungerAt).toBe(NOW)
    expect(feeding).toEqual({
      id: 'feeding-1',
      at: NOW,
      xp: FEED_XP,
      hungerBefore: 40,
      hungerAfter: 60,
    })
  })

  it('accounts for decay before restoring', () => {
    const pet = makePet({ treats: 1, hunger: 100, lastHungerAt: NOW })
    const { pet: fed, feeding } = applyFeed(pet, NOW + DAY_MS, 'feeding-2')

    expect(feeding.hungerBefore).toBe(50)
    expect(fed.hunger).toBe(70)
  })

  it('caps hunger at the maximum', () => {
    const pet = makePet({ treats: 1, hunger: 95, lastHungerAt: NOW })
    const { pet: fed } = applyFeed(pet, NOW, 'feeding-3')
    expect(fed.hunger).toBe(HUNGER_MAX)
  })

  it('never drops treats below zero', () => {
    const pet = makePet({ treats: 0, hunger: 10, lastHungerAt: NOW })
    const { pet: fed } = applyFeed(pet, NOW, 'feeding-4')
    expect(fed.treats).toBe(0)
  })
})
