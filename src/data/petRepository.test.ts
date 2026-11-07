import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Habit, Pet } from '../types/models'
import { addDaysToKey, getLocalDateKey } from '../domain/dates'
import { closeDatabase, openDatabase, requestToPromise, transactionDone } from './db'
import { adoptPet, getPet } from './petRepository'
import { saveHabit } from './habitRepository'
import { applyCompletion, revertCompletion } from './completionRepository'

const TODAY_KEY = getLocalDateKey(new Date())
const YESTERDAY_KEY = addDaysToKey(TODAY_KEY, -1)

function makeHabit(id: string, scheduledDays: number[]): Habit {
  const now = Date.now()
  return {
    id,
    name: `Habit ${id}`,
    icon: '🎯',
    color: '#F25C1F',
    scheduledDays,
    createdAt: now,
    updatedAt: now,
    archived: false,
  }
}

async function resetDatabase(): Promise<void> {
  await closeDatabase()
  await new Promise<void>((resolve) => {
    const request = indexedDB.deleteDatabase('streakpet-db')
    request.onsuccess = () => resolve()
    request.onerror = () => resolve()
    request.onblocked = () => resolve()
  })
}

async function setPetFields(fields: Partial<Pet>): Promise<void> {
  const pet = await getPet()
  const db = await openDatabase()
  const transaction = db.transaction('pet', 'readwrite')
  await Promise.all([
    requestToPromise(transaction.objectStore('pet').put({ ...pet, ...fields })),
    transactionDone(transaction),
  ])
}

beforeEach(async () => {
  await resetDatabase()
})

describe('getPet', () => {
  it('creates a default unadopted pet once', async () => {
    const pet = await getPet()
    expect(pet.species).toBeNull()
    expect(pet.cookies).toBe(0)
    expect(pet.petStatus).toBe('gone')
    expect(pet.streakAnchorDate).toEqual(expect.any(String))
    expect(typeof pet.createdAt).toBe('number')

    expect(await getPet()).toEqual(pet)
  })

  it('migrates a stored treat-era pet into the cookie model', async () => {
    await getPet()
    await setPetFields({
      treats: 2,
      treatLots: [{ at: Date.now() - 1000, count: 1 }],
      hunger: 30,
      lastHungerAt: Date.now() - 5000,
    } as Partial<Pet>)
    const pet = await getPet()
    expect(pet.cookies).toBe(2)
    expect(typeof pet.cookieEarnerAt).toBe('number')
    expect(pet).not.toHaveProperty('treats')
    expect(pet).not.toHaveProperty('hunger')
    expect(pet).not.toHaveProperty('lastHungerAt')
  })
})

describe('adoptPet', () => {
  it('stores the species and a trimmed name', async () => {
    const adopted = await adoptPet('cat', '  Miso  ')
    expect(adopted.species).toBe('cat')
    expect(adopted.name).toBe('Miso')
    expect((await getPet()).species).toBe('cat')
  })

  it('stores null for a blank name', async () => {
    const adopted = await adoptPet('dolphin', '   ')
    expect(adopted.name).toBeNull()
  })

  it('keeps cookies from previous lives but resets XP and the streak', async () => {
    await setPetFields({ xp: 40, cookies: 2, longestStreak: 7 })
    const adopted = await adoptPet('dog', null)
    expect(adopted.cookies).toBe(2)
    expect(adopted.xp).toBe(0)
    expect(adopted.currentStreak).toBe(0)
    expect(adopted.longestStreak).toBe(7)
    expect(adopted.streakAnchorDate).toEqual(expect.any(String))
  })
})

describe('settlement through getPet', () => {
  it('auto-feeds the pet after a completion day and awards XP', async () => {
    await adoptPet('cat', 'Miso')
    await saveHabit(makeHabit('h1', [0, 1, 2, 3, 4, 5, 6]))
    const pet = await applyCompletion({
      id: 'c1',
      habitId: 'h1',
      date: TODAY_KEY,
      completedAt: Date.now(),
    })
    expect(pet.petStatus).toBe('healthy')
    expect(pet.currentStreak).toBe(1)
    expect(pet.xp).toBe(10)
    expect(pet.activeDays).toBe(1)
  })

  it('counts one feed regardless of how many habits land on a day', async () => {
    await adoptPet('cat', 'Miso')
    await saveHabit(makeHabit('h1', [0, 1, 2, 3, 4, 5, 6]))
    await saveHabit(makeHabit('h2', [0, 1, 2, 3, 4, 5, 6]))
    const pet = await applyCompletion({
      id: 'c1',
      habitId: 'h1',
      date: TODAY_KEY,
      completedAt: Date.now(),
    })
    expect(pet.xp).toBe(10)
    const pet2 = await applyCompletion({
      id: 'c2',
      habitId: 'h2',
      date: TODAY_KEY,
      completedAt: Date.now(),
    })
    expect(pet2.xp).toBe(20)
    expect(pet2.currentStreak).toBe(1)
  })

  it('burns a cookie when a backfilled day created a veritable miss', async () => {
    await adoptPet('cat', 'Miso')
    await setPetFields({ cookies: 1 })
    await saveHabit(makeHabit('h1', [0, 1, 2, 3, 4, 5, 6]))
    const pet = await applyCompletion({
      id: 'c1',
      habitId: 'h1',
      date: addDaysToKey(TODAY_KEY, -2),
      completedAt: Date.now(),
    })
    expect(pet.cookieSpendDates).toEqual([YESTERDAY_KEY])
    expect(pet.cookies).toBe(0)
    expect(pet.activeDays).toBe(1)
    expect(pet.petStatus).toBe('hungry')
  })

  it('reverts remove the XP and the completion only', async () => {
    await adoptPet('cat', 'Miso')
    await saveHabit(makeHabit('h1', [0, 1, 2, 3, 4, 5, 6]))
    await applyCompletion({
      id: 'c1',
      habitId: 'h1',
      date: TODAY_KEY,
      completedAt: Date.now(),
    })
    const pet = await revertCompletion('h1', TODAY_KEY)
    expect(pet.xp).toBe(0)
    expect(pet.activeDays).toBe(0)
    expect(pet.petStatus).toBe('hungry')
  })

  it('survives reopening the database between operations', async () => {
    await adoptPet('cat', 'Miso')
    await saveHabit(makeHabit('h1', [0, 1, 2, 3, 4, 5, 6]))
    await applyCompletion({
      id: 'c1',
      habitId: 'h1',
      date: TODAY_KEY,
      completedAt: Date.now(),
    })
    await closeDatabase()
    await setPetFields({})
    const pet = await getPet()
    expect(pet.currentStreak).toBe(1)
  })
})
