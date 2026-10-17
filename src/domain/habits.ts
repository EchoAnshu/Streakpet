import type { Habit } from '../types/models'
import { getWeekdayIndex } from './dates'

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export const WEEKDAY_FULL_LABELS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

export const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6]

export interface HabitInput {
  name: string
  description: string
  scheduledDays: number[]
}

export interface HabitInputErrors {
  name?: string
  scheduledDays?: string
}

export function normalizeScheduledDays(days: number[]): number[] {
  const valid = new Set<number>()
  for (const day of days) {
    if (Number.isInteger(day) && day >= 0 && day <= 6) {
      valid.add(day)
    }
  }
  return [...valid].sort((a, b) => a - b)
}

export function validateHabitInput(input: HabitInput): HabitInputErrors {
  const errors: HabitInputErrors = {}
  const name = input.name.trim()
  if (name.length === 0) {
    errors.name = 'Enter a habit name.'
  } else if (name.length > 60) {
    errors.name = 'Keep the name to 60 characters or fewer.'
  }
  if (normalizeScheduledDays(input.scheduledDays).length === 0) {
    errors.scheduledDays = 'Select at least one day.'
  }
  return errors
}

export function buildHabit(input: HabitInput): Habit {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    description: input.description.trim() || undefined,
    scheduledDays: normalizeScheduledDays(input.scheduledDays),
    createdAt: now,
    updatedAt: now,
    archived: false,
  }
}

export function applyHabitInput(habit: Habit, input: HabitInput): Habit {
  return {
    ...habit,
    name: input.name.trim(),
    description: input.description.trim() || undefined,
    scheduledDays: normalizeScheduledDays(input.scheduledDays),
    updatedAt: Date.now(),
  }
}

export function isScheduledForDate(habit: Habit, date: Date): boolean {
  return habit.scheduledDays.includes(getWeekdayIndex(date))
}

export function formatSchedule(scheduledDays: number[]): string {
  const days = normalizeScheduledDays(scheduledDays)
  if (days.length === 7) return 'Every day'
  if (days.length === 5 && [1, 2, 3, 4, 5].every((day) => days.includes(day))) return 'Weekdays'
  if (days.length === 2 && days.includes(0) && days.includes(6)) return 'Weekends'
  return days.map((day) => WEEKDAY_LABELS[day]).join(', ')
}
