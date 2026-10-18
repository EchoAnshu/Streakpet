import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Completion, Habit } from '../types/models'
import { totalXpFromRewards } from '../domain/pet'
import { applyCompletion, listCompletions } from './completionRepository'
import { closeDatabase, openDatabase } from './db'
import { listHabits, saveHabit } from './habitRepository'
import { listRewards } from './rewardRepository'

const DATE_KEY = '2026-10-17'

const legacyHabit: Habit = {
  id: 'legacy-habit',
  name: 'Legacy habit',
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

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error('transaction failed'))
    transaction.onabort = () => reject(transaction.error ?? new Error('transaction aborted'))
  })
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

async function createVersion1Database(): Promise<void> {
  const request = indexedDB.open('streakpet-db', 1)
  request.onupgradeneeded = () => {
    const db = request.result
    const habits = db.createObjectStore('habits', { keyPath: 'id' })
    habits.createIndex('archived', 'archived')
    const completions = db.createObjectStore('completions', { keyPath: 'id' })
    completions.createIndex('habitId', 'habitId')
    completions.createIndex('date', 'date')
    completions.createIndex('habitId_date', ['habitId', 'date'], { unique: true })
  }

  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('open failed'))
  })

  const transaction = db.transaction(['habits', 'completions'], 'readwrite')
  transaction.objectStore('habits').put(legacyHabit)
  transaction.objectStore('completions').put(legacyCompletion)
  await transactionDone(transaction)
  db.close()
}

beforeEach(async () => {
  await resetDatabase()
})

describe('database upgrade', () => {
  it('upgrades a version 1 database to version 2 and adds the rewards store', async () => {
    await createVersion1Database()

    const db = await openDatabase()
    expect(db.version).toBe(2)
    expect([...db.objectStoreNames].sort()).toEqual(['completions', 'habits', 'rewards'])
    expect(await listHabits()).toHaveLength(1)
    expect(await listCompletions()).toHaveLength(1)
    expect(await listRewards()).toEqual([])
  })

  it('keeps existing data usable and accepts new rewards after the upgrade', async () => {
    await createVersion1Database()
    await openDatabase()

    await saveHabit({ ...legacyHabit, id: 'habit-b', name: 'Second habit' })
    const rewards = await applyCompletion({
      id: 'completion-b',
      habitId: 'habit-b',
      date: '2026-10-18',
      completedAt: 4000,
    })

    expect(await listHabits()).toHaveLength(2)
    expect(await listCompletions()).toHaveLength(2)
    expect(totalXpFromRewards(rewards)).toBe(10)
    expect(rewards.some((reward) => reward.id === 'habit:habit-b:2026-10-18')).toBe(true)
  })
})
