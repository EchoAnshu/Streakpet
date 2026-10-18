import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Completion, Habit } from '../types/models'
import { applyCompletion, listCompletions, revertCompletion } from './completionRepository'
import { closeDatabase } from './db'
import { saveHabit } from './habitRepository'
import { getPet } from './petRepository'

const DATE_KEY = '2026-10-17'

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
})

describe('applyCompletion', () => {
  it('records the completion and awards one treat', async () => {
    await saveHabit(makeHabit('a', [6]))
    await saveHabit(makeHabit('b', [6]))
    const pet = await applyCompletion(makeCompletion('a'))
    expect(await listCompletions()).toHaveLength(1)
    expect(pet.treats).toBe(1)
  })

  it('awards the bonus treat once all scheduled habits are complete', async () => {
    await saveHabit(makeHabit('a', [6]))
    await saveHabit(makeHabit('b', [6]))
    await applyCompletion(makeCompletion('a'))
    const pet = await applyCompletion(makeCompletion('b'))
    expect(pet.treats).toBe(3)
  })

  it('gives a single-habit day the bonus too', async () => {
    await saveHabit(makeHabit('a', [6]))
    const pet = await applyCompletion(makeCompletion('a'))
    expect(pet.treats).toBe(2)
  })

  it('does not award the bonus while a scheduled habit is missing', async () => {
    await saveHabit(makeHabit('a', [6]))
    await saveHabit(makeHabit('b', [6]))
    const pet = await applyCompletion(makeCompletion('a'))
    expect(pet.treats).toBe(1)
  })

  it('does not award the bonus for unscheduled habits', async () => {
    await saveHabit(makeHabit('a', [1]))
    const pet = await applyCompletion(makeCompletion('a'))
    expect(pet.treats).toBe(1)
  })

  it('rejects duplicate completions for the same habit and date', async () => {
    await saveHabit(makeHabit('a', [6]))
    await applyCompletion(makeCompletion('a'))
    await expect(applyCompletion(makeCompletion('a'))).rejects.toThrow()
    expect(await listCompletions()).toHaveLength(1)
    expect((await getPet()).treats).toBe(2)
  })

  it('refreshes the hunger timestamp', async () => {
    await saveHabit(makeHabit('a', [6]))
    const pet = await applyCompletion(makeCompletion('a'))
    expect(pet.hunger).toBeCloseTo(100, 4)
    expect(pet.lastHungerAt).toBeGreaterThan(0)
  })
})

describe('revertCompletion', () => {
  it('removes the completion and its treat', async () => {
    await saveHabit(makeHabit('a', [6]))
    await applyCompletion(makeCompletion('a'))
    const pet = await revertCompletion('a', DATE_KEY)
    expect(await listCompletions()).toHaveLength(0)
    expect(pet.treats).toBe(0)
  })

  it('reverses the bonus when eligibility is lost', async () => {
    await saveHabit(makeHabit('a', [6]))
    await saveHabit(makeHabit('b', [6]))
    await applyCompletion(makeCompletion('a'))
    await applyCompletion(makeCompletion('b'))
    const pet = await revertCompletion('b', DATE_KEY)
    expect(pet.treats).toBe(1)
    expect(await listCompletions()).toHaveLength(1)
  })

  it('keeps the bonus when eligibility remains after a schedule change', async () => {
    await saveHabit(makeHabit('a', [6]))
    await saveHabit(makeHabit('b', [6]))
    await applyCompletion(makeCompletion('a'))
    await applyCompletion(makeCompletion('b'))
    await saveHabit({ ...makeHabit('b', [1]), updatedAt: Date.now() })

    const pet = await revertCompletion('b', DATE_KEY)
    expect(pet.treats).toBe(2)
  })

  it('does nothing for a missing completion', async () => {
    await saveHabit(makeHabit('a', [6]))
    const pet = await revertCompletion('a', DATE_KEY)
    expect(pet.treats).toBe(0)
  })

  it('never drops treats below zero when a treat was already fed', async () => {
    await saveHabit(makeHabit('a', [6]))
    await applyCompletion(makeCompletion('a'))
    const pet = await revertCompletion('a', DATE_KEY)
    expect(pet.treats).toBe(0)
  })

  it('handles repeated completion and undo sequences consistently', async () => {
    await saveHabit(makeHabit('a', [6]))
    await saveHabit(makeHabit('b', [6]))

    for (let cycle = 0; cycle < 3; cycle += 1) {
      await applyCompletion(makeCompletion('a'))
      await applyCompletion(makeCompletion('b'))
      expect((await getPet()).treats).toBe(3)
      await revertCompletion('b', DATE_KEY)
      await revertCompletion('a', DATE_KEY)
      expect((await getPet()).treats).toBe(0)
    }

    expect(await listCompletions()).toHaveLength(0)
  })
})

describe('persistence across reloads', () => {
  it('keeps completions and treats after closing and reopening the database', async () => {
    await saveHabit(makeHabit('a', [6]))
    await applyCompletion(makeCompletion('a'))
    await closeDatabase()

    expect(await listCompletions()).toHaveLength(1)
    expect((await getPet()).treats).toBe(2)
  })
})
