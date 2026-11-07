import { describe, expect, it } from 'vitest'
import type { Pet } from '../types/models'
import { addDaysToKey } from './dates'
import {
  ADULT_THRESHOLD,
  COOKIE_EXPIRY_MS,
  COOKIE_INVENTORY_MAX,
  COOKIE_MILESTONE_ACTIVE_DAYS,
  PET_SPECIES,
  TEEN_THRESHOLD,
  XP_PER_COMPLETION,
  activeDaysToNextCookie,
  applyVanish,
  cookieExpiryDate,
  createDefaultPet,
  isPetSpecies,
  moodForStatus,
  petAgeInDays,
  reconcileSurvival,
  stageForXp,
  stageProgress,
} from './pet'

const DAY_MS = 24 * 60 * 60 * 1000
const NOW = 1_800_000_000_000
const TODAY = '2024-03-10'

function makePet(partial: Partial<Pet> = {}): Pet {
  return { ...createDefaultPet(NOW, TODAY), species: 'cat', ...partial }
}

function days(n: number): string {
  return addDaysToKey(TODAY, n)
}

function settled(
  pet: Pet,
  dates: string[],
) {
  return reconcileSurvival(pet, new Set(dates), TODAY)
}

describe('economy constants', () => {
  it('uses the documented values', () => {
    expect(XP_PER_COMPLETION).toBe(10)
    expect(COOKIE_INVENTORY_MAX).toBe(2)
    expect(COOKIE_MILESTONE_ACTIVE_DAYS).toBe(7)
    expect(COOKIE_EXPIRY_MS).toBe(7 * DAY_MS)
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

describe('createDefaultPet', () => {
  it('starts unadopted with a fresh streak anchor', () => {
    const pet = createDefaultPet(NOW, TODAY)
    expect(pet.species).toBeNull()
    expect(pet.cookies).toBe(0)
    expect(pet.currentStreak).toBe(0)
    expect(pet.activeDays).toBe(0)
    expect(pet.longestStreak).toBe(0)
    expect(pet.petStatus).toBe('gone')
    expect(pet.streakAnchorDate).toBe(TODAY)
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

describe('reconcileSurvival — daily status', () => {
  it('is healthy after finishing a habit today', () => {
    const { pet } = settled(makePet(), [TODAY])
    expect(pet.petStatus).toBe('healthy')
    expect(pet.currentStreak).toBe(1)
  })

  it('is hungry when today has no completion yet', () => {
    const { pet } = settled(makePet({ streakAnchorDate: days(-1) }), [days(-1)])
    expect(pet.petStatus).toBe('hungry')
    expect(pet.currentStreak).toBe(1)
  })

  it('stays gone for a released pet', () => {
    const { pet } = settled(makePet({ species: null }), [TODAY, days(-1)])
    expect(pet.petStatus).toBe('gone')
    expect(pet.currentStreak).toBe(0)
  })

  it('reports XP per completion for growth without touching cookies', () => {
    const pet = makePet({ xp: 30 })
    const { pet: next } = settled(pet, [TODAY])
    expect(next.xp).toBe(30)
    expect(next.cookies).toBe(0)
  })
})

describe('reconcileSurvival — cookie protection', () => {
  it('burns one cookie to protect an isolated missed day', () => {
    const pet = makePet({ cookies: 1, cookieEarnerAt: NOW - DAY_MS, streakAnchorDate: days(-2) })
    const { pet: next, vanishDate, cookieSpent } = settled(pet, [days(-2), TODAY])
    expect(next.cookies).toBe(0)
    expect(next.cookieSpendDates).toEqual([days(-1)])
    expect(cookieSpent).toBe(true)
    expect(vanishDate).toBeUndefined()
    expect(next.petStatus).toBe('healthy')
    expect(next.currentStreak).toBe(2)
    // Protected days never count as active days.
    expect(next.activeDays).toBe(2)
  })

  it('kills the pet when protection is required but no cookie exists', () => {
    const pet = makePet()
    const { pet: next, vanished, vanishDate } = settled(pet, [days(-2)])
    expect(vanished).toBe(true)
    expect(vanishDate).toBe(days(-1))
    expect(next.petStatus).toBe('gone')
    expect(next.currentStreak).toBe(0)
    // The streak that existed before the death is preserved as the record.
    expect(next.longestStreak).toBe(1)
  })

  it('kills the pet on two consecutive missed days even with cookies', () => {
    const pet = makePet({ cookies: 2 })
    const { pet: next, vanished, vanishDate } = settled(pet, [days(-3)])
    expect(vanished).toBe(true)
    // Dies on the second consecutive missed day.
    expect(vanishDate).toBe(days(-1))
    expect(next.petStatus).toBe('gone')
    expect(next.currentStreak).toBe(0)
    // No cookie is burned on a death run.
    expect(next.cookies).toBe(2)
    expect(next.cookieSpendDates).toEqual([])
  })

  it('protects a single trailing missed day with a cookie', () => {
    const pet = makePet({ cookies: 1 })
    const { pet: next, vanished, cookieSpent } = settled(pet, [days(-2)])
    expect(vanished).toBe(false)
    expect(cookieSpent).toBe(true)
    expect(next.cookies).toBe(0)
    expect(next.cookieSpendDates).toEqual([days(-1)])
    expect(next.petStatus).toBe('hungry')
  })

  it('lives through a pending today after a burned trailing miss', () => {
    const pet = makePet({ cookies: 1, streakAnchorDate: days(-2) })
    const { pet: next } = settled(pet, [days(-2), TODAY])
    expect(next.petStatus).toBe('healthy')
    expect(next.currentStreak).toBe(2)
    expect(next.activeDays).toBe(2)
  })
})

describe('reconcileSurvival — streak walk', () => {
  it('counts protected days toward the streak but not active days', () => {
    const pet = makePet({
      cookies: 1,
      cookieSpendDates: [days(-1)],
      streakAnchorDate: days(-2),
    })
    const { pet: next } = settled(pet, [days(-2), TODAY])
    expect(next.activeDays).toBe(2)
    expect(next.currentStreak).toBe(2)
    expect(next.cookies).toBe(1)
  })

  it('grows longestStreak from runs outside the anchor too', () => {
    const pet = makePet({ longestStreak: 2 })
    const { pet: next } = settled(pet, [days(-3), days(-2), days(-1)])
    // A 3-day run survives history-wise even when today is still pending.
    expect(next.longestStreak).toBe(3)
    // Days before a same-day adoption contribute once as history, but the
    // fresh streak life owns the current streak.
    expect(next.currentStreak).toBe(0)
  })

  it('ignores history before the streak anchor after re-adoption', () => {
    const pet = makePet({ streakAnchorDate: days(-2), longestStreak: 0, cookies: 1 })
    const { pet: next } = settled(pet, [days(-3), days(-2), days(-1), TODAY])
    expect(next.currentStreak).toBe(3)
    // The pre-anchor segment counts once as history, the current life owns the rest.
    expect(next.longestStreak).toBe(3)
  })

  it('kills the pet across a two-missed-day gap in its current life', () => {
    const pet = makePet({ streakAnchorDate: days(-10), longestStreak: 0 })
    const { pet: next, vanished, vanishDate } = settled(pet, [days(-7), days(-4), TODAY])
    expect(vanished).toBe(true)
    expect(vanishDate).toBe(days(-5))
    expect(next.petStatus).toBe('gone')
    expect(next.currentStreak).toBe(0)
    expect(next.longestStreak).toBe(1)
  })
})

describe('reconcileSurvival — cookie milestones', () => {
  it('awards a cookie on every 7th active day', () => {
    const dates = Array.from({ length: 7 }, (_, index) => days(-7 + index + 1)).filter((key) => key !== TODAY)
    const pet = makePet({ streakAnchorDate: days(-6) })
    const { pet: next, cookieEarned } = settled(pet, [...dates, TODAY])
    expect(cookieEarned).toBe(true)
    expect(next.cookies).toBe(1)
    // The earliest balance earns the shared weekly cycle.
    expect(next.cookieEarnerAt).toBeGreaterThan(0)
  })

  it('caps the inventory at two cookies', () => {
    const dates = Array.from({ length: 14 }, (_, index) => days(-14 + index)).filter(
      (key) => key !== TODAY
    )
    const pet = makePet({ cookies: 2, cookieEarnerAt: NOW - DAY_MS, streakAnchorDate: days(-13) })
    const { pet: next, cookieEarned } = settled(pet, [...dates, TODAY])
    expect(cookieEarned).toBe(false)
    expect(next.cookies).toBe(2)
    expect(next.cookieEarnerAt).toBe(NOW - DAY_MS)
  })

  it('never resets the shared expiry when earning on top of one cookie', () => {
    const dates = Array.from({ length: 8 }, (_, index) => days(-8 + index)).filter(
      (key) => key !== TODAY
    )
    const pet = makePet({
      cookies: 1,
      cookieEarnerAt: NOW - 3 * DAY_MS,
      streakAnchorDate: days(-7),
      cookieMilestoneDates: [addDaysToKey(TODAY, -7)],
    })
    const { pet: next, cookieEarned } = settled(pet, [...dates, TODAY])
    expect(cookieEarned).toBe(true)
    expect(next.cookies).toBe(2)
    expect(next.cookieEarnerAt).toBe(NOW - 3 * DAY_MS)
  })

  it('does not double-award milestones on replays', () => {
    const pet = makePet({ streakAnchorDate: days(-6) })
    const dates = [days(-6), days(-5), days(-4), days(-3), days(-2), days(-1), TODAY]
    const first = settled(pet, dates)
    expect(first.pet.cookies).toBe(1)
    const second = settled(first.pet, dates)
    expect(second.pet.cookies).toBe(1)
    expect(second.cookieEarned).toBe(false)
  })
})

describe('reconcileSurvival — cookie expiry', () => {
  it('purges the inventory after the shared weekly cycle', () => {
    const pet = makePet({
      cookies: 2,
      cookieEarnerAt: Date.now() - COOKIE_EXPIRY_MS - 60_000,
    })
    const { pet: next } = settled(pet, [TODAY])
    expect(next.cookies).toBe(0)
    expect(next.cookieEarnerAt).toBeUndefined()
  })

  it('keeps cookies that are still inside the cycle', () => {
    const pet = makePet({ cookies: 2, cookieEarnerAt: Date.now() - DAY_MS })
    const { pet: next } = settled(pet, [TODAY])
    expect(next.cookies).toBe(2)
  })
})

describe('applyVanish', () => {
  it('releases the pet, resets the streak, and starts a fresh anchor', () => {
    const pet = makePet({ xp: 120, longestStreak: 9, cookies: 1 })
    const now = NOW
    const next = applyVanish(pet, TODAY, now)
    expect(next.species).toBeNull()
    expect(next.name).toBeNull()
    expect(next.xp).toBe(0)
    expect(next.currentStreak).toBe(0)
    expect(next.petStatus).toBe('gone')
    expect(next.longestStreak).toBe(9)
    expect(next.cookies).toBe(1)
    expect(next.streakAnchorDate).toBe(days(1))
    expect(next.lastRunAwayAt).toBe(now)
  })
})

describe('moodForStatus', () => {
  it('maps statuses onto moods', () => {
    expect(moodForStatus('healthy')).toBe('happy')
    expect(moodForStatus('hungry')).toBe('hungry')
    expect(moodForStatus('gone')).toBe('sad')
  })
})

describe('cookie inventory helpers', () => {
  it('derives the expiry date from the earn timestamp', () => {
    expect(cookieExpiryDate({ cookies: 1 } as Pet)).toBeNull()
    expect(
      cookieExpiryDate({ cookies: 2, cookieEarnerAt: 1234 } as Pet)
    ).toBe(1234 + COOKIE_EXPIRY_MS)
  })

  it('counts down to the next cookie milestone', () => {
    expect(activeDaysToNextCookie(0)).toBe(COOKIE_MILESTONE_ACTIVE_DAYS)
    expect(activeDaysToNextCookie(6)).toBe(1)
    expect(activeDaysToNextCookie(7)).toBe(COOKIE_MILESTONE_ACTIVE_DAYS)
    expect(activeDaysToNextCookie(15)).toBe(6)
  })
})
