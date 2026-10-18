import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Completion, Habit, Pet } from '../types/models'
import { hungerAt } from '../domain/pet'
import { applyCompletion, listCompletions } from './completionRepository'
import { closeDatabase, openDatabase, requestToPromise, transactionDone } from './db'
import { adoptPet, feedPet, getPet, listFeedings } from './petRepository'
import { saveHabit } from './habitRepository'

const DAY_MS = 24 * 60 * 60 * 1000
const DATE_KEY = '2026-10-17'

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
    expect(pet).toEqual({
      id: 'pet',
      species: null,
      name: null,
      xp: 0,
      treats: 0,
      hunger: 100,
      lastHungerAt: expect.any(Number),
      createdAt: expect.any(Number),
    })

    expect(await getPet()).toEqual(pet)
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

  it('keeps accumulated XP and treats when adopting', async () => {
    await setPetFields({ xp: 40, treats: 3 })
    const adopted = await adoptPet('dog', null)
    expect(adopted.xp).toBe(40)
    expect(adopted.treats).toBe(3)
  })
})

describe('feedPet', () => {
  it('requires an adopted pet', async () => {
    await setPetFields({ treats: 2 })
    await expect(feedPet()).rejects.toThrow('Adopt a pet first.')
  })

  it('requires at least one treat', async () => {
    await adoptPet('cat', null)
    await setPetFields({ hunger: 40 })
    await expect(feedPet()).rejects.toThrow('No treats yet')
  })

  it('rejects when the pet is full', async () => {
    await adoptPet('cat', null)
    await setPetFields({ treats: 1, hunger: 100, lastHungerAt: Date.now() })
    await expect(feedPet()).rejects.toThrow('full')
  })

  it('spends a treat, restores hunger, and records the feeding', async () => {
    await adoptPet('cat', 'Miso')
    await saveHabit(makeHabit('a', [6]))
    await applyCompletion({
      id: 'completion-1',
      habitId: 'a',
      date: DATE_KEY,
      completedAt: Date.now(),
    })
    await setPetFields({ hunger: 40, lastHungerAt: Date.now() })

    const { pet, feeding } = await feedPet()
    expect(pet.treats).toBe(1)
    expect(pet.xp).toBe(10)
    expect(pet.hunger).toBeCloseTo(60, 3)
    expect(feeding.hungerBefore).toBeCloseTo(40, 3)
    expect(feeding.hungerAfter).toBeCloseTo(60, 3)

    const feedings = await listFeedings()
    expect(feedings).toHaveLength(1)
    expect(feedings[0].id).toBe(feeding.id)
  })

  it('accounts for hunger decayed since the last update', async () => {
    await adoptPet('cat', null)
    await setPetFields({ treats: 1, hunger: 100, lastHungerAt: Date.now() - DAY_MS })

    const { pet, feeding } = await feedPet()
    expect(feeding.hungerBefore).toBeCloseTo(85, 2)
    expect(pet.hunger).toBe(100)
  })

  it('persists pet state across reloads', async () => {
    await adoptPet('fox', 'Rusty')
    await setPetFields({ treats: 2, xp: 30, hunger: 50, lastHungerAt: Date.now() })

    await feedPet()
    await closeDatabase()

    const pet = await getPet()
    expect(pet.species).toBe('fox')
    expect(pet.name).toBe('Rusty')
    expect(pet.treats).toBe(1)
    expect(pet.xp).toBe(40)
    expect(await listFeedings()).toHaveLength(1)
    expect(await listCompletions()).toHaveLength(0)
  })

  it('lets hunger keep decaying over time', async () => {
    await adoptPet('cat', null)
    await setPetFields({ treats: 1, hunger: 50, lastHungerAt: Date.now() })
    const { pet } = await feedPet()
    expect(pet.hunger).toBeCloseTo(70, 4)
    expect(hungerAt(pet.hunger, pet.lastHungerAt, pet.lastHungerAt + DAY_MS)).toBeCloseTo(55, 4)
  })
})
