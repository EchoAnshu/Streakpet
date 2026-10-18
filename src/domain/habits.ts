import type { Habit, HabitReminder } from '../types/models'
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

export const HABIT_COLORS = [
  '#F25C1F',
  '#3B82F6',
  '#8B5CF6',
  '#14B8A6',
  '#EC4899',
  '#EAB308',
  '#22C55E',
  '#EF4444',
  '#6366F1',
  '#F97316',
]

export const HABIT_ICONS = [
  '🔥',
  '💪',
  '📚',
  '🏃',
  '💧',
  '🧘',
  '🌱',
  '🎯',
  '✍️',
  '🎸',
  '🥗',
  '😴',
  '🧹',
  '💰',
  '🚶',
  '🐾',
]

export const DEFAULT_HABIT_ICON = '🎯'
export const DEFAULT_HABIT_COLOR = HABIT_COLORS[0]
export const NOTE_MAX_LENGTH = 500

export interface HabitInput {
  name: string
  icon: string
  color: string
  note: string
  scheduledDays: number[]
  reminder?: HabitReminder
}

export interface HabitInputErrors {
  name?: string
  icon?: string
  color?: string
  scheduledDays?: string
  reminder?: string
  note?: string
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

export function isValidReminderTime(time: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time)
}

export function normalizeReminder(reminder: HabitReminder | undefined): HabitReminder | undefined {
  if (!reminder) return undefined
  if (!isValidReminderTime(reminder.time)) return undefined
  return { time: reminder.time, days: normalizeScheduledDays(reminder.days) }
}

export function validateHabitInput(input: HabitInput): HabitInputErrors {
  const errors: HabitInputErrors = {}
  const name = input.name.trim()
  if (name.length === 0) {
    errors.name = 'Enter a habit name.'
  } else if (name.length > 60) {
    errors.name = 'Keep the name to 60 characters or fewer.'
  }
  if (input.icon.trim().length === 0) {
    errors.icon = 'Pick an icon.'
  }
  if (!/^#[0-9a-fA-F]{6}$/.test(input.color)) {
    errors.color = 'Pick a color.'
  }
  if (normalizeScheduledDays(input.scheduledDays).length === 0) {
    errors.scheduledDays = 'Select at least one day.'
  }
  if (input.note.trim().length > NOTE_MAX_LENGTH) {
    errors.note = `Keep the note to ${NOTE_MAX_LENGTH} characters or fewer.`
  }
  if (input.reminder && !isValidReminderTime(input.reminder.time)) {
    errors.reminder = 'Pick a valid reminder time.'
  }
  return errors
}

export function defaultIconFor(index: number): string {
  if (index === 0) return '🔥'
  return HABIT_ICONS[index % HABIT_ICONS.length]
}

export function defaultColorFor(index: number): string {
  return HABIT_COLORS[index % HABIT_COLORS.length]
}

export function buildHabit(input: HabitInput): Habit {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    icon: input.icon.trim() || DEFAULT_HABIT_ICON,
    color: input.color || DEFAULT_HABIT_COLOR,
    note: input.note.trim() || undefined,
    scheduledDays: normalizeScheduledDays(input.scheduledDays),
    reminder: normalizeReminder(input.reminder),
    createdAt: now,
    updatedAt: now,
    archived: false,
  }
}

export function applyHabitInput(habit: Habit, input: HabitInput): Habit {
  return {
    ...habit,
    name: input.name.trim(),
    icon: input.icon.trim() || DEFAULT_HABIT_ICON,
    color: input.color || DEFAULT_HABIT_COLOR,
    note: input.note.trim() || undefined,
    scheduledDays: normalizeScheduledDays(input.scheduledDays),
    reminder: normalizeReminder(input.reminder),
    updatedAt: Date.now(),
  }
}

export function isScheduledForDate(habit: Habit, date: Date): boolean {
  return habit.scheduledDays.includes(getWeekdayIndex(date))
}

export function formatFrequency(scheduledDays: number[]): string {
  const days = normalizeScheduledDays(scheduledDays)
  if (days.length === 7) return 'Every day'
  if (days.length === 5 && [1, 2, 3, 4, 5].every((day) => days.includes(day))) return 'Weekdays'
  if (days.length === 2 && days.includes(0) && days.includes(6)) return 'Weekends'
  return `${days.map((day) => WEEKDAY_LABELS[day]).join(', ')}`
}

export function formatSchedule(scheduledDays: number[]): string {
  return formatFrequency(scheduledDays)
}

export function formatReminder(reminder: HabitReminder): string {
  const days = normalizeScheduledDays(reminder.days)
  if (days.length === 0 || days.length === 7) {
    return `Every day at ${formatReminderTime(reminder.time)}`
  }
  return `${days.map((day) => WEEKDAY_LABELS[day]).join(', ')} at ${formatReminderTime(reminder.time)}`
}

export function formatReminderTime(time: string): string {
  const [hoursText, minutesText] = time.split(':')
  const hours = Number(hoursText)
  const minutes = Number(minutesText)
  const suffix = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 === 0 ? 12 : hours % 12
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${suffix}`
}
