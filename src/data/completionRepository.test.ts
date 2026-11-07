import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Completion, Habit } from '../types/models'
import { getLocalDateKey } from '../domain/dates'
import { applyCompletion, listCompletions, revertCompletion } from './completionRepository'
import { closeDatabase } from './db'
import { saveHabit } from './habitRepository'
import { adoptPet, getPet } from './petRepository'

const DATE_KEY = getLocalDateKey(new Date())

let completionCounter = 0

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

function makeCompletion(habitId: string): Completion {
  completionCounter += 1
  return {
    id: `completion-${habitId}-${completionCounter}`,
    habitId,
    date: DATE_KEY,
    completedAt: Date.now(),
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

beforeEach(async () => {
  completionCounter = 0
  await resetDatabase()
  await adoptPet('cat', 'Miso')
})

describe('applyCompletion', () => {
  it('records the completion and feeds the pet automatically', async () => {
    await saveHabit(makeHabit('a', [6]))
    await saveHabit(makeHabit('b', [6]))
    const pet = await applyCompletion(makeCompletion('a'))
    expect(await listCompletions()).toHaveLength(1)
    expect(pet.petStatus).toBe('healthy')
    expect(pet.xp).toBe(10)
    expect(pet.cookies).toBe(0)
  })

  it('counts one feed regardless of how many habits land on a day', async () => {
    await saveHabit(makeHabit('a', [6]))
    await saveHabit(makeHabit('b', [6]))
    await applyCompletion(makeCompletion('a'))
    const pet = await applyCompletion(makeCompletion('b'))
    expect(pet.xp).toBe(20)
    expect(pet.currentStreak).toBe(1)
  })

  it('hands out XP for every completion, even unscheduled ones', async () => {
    await saveHabit(makeHabit('a', [1]))
    const pet = await applyCompletion(makeCompletion('a'))
    expect(pet.xp).toBe(10)
    expect(pet.currentStreak).toBe(1)
  })

  it('rejects duplicate completions for the same habit and date', async () => {
    await saveHabit(makeHabit('a', [6]))
    await applyCompletion(makeCompletion('a'))
    await expect(applyCompletion(makeCompletion('a'))).rejects.toThrow()
    expect(await listCompletions()).toHaveLength(1)
    expect((await getPet()).xp).toBe(10)
  })
})

describe('revertCompletion', () => {
  it('removes the completion and its XP', async () => {
    await saveHabit(makeHabit('a', [6]))
    await applyCompletion(makeCompletion('a'))
    const pet = await revertCompletion('a', DATE_KEY)
    expect(await listCompletions()).toHaveLength(0)
    expect(pet.xp).toBe(0)
  })

  it('returns to hungry when the whole day is undone', async () => {
    await saveHabit(makeHabit('a', [6]))
    await applyCompletion(makeCompletion('a'))
    const pet = await revertCompletion('a', DATE_KEY)
    expect(pet.petStatus).toBe('hungry')
  })

  it('does nothing for a missing completion', async () => {
    await saveHabit(makeHabit('a', [6]))
    const pet = await revertCompletion('a', DATE_KEY)
    expect(pet.xp).toBe(0)
  })

  it('handles repeated completion and undo sequences consistently', async () => {
    await saveHabit(makeHabit('a', [6]))
    await saveHabit(makeHabit('b', [6]))

    for (let cycle = 0; cycle < 3; cycle += 1) {
      await applyCompletion(makeCompletion('a'))
      await applyCompletion(makeCompletion('b'))
      expect((await getPet()).xp).toBe(20)
      await revertCompletion('b', DATE_KEY)
      await revertCompletion('a', DATE_KEY)
      expect((await getPet()).xp).toBe(0)
    }

    expect(await listCompletions()).toHaveLength(0)
  })
})

describe('persistence across reloads', () => {
  it('keeps completions and XP after closing and reopening the database', async () => {
    await saveHabit(makeHabit('a', [6]))
    await applyCompletion(makeCompletion('a'))
    await closeDatabase()

    expect(await listCompletions()).toHaveLength(1)
    expect((await getPet()).xp).toBe(10)
  })
})
