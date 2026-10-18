import { describe, expect, it } from 'vitest'
import type { Completion, Habit } from '../types/models'
import { formatDayLabel, groupCompletionsByDate } from './history'

function makeHabit(id: string, archived = false): Habit {
  return {
    id,
    name: `Habit ${id}`,
    icon: '🎯',
    color: '#F25C1F',
    scheduledDays: [0, 1, 2, 3, 4, 5, 6],
    createdAt: 0,
    updatedAt: 0,
    archived,
  }
}

function makeCompletion(id: string, habitId: string, date: string, completedAt: number): Completion {
  return { id, habitId, date, completedAt }
}

describe('groupCompletionsByDate', () => {
  it('groups completions by date, newest day first', () => {
    const habits = [makeHabit('a'), makeHabit('b')]
    const completions = [
      makeCompletion('c1', 'a', '2026-10-15', 100),
      makeCompletion('c2', 'b', '2026-10-17', 200),
      makeCompletion('c3', 'a', '2026-10-15', 300),
    ]

    const days = groupCompletionsByDate(completions, habits)
    expect(days.map((day) => day.dateKey)).toEqual(['2026-10-17', '2026-10-15'])
    expect(days[1].entries.map((entry) => entry.id)).toEqual(['c1', 'c3'])
  })

  it('orders entries within a day by completion time', () => {
    const habits = [makeHabit('a')]
    const completions = [
      makeCompletion('late', 'a', '2026-10-17', 900),
      makeCompletion('early', 'a', '2026-10-17', 100),
    ]
    const days = groupCompletionsByDate(completions, habits)
    expect(days[0].entries.map((entry) => entry.id)).toEqual(['early', 'late'])
  })

  it('marks archived habits and resolves names', () => {
    const habits = [makeHabit('a', true)]
    const days = groupCompletionsByDate(
      [makeCompletion('c1', 'a', '2026-10-17', 100)],
      habits
    )
    expect(days[0].entries[0].name).toBe('Habit a')
    expect(days[0].entries[0].archived).toBe(true)
  })

  it('falls back for completions without a matching habit', () => {
    const days = groupCompletionsByDate(
      [makeCompletion('c1', 'missing', '2026-10-17', 100)],
      []
    )
    expect(days[0].entries[0].name).toBe('Unknown habit')
  })

  it('returns an empty list for no completions', () => {
    expect(groupCompletionsByDate([], [makeHabit('a')])).toEqual([])
  })

  it('handles a year of history with ten habits efficiently', () => {
    const habits = Array.from({ length: 10 }, (_, index) => makeHabit(`h${index}`))
    const completions: Completion[] = []
    for (let day = 0; day < 365; day += 1) {
      const date = new Date(2025, 9, 1 + day)
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      for (const habit of habits) {
        completions.push(makeCompletion(`${habit.id}-${day}`, habit.id, dateKey, day * 10))
      }
    }

    const days = groupCompletionsByDate(completions, habits)
    expect(days).toHaveLength(365)
    expect(days.every((day) => day.entries.length === 10)).toBe(true)
  })
})

describe('formatDayLabel', () => {
  const today = new Date(2026, 9, 18)

  it('labels today and yesterday', () => {
    expect(formatDayLabel('2026-10-18', today).startsWith('Today · ')).toBe(true)
    expect(formatDayLabel('2026-10-17', today).startsWith('Yesterday · ')).toBe(true)
  })

  it('labels older dates with the full date', () => {
    const label = formatDayLabel('2026-10-10', today)
    expect(label.startsWith('Today')).toBe(false)
    expect(label.startsWith('Yesterday')).toBe(false)
    expect(label.length).toBeGreaterThan(0)
  })
})
