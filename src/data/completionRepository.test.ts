import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Completion, Habit } from '../types/models'
import { dailyBonusKey, habitRewardKey, totalXpFromRewards } from '../domain/pet'
import {
  applyCompletion,
  listCompletions,
  recalculateDailyBonus,
  revertCompletion,
} from './completionRepository'
import { closeDatabase } from './db'
import { saveHabit } from './habitRepository'
import { listRewards } from './rewardRepository'

const DATE_KEY = '2026-10-17'

let completionCounter = 0

function makeHabit(id: string, scheduledDays: number[]): Habit {
  const now = Date.now()
  return {
    id,
    name: `Habit ${id}`,
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
  it('records the completion, its habit reward, and the daily bonus', async () => {
    await saveHabit(makeHabit('a', [6]))
    const rewards = await applyCompletion(makeCompletion('a'))
    expect(await listCompletions()).toHaveLength(1)
    expect(totalXpFromRewards(rewards)).toBe(15)
    expect(rewards.find((reward) => reward.id === habitRewardKey('a', DATE_KEY))?.reversed).toBe(
      false
    )
    expect(rewards.find((reward) => reward.id === dailyBonusKey(DATE_KEY))?.reversed).toBe(false)
  })

  it('awards the daily bonus once all scheduled habits are complete', async () => {
    await saveHabit(makeHabit('a', [6]))
    await saveHabit(makeHabit('b', [6]))
    await applyCompletion(makeCompletion('a'))
    const rewards = await applyCompletion(makeCompletion('b'))
    expect(totalXpFromRewards(rewards)).toBe(25)
    expect(rewards.some((reward) => reward.id === dailyBonusKey(DATE_KEY) && !reward.reversed)).toBe(
      true
    )
  })

  it('does not award the daily bonus while a scheduled habit is missing', async () => {
    await saveHabit(makeHabit('a', [6]))
    await saveHabit(makeHabit('b', [6]))
    const rewards = await applyCompletion(makeCompletion('a'))
    expect(totalXpFromRewards(rewards)).toBe(10)
    expect(rewards.some((reward) => reward.id === dailyBonusKey(DATE_KEY))).toBe(false)
  })

  it('rejects duplicate completions for the same habit and date', async () => {
    await saveHabit(makeHabit('a', [6]))
    await applyCompletion(makeCompletion('a'))
    await expect(applyCompletion(makeCompletion('a'))).rejects.toThrow()
    expect(await listCompletions()).toHaveLength(1)
    expect(totalXpFromRewards(await listRewards())).toBe(15)
  })

  it('does not award the daily bonus when the habit is not scheduled on the date', async () => {
    await saveHabit(makeHabit('a', [1]))
    const rewards = await applyCompletion(makeCompletion('a'))
    expect(totalXpFromRewards(rewards)).toBe(10)
    expect(rewards.some((reward) => reward.id === dailyBonusKey(DATE_KEY))).toBe(false)
  })
})

