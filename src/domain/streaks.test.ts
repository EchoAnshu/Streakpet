import { describe, expect, it } from 'vitest'
import type { Completion, Habit } from '../types/models'
import { calculateCurrentStreak, calculateLongestStreak } from './streaks'

const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6]
const WEEKDAYS = [1, 2, 3, 4, 5]

function dateFromKey(key: string): Date {
  const parts = key.split('-').map(Number)
  return new Date(parts[0], parts[1] - 1, parts[2])
}

function makeHabit(scheduledDays: number[], createdKey: string): Habit {
  const createdAt = dateFromKey(createdKey).getTime()
  return {
    id: 'habit-1',
    name: 'Test habit',
    scheduledDays,
    createdAt,
    updatedAt: createdAt,
    archived: false,
  }
}

function makeCompletions(keys: string[]): Completion[] {
  return keys.map((date, index) => ({
    id: `completion-${index}`,
    habitId: 'habit-1',
    date,
    completedAt: dateFromKey(date).getTime(),
  }))
}

describe('calculateCurrentStreak', () => {
  it('counts consecutive completions ending today', () => {
    const habit = makeHabit(EVERY_DAY, '2026-10-12')
    const completions = makeCompletions(['2026-10-15', '2026-10-16', '2026-10-17'])
    expect(calculateCurrentStreak(habit, completions, dateFromKey('2026-10-17'))).toBe(3)
  })

  it('does not break the streak when today is not yet completed', () => {
    const habit = makeHabit(EVERY_DAY, '2026-10-01')
    const completions = makeCompletions(['2026-10-15', '2026-10-16'])
    expect(calculateCurrentStreak(habit, completions, dateFromKey('2026-10-17'))).toBe(2)
  })

  it('breaks the streak at a missed scheduled day', () => {
    const habit = makeHabit(EVERY_DAY, '2026-10-01')
    const completions = makeCompletions(['2026-10-15', '2026-10-17'])
    expect(calculateCurrentStreak(habit, completions, dateFromKey('2026-10-17'))).toBe(1)
  })

  it('ignores unscheduled days for weekday-only habits', () => {
    const habit = makeHabit(WEEKDAYS, '2026-10-01')
    const completions = makeCompletions(['2026-10-16', '2026-10-19'])
    expect(calculateCurrentStreak(habit, completions, dateFromKey('2026-10-19'))).toBe(2)
  })

  it('does not break the streak on unscheduled days between completions', () => {
    const habit = makeHabit([1, 3], '2026-10-01')
    const completions = makeCompletions(['2026-10-12', '2026-10-14'])
    expect(calculateCurrentStreak(habit, completions, dateFromKey('2026-10-15'))).toBe(2)
  })

  it('does not count completions before the habit creation date', () => {
    const habit = makeHabit(EVERY_DAY, '2026-10-15')
    const completions = makeCompletions(['2026-10-10', '2026-10-14', '2026-10-16'])
    expect(calculateCurrentStreak(habit, completions, dateFromKey('2026-10-17'))).toBe(1)
  })

  it('ignores completions dated in the future', () => {
    const habit = makeHabit(EVERY_DAY, '2026-10-01')
    const completions = makeCompletions(['2026-10-16', '2026-10-20'])
    expect(calculateCurrentStreak(habit, completions, dateFromKey('2026-10-17'))).toBe(1)
  })

  it('handles month boundaries', () => {
    const habit = makeHabit(EVERY_DAY, '2026-10-01')
    const completions = makeCompletions(['2026-10-30', '2026-10-31', '2026-11-01'])
    expect(calculateCurrentStreak(habit, completions, dateFromKey('2026-11-01'))).toBe(3)
  })

  it('handles year boundaries', () => {
    const habit = makeHabit(EVERY_DAY, '2025-12-01')
    const completions = makeCompletions(['2025-12-31', '2026-01-01'])
    expect(calculateCurrentStreak(habit, completions, dateFromKey('2026-01-01'))).toBe(2)
  })

  it('handles leap days', () => {
    const habit = makeHabit(EVERY_DAY, '2024-02-01')
    const completions = makeCompletions(['2024-02-28', '2024-02-29', '2024-03-01'])
    expect(calculateCurrentStreak(habit, completions, dateFromKey('2024-03-01'))).toBe(3)
  })

  it('counts consecutive completions across weekends', () => {
    const habit = makeHabit(WEEKDAYS, '2026-10-01')
    const completions = makeCompletions([
      '2026-10-09',
      '2026-10-12',
      '2026-10-13',
      '2026-10-14',
      '2026-10-15',
      '2026-10-16',
    ])
    expect(calculateCurrentStreak(habit, completions, dateFromKey('2026-10-17'))).toBe(6)
  })

  it('returns zero without completions', () => {
    const habit = makeHabit(EVERY_DAY, '2026-10-01')
    expect(calculateCurrentStreak(habit, [], dateFromKey('2026-10-17'))).toBe(0)
  })
})

describe('calculateLongestStreak', () => {
  it('keeps the best run after the current streak breaks', () => {
    const habit = makeHabit(EVERY_DAY, '2026-09-01')
    const completions = makeCompletions([
      '2026-09-01',
      '2026-09-02',
      '2026-09-03',
      '2026-09-04',
      '2026-10-16',
    ])
    expect(calculateLongestStreak(habit, completions, dateFromKey('2026-10-17'))).toBe(4)
  })

  it('does not treat an incomplete today as a break', () => {
    const habit = makeHabit(EVERY_DAY, '2026-10-01')
    const completions = makeCompletions(['2026-10-15', '2026-10-16'])
    expect(calculateLongestStreak(habit, completions, dateFromKey('2026-10-17'))).toBe(2)
  })

  it('ignores unscheduled days between runs', () => {
    const habit = makeHabit(WEEKDAYS, '2026-10-01')
    const completions = makeCompletions([
      '2026-10-09',
      '2026-10-12',
      '2026-10-13',
      '2026-10-14',
      '2026-10-15',
      '2026-10-16',
    ])
    expect(calculateLongestStreak(habit, completions, dateFromKey('2026-10-17'))).toBe(6)
  })

  it('resets the run at a missed scheduled day', () => {
    const habit = makeHabit(WEEKDAYS, '2026-10-01')
    const completions = makeCompletions(['2026-10-12', '2026-10-13', '2026-10-15'])
    expect(calculateLongestStreak(habit, completions, dateFromKey('2026-10-16'))).toBe(2)
  })

  it('ignores completions dated in the future', () => {
    const habit = makeHabit(EVERY_DAY, '2026-10-01')
    const completions = makeCompletions(['2026-10-16', '2026-10-18', '2026-10-19'])
    expect(calculateLongestStreak(habit, completions, dateFromKey('2026-10-17'))).toBe(1)
  })

  it('returns zero without completions', () => {
    const habit = makeHabit(WEEKDAYS, '2026-10-01')
    expect(calculateLongestStreak(habit, [], dateFromKey('2026-10-17'))).toBe(0)
  })
})
