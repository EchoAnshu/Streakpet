import type { Completion, Habit } from '../types/models'
import { getLocalDateKey, getWeekdayIndex } from './dates'

function completedDatesFor(habitId: string, completions: Completion[]): Set<string> {
  const dates = new Set<string>()
  for (const completion of completions) {
    if (completion.habitId === habitId) {
      dates.add(completion.date)
    }
  }
  return dates
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function calculateCurrentStreak(
  habit: Habit,
  completions: Completion[],
  today: Date = new Date()
): number {
  const completedDates = completedDatesFor(habit.id, completions)
  const createdKey = getLocalDateKey(new Date(habit.createdAt))
  const todayKey = getLocalDateKey(today)

  let streak = 0
  const cursor = startOfDay(today)

  while (getLocalDateKey(cursor) >= createdKey) {
    const key = getLocalDateKey(cursor)
    if (habit.scheduledDays.includes(getWeekdayIndex(cursor))) {
      if (completedDates.has(key)) {
        streak += 1
      } else if (key !== todayKey) {
        break
      }
    }
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

export function calculateLongestStreak(
  habit: Habit,
  completions: Completion[],
  today: Date = new Date()
): number {
  const completedDates = completedDatesFor(habit.id, completions)
  const todayKey = getLocalDateKey(today)

  let longest = 0
  let run = 0
  const cursor = startOfDay(new Date(habit.createdAt))

  while (getLocalDateKey(cursor) <= todayKey) {
    const key = getLocalDateKey(cursor)
    if (habit.scheduledDays.includes(getWeekdayIndex(cursor))) {
      if (completedDates.has(key)) {
        run += 1
        if (run > longest) longest = run
      } else if (key !== todayKey) {
        run = 0
      }
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  return longest
}