describe('revertCompletion', () => {
  it('removes the completion and reverses its reward', async () => {
    await saveHabit(makeHabit('a', [6]))
    await applyCompletion(makeCompletion('a'))
    const rewards = await revertCompletion('a', DATE_KEY)
    expect(await listCompletions()).toHaveLength(0)
    expect(totalXpFromRewards(rewards)).toBe(0)
    expect(rewards.find((reward) => reward.id === habitRewardKey('a', DATE_KEY))?.reversed).toBe(
      true
    )
  })

  it('reverses the daily bonus when eligibility is lost', async () => {
    await saveHabit(makeHabit('a', [6]))
    await saveHabit(makeHabit('b', [6]))
    await applyCompletion(makeCompletion('a'))
    await applyCompletion(makeCompletion('b'))
    const rewards = await revertCompletion('b', DATE_KEY)
    expect(totalXpFromRewards(rewards)).toBe(10)
    expect(rewards.find((reward) => reward.id === dailyBonusKey(DATE_KEY))?.reversed).toBe(true)
  })

  it('keeps the daily bonus when eligibility remains after a schedule change', async () => {
    await saveHabit(makeHabit('a', [6]))
    await saveHabit(makeHabit('b', [6]))
    await applyCompletion(makeCompletion('a'))
    await applyCompletion(makeCompletion('b'))
    await saveHabit({ ...makeHabit('b', [1]), updatedAt: Date.now() })

    const rewards = await revertCompletion('b', DATE_KEY)
    expect(totalXpFromRewards(rewards)).toBe(15)
    expect(rewards.find((reward) => reward.id === dailyBonusKey(DATE_KEY))?.reversed).toBe(false)
  })

  it('reactivates the same reward on re-completion without duplicating XP', async () => {
    await saveHabit(makeHabit('a', [6]))
    await saveHabit(makeHabit('b', [6]))
    await applyCompletion(makeCompletion('a'))
    await revertCompletion('a', DATE_KEY)
    const rewards = await applyCompletion(makeCompletion('a'))
    expect(totalXpFromRewards(rewards)).toBe(10)
    expect(rewards).toHaveLength(1)
  })

  it('handles repeated completion and undo sequences consistently', async () => {
    await saveHabit(makeHabit('a', [6]))
    await saveHabit(makeHabit('b', [6]))

    for (let cycle = 0; cycle < 3; cycle += 1) {
      await applyCompletion(makeCompletion('a'))
      await applyCompletion(makeCompletion('b'))
      expect(totalXpFromRewards(await listRewards())).toBe(25)
      await revertCompletion('b', DATE_KEY)
      await revertCompletion('a', DATE_KEY)
      expect(totalXpFromRewards(await listRewards())).toBe(0)
    }

    const rewards = await listRewards()
    expect(rewards).toHaveLength(3)
    expect(await listCompletions()).toHaveLength(0)
  })
})

describe('persistence across reloads', () => {
  it('keeps completions and rewards after closing and reopening the database', async () => {
    await saveHabit(makeHabit('a', [6]))
    await applyCompletion(makeCompletion('a'))
    await closeDatabase()

    expect(await listCompletions()).toHaveLength(1)
    expect(totalXpFromRewards(await listRewards())).toBe(15)
  })
})

describe('recalculateDailyBonus', () => {
  it('awards the bonus when archiving removes the last incomplete habit', async () => {
    await saveHabit(makeHabit('a', [6]))
    await saveHabit(makeHabit('b', [6]))
    await applyCompletion(makeCompletion('a'))
    expect(totalXpFromRewards(await listRewards())).toBe(10)

    await saveHabit({ ...makeHabit('b', [6]), archived: true, archivedAt: Date.now() })
    const rewards = await recalculateDailyBonus(DATE_KEY)
    expect(totalXpFromRewards(rewards)).toBe(15)
    expect(rewards.find((reward) => reward.id === dailyBonusKey(DATE_KEY))?.reversed).toBe(false)
  })

  it('does nothing while scheduled habits remain incomplete', async () => {
    await saveHabit(makeHabit('a', [6]))
    await saveHabit(makeHabit('b', [6]))
    await applyCompletion(makeCompletion('a'))
    const rewards = await recalculateDailyBonus(DATE_KEY)
    expect(totalXpFromRewards(rewards)).toBe(10)
    expect(rewards.some((reward) => reward.id === dailyBonusKey(DATE_KEY))).toBe(false)
  })

  it('is idempotent when the bonus is already awarded', async () => {
    await saveHabit(makeHabit('a', [6]))
    await applyCompletion(makeCompletion('a'))
    const first = await recalculateDailyBonus(DATE_KEY)
    const second = await recalculateDailyBonus(DATE_KEY)
    expect(totalXpFromRewards(first)).toBe(15)
    expect(totalXpFromRewards(second)).toBe(15)
    expect(second).toHaveLength(2)
  })
})
