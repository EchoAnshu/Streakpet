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
