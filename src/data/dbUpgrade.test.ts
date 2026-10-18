import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Completion, Reward } from '../types/models'
import { applyCompletion } from './completionRepository'
import { closeDatabase, openDatabase, requestToPromise, transactionDone } from './db'
import { saveHabit } from './habitRepository'
import { getPet } from './petRepository'

const DATE_KEY = '2026-10-17'

const legacyHabit = {
  id: 'legacy-habit',
  name: 'Legacy habit',
  description: 'Old notes',
  scheduledDays: [6],
  createdAt: 1000,
  updatedAt: 1000,
  archived: false,
}

const legacyCompletion: Completion = {
  id: 'legacy-completion',
  habitId: 'legacy-habit',
  date: DATE_KEY,
  completedAt: 2000,
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

async function createDatabaseVersion(
  version: number,
  data: { habits?: object[]; completions?: object[]; rewards?: object[] } = {}
): Promise<void> {
  const request = indexedDB.open('streakpet-db', version)
  request.onupgradeneeded = () => {
    const db = request.result
    if (!db.objectStoreNames.contains('habits')) {
      const habits = db.createObjectStore('habits', { keyPath: 'id' })
      habits.createIndex('archived', 'archived')
    }
    if (!db.objectStoreNames.contains('completions')) {
      const completions = db.createObjectStore('completions', { keyPath: 'id' })
      completions.createIndex('habitId', 'habitId')
      completions.createIndex('date', 'date')
      completions.createIndex('habitId_date', ['habitId', 'date'], { unique: true })
    }
    if (version >= 2 && !db.objectStoreNames.contains('rewards')) {
      const rewards = db.createObjectStore('rewards', { keyPath: 'id' })
      rewards.createIndex('date', 'date')
      rewards.createIndex('habitId', 'habitId')
    }
    if (version >= 3 && !db.objectStoreNames.contains('pet')) {
      db.createObjectStore('pet', { keyPath: 'id' })
    }
    if (version >= 3 && !db.objectStoreNames.contains('feedings')) {
      const feedings = db.createObjectStore('feedings', { keyPath: 'id' })
      feedings.createIndex('at', 'at')
    }
  }

  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('open failed'))
  })

  const storeNames = ['habits', 'completions']
  if (version >= 2) storeNames.push('rewards')
  if (version >= 3) storeNames.push('pet', 'feedings')

  const transaction = db.transaction(storeNames, 'readwrite')
  for (const habit of data.habits ?? []) transaction.objectStore('habits').put(habit)
  for (const completion of data.completions ?? [])
    transaction.objectStore('completions').put(completion)
  for (const reward of data.rewards ?? []) transaction.objectStore('rewards').put(reward)
  await transactionDone(transaction)
  db.close()
}

async function rawRewards(): Promise<Reward[]> {
  const db = await openDatabase()
  const transaction = db.transaction('rewards', 'readonly')
  const rewards = await requestToPromise(
    transaction.objectStore('rewards').getAll() as IDBRequest<Reward[]>
  )
  await transactionDone(transaction)
  return rewards
}

beforeEach(async () => {
  await resetDatabase()
})

describe('database upgrade to version 3', () => {
  it('creates the pet and feedings stores and upgrades legacy habits', async () => {
    await createDatabaseVersion(1, {
      habits: [legacyHabit],
      completions: [legacyCompletion],
    })

    const db = await openDatabase()
    expect(db.version).toBe(3)
    expect([...db.objectStoreNames].sort()).toEqual([
      'completions',
      'feedings',
      'habits',
      'pet',
      'rewards',
    ])

    const transaction = db.transaction('habits', 'readonly')
    const habits = await requestToPromise(
      transaction.objectStore('habits').getAll() as IDBRequest<Record<string, unknown>[]>
    )
    await transactionDone(transaction)

    expect(habits).toHaveLength(1)
    expect(typeof habits[0].icon).toBe('string')
    expect(habits[0].icon).toBeTruthy()
    expect(habits[0].color).toEqual(expect.stringMatching(/^#[0-9a-fA-F]{6}$/))
    expect(habits[0].note).toBe('Old notes')
    expect(habits[0].description).toBeUndefined()

    const pet = await getPet()
    expect(pet.xp).toBe(0)
    expect(pet.treats).toBe(0)
    expect(pet.species).toBeNull()
  })

  it('migrates active reward XP into pet XP and keeps the reward records', async () => {
    await createDatabaseVersion(2, {
      habits: [legacyHabit],
      completions: [legacyCompletion],
      rewards: [
        {
          id: 'habit:legacy-habit:2026-10-17',
          type: 'habit_completion',
          date: DATE_KEY,
          habitId: 'legacy-habit',
          xp: 10,
          reversed: false,
          createdAt: 2000,
        },
        {
          id: 'daily-bonus:2026-10-17',
          type: 'daily_bonus',
          date: DATE_KEY,
          xp: 5,
          reversed: false,
          createdAt: 2000,
        },
        {
          id: 'habit:legacy-habit:2026-10-16',
          type: 'habit_completion',
          date: '2026-10-16',
          habitId: 'legacy-habit',
          xp: 10,
          reversed: true,
          createdAt: 1000,
          reversedAt: 1500,
        },
      ],
    })

    const pet = await getPet()
    expect(pet.xp).toBe(15)
    expect(pet.treats).toBe(0)
    expect(await rawRewards()).toHaveLength(3)
  })

  it('accepts new completions and treats after the upgrade', async () => {
    await createDatabaseVersion(2, {
      habits: [legacyHabit],
      rewards: [
        {
          id: 'daily-bonus:2026-10-17',
          type: 'daily_bonus',
          date: DATE_KEY,
          xp: 5,
          reversed: false,
          createdAt: 2000,
        },
      ],
    })
    await saveHabit({
      id: 'habit-b',
      name: 'Second habit',
      icon: '📚',
      color: '#3B82F6',
      scheduledDays: [6],
      createdAt: 3000,
      updatedAt: 3000,
      archived: false,
    })

    const pet = await applyCompletion({
      id: 'completion-b',
      habitId: 'habit-b',
      date: '2026-10-18',
      completedAt: 4000,
    })

    expect(pet.xp).toBe(5)
    expect(pet.treats).toBe(1)
  })
})
