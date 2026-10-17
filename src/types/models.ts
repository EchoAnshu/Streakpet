export interface Habit {
  id: string
  name: string
  description?: string
  scheduledDays: number[]
  createdAt: number
  updatedAt: number
  archived: boolean
  archivedAt?: number
}

export interface Completion {
  id: string
  habitId: string
  date: string
  completedAt: number
}

export type RewardType = 'habit_completion' | 'daily_bonus'

export interface Reward {
  id: string
  type: RewardType
  date: string
  habitId?: string
  xp: number
  reversed: boolean
  createdAt: number
  reversedAt?: number
}
