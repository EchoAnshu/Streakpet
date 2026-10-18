export interface HabitReminder {
  time: string
  days: number[]
}

export interface Habit {
  id: string
  name: string
  icon: string
  color: string
  note?: string
  scheduledDays: number[]
  reminder?: HabitReminder
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

export interface Pet {
  id: 'pet'
  species: string | null
  name: string | null
  xp: number
  treats: number
  hunger: number
  lastHungerAt: number
  createdAt: number
}

export interface Feeding {
  id: string
  at: number
  xp: number
  hungerBefore: number
  hungerAfter: number
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
