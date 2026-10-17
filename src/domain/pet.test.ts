import { describe, expect, it } from 'vitest'
import type { Reward } from '../types/models'
import {
  ADULT_THRESHOLD,
  DAILY_BONUS_XP,
  HABIT_COMPLETION_XP,
  TEEN_THRESHOLD,
  dailyBonusKey,
  habitRewardKey,
  isDailyBonusEarned,
  stageForXp,
  stageProgress,
  totalXpFromRewards,
} from './pet'

function makeReward(id: string, xp: number, reversed: boolean): Reward {
  return {
    id,
    type: 'habit_completion',
    date: '2026-10-17',
    xp,
    reversed,
    createdAt: 0,
  }
}

describe('xp constants', () => {
  it('uses the documented reward values', () => {
    expect(HABIT_COMPLETION_XP).toBe(10)
    expect(DAILY_BONUS_XP).toBe(5)
    expect(TEEN_THRESHOLD).toBe(100)
    expect(ADULT_THRESHOLD).toBe(300)
  })
})

describe('reward keys', () => {
  it('builds deterministic keys', () => {
    expect(habitRewardKey('habit-1', '2026-10-17')).toBe('habit:habit-1:2026-10-17')
    expect(dailyBonusKey('2026-10-17')).toBe('daily-bonus:2026-10-17')
  })
})

describe('stageForXp', () => {
  it('maps XP to evolution stages at the boundaries', () => {
    expect(stageForXp(0)).toBe('baby')
    expect(stageForXp(99)).toBe('baby')
    expect(stageForXp(100)).toBe('teen')
    expect(stageForXp(299)).toBe('teen')
    expect(stageForXp(300)).toBe('adult')
    expect(stageForXp(1000)).toBe('adult')
  })
})

describe('totalXpFromRewards', () => {
  it('sums only active rewards', () => {
    expect(totalXpFromRewards([])).toBe(0)
    expect(totalXpFromRewards([makeReward('a', 10, false), makeReward('b', 10, false)])).toBe(20)
    expect(totalXpFromRewards([makeReward('a', 10, true)])).toBe(0)
    expect(
      totalXpFromRewards([makeReward('a', 10, false), makeReward('b', 5, true), makeReward('c', 10, false)])
    ).toBe(20)
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

describe('isDailyBonusEarned', () => {
  it('requires at least one scheduled habit', () => {
    expect(isDailyBonusEarned([], [])).toBe(false)
    expect(isDailyBonusEarned([], ['a'])).toBe(false)
  })

  it('requires every scheduled habit to be completed', () => {
    expect(isDailyBonusEarned(['a', 'b'], ['a', 'b'])).toBe(true)
    expect(isDailyBonusEarned(['a', 'b'], ['a'])).toBe(false)
    expect(isDailyBonusEarned(['a'], ['b'])).toBe(false)
  })

  it('allows completions of other habits', () => {
    expect(isDailyBonusEarned(['a'], ['a', 'b'])).toBe(true)
  })
})
