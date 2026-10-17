import type { Completion, Habit } from '../types/models'
import { formatDateKey, getLocalDateKey } from './dates'

export interface HistoryEntry {
  id: string
  name: string
  archived: boolean
  completedAt: number
}

export interface HistoryDay {
  dateKey: string
  entries: HistoryEntry[]
}

export function groupCompletionsByDate(
  completions: Completion[],
  habits: Habit[]
): HistoryDay[] {
  const habitById = new Map(habits.map((habit) => [habit.id, habit]))
  const days = new Map<string, HistoryDay>()

  for (const completion of completions) {
    let day = days.get(completion.date)
    if (!day) {
      day = { dateKey: completion.date, entries: [] }
      days.set(completion.date, day)
    }
    const habit = habitById.get(completion.habitId)
    day.entries.push({
      id: completion.id,
      name: habit?.name ?? 'Unknown habit',
      archived: habit?.archived ?? false,
      completedAt: completion.completedAt,
    })
  }

  return [...days.values()]
    .sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1))
    .map((day) => ({
      ...day,
      entries: [...day.entries].sort((a, b) => a.completedAt - b.completedAt),
    }))
}

export function formatDayLabel(dateKey: string, today: Date = new Date()): string {
  const todayKey = getLocalDateKey(today)
  if (dateKey === todayKey) {
    return `Today · ${formatDateKey(dateKey)}`
  }
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (dateKey === getLocalDateKey(yesterday)) {
    return `Yesterday · ${formatDateKey(dateKey)}`
  }
  return formatDateKey(dateKey)
}
