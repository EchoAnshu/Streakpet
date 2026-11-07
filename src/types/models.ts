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

export type PetStatus = 'healthy' | 'hungry' | 'gone'

export interface TreatLot {
  at: number
  count: number
}

export interface Pet {
  id: 'pet'
  species: string | null
  name: string | null
  xp: number
  createdAt: number
  // Cookie inventory: earned at streak milestones only, capped, shared weekly cycle.
  cookies: number
  cookieEarnerAt?: number
  cookieMilestoneDates?: string[]
  // Streak protection spend ledger — one protected missed day per entry.
  cookieSpendDates?: string[]
  currentStreak: number
  activeDays: number
  longestStreak: number
  petStatus: PetStatus
  // Local date the current streak life starts counting from.
  streakAnchorDate?: string
  lastRunAwayAt?: number
}

// Legacy shapes (treats/treatLots/hunger/lastHungerAt) are migrated in the
// repository layer and ignored by the survival engine.

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
