import type { Reward } from '../types/models'

export type PetStage = 'baby' | 'teen' | 'adult'

export const HABIT_COMPLETION_XP = 10
export const DAILY_BONUS_XP = 5

export const TEEN_THRESHOLD = 100
export const ADULT_THRESHOLD = 300

export const STAGE_LABELS: Record<PetStage, string> = {
  baby: 'Baby',
  teen: 'Teen',
  adult: 'Adult',
}

export function habitRewardKey(habitId: string, date: string): string {
  return `habit:${habitId}:${date}`
}

export function dailyBonusKey(date: string): string {
  return `daily-bonus:${date}`
}

export function stageForXp(totalXp: number): PetStage {
  if (totalXp >= ADULT_THRESHOLD) return 'adult'
  if (totalXp >= TEEN_THRESHOLD) return 'teen'
  return 'baby'
}

export function totalXpFromRewards(rewards: Reward[]): number {
  return rewards.reduce((sum, reward) => (reward.reversed ? sum : sum + reward.xp), 0)
}

export interface StageProgress {
  stage: PetStage
  earned: number
  goal: number | null
  nextStage: PetStage | null
}

export function stageProgress(totalXp: number): StageProgress {
  const stage = stageForXp(totalXp)
  if (stage === 'baby') {
    return { stage, earned: totalXp, goal: TEEN_THRESHOLD, nextStage: 'teen' }
  }
  if (stage === 'teen') {
    return {
      stage,
      earned: totalXp - TEEN_THRESHOLD,
      goal: ADULT_THRESHOLD - TEEN_THRESHOLD,
      nextStage: 'adult',
    }
  }
  return { stage, earned: 0, goal: null, nextStage: null }
}

export function isDailyBonusEarned(
  scheduledHabitIds: string[],
  completedHabitIds: string[]
): boolean {
  if (scheduledHabitIds.length === 0) return false
  const completed = new Set(completedHabitIds)
  return scheduledHabitIds.every((habitId) => completed.has(habitId))
}
