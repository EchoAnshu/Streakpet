import { describe, expect, it } from 'vitest'
import type { Habit } from '../types/models'
import {
  DEFAULT_HABIT_COLOR,
  DEFAULT_HABIT_ICON,
  applyHabitInput,
  buildHabit,
  defaultColorFor,
  defaultIconFor,
  formatFrequency,
  formatReminder,
  formatReminderTime,
  formatSchedule,
  isScheduledForDate,
  isValidReminderTime,
  normalizeReminder,
  normalizeScheduledDays,
  validateHabitInput,
  type HabitInput,
} from './habits'

function input(partial: Partial<HabitInput> = {}): HabitInput {
  return {
    name: 'Read',
    icon: '📚',
    color: '#F25C1F',
    note: '',
    scheduledDays: [1],
    ...partial,
  }
}

function baseHabit(partial: Partial<Habit> = {}): Habit {
  return {
    id: 'habit-1',
    name: 'Read',
    icon: '📚',
    color: '#F25C1F',
    scheduledDays: [1],
    createdAt: 100,
    updatedAt: 100,
    archived: false,
    ...partial,
  }
}

describe('normalizeScheduledDays', () => {
  it('deduplicates and sorts valid days', () => {
    expect(normalizeScheduledDays([3, 1, 3, 0])).toEqual([0, 1, 3])
  })

  it('drops invalid weekdays', () => {
    expect(normalizeScheduledDays([-1, 7, 2, 2.5, 4])).toEqual([2, 4])
  })
})

describe('validateHabitInput', () => {
  it('rejects an empty or whitespace-only name', () => {
    expect(validateHabitInput(input({ name: '' })).name).toBeTruthy()
    expect(validateHabitInput(input({ name: '   ' })).name).toBeTruthy()
  })

  it('rejects names longer than 60 characters', () => {
    expect(validateHabitInput(input({ name: 'a'.repeat(61) })).name).toBeTruthy()
    expect(validateHabitInput(input({ name: 'a'.repeat(60) })).name).toBeUndefined()
  })

  it('requires an icon and a hex color', () => {
    expect(validateHabitInput(input({ icon: ' ' })).icon).toBeTruthy()
    expect(validateHabitInput(input({ color: 'red' })).color).toBeTruthy()
    expect(validateHabitInput(input({ color: '#ABCDEF' })).color).toBeUndefined()
  })

  it('requires at least one valid scheduled day', () => {
    expect(validateHabitInput(input({ scheduledDays: [] })).scheduledDays).toBeTruthy()
    expect(validateHabitInput(input({ scheduledDays: [7, -2] })).scheduledDays).toBeTruthy()
    expect(validateHabitInput(input({ scheduledDays: [5] })).scheduledDays).toBeUndefined()
  })

  it('rejects notes beyond the limit', () => {
    expect(validateHabitInput(input({ note: 'a'.repeat(501) })).note).toBeTruthy()
    expect(validateHabitInput(input({ note: 'a'.repeat(500) })).note).toBeUndefined()
  })

  it('rejects invalid reminder times', () => {
    expect(validateHabitInput(input({ reminder: { time: '25:00', days: [1] } })).reminder).toBeTruthy()
    expect(validateHabitInput(input({ reminder: { time: '08:30', days: [1] } })).reminder).toBeUndefined()
  })

  it('accepts a valid input', () => {
    expect(validateHabitInput(input())).toEqual({})
  })
})

describe('reminder helpers', () => {
  it('validates HH:MM times', () => {
    expect(isValidReminderTime('00:00')).toBe(true)
    expect(isValidReminderTime('23:59')).toBe(true)
    expect(isValidReminderTime('24:00')).toBe(false)
    expect(isValidReminderTime('8:30')).toBe(false)
  })

  it('normalizes reminder days', () => {
    expect(normalizeReminder({ time: '08:00', days: [5, 1, 1] })).toEqual({
      time: '08:00',
      days: [1, 5],
    })
    expect(normalizeReminder({ time: 'nope', days: [1] })).toBeUndefined()
    expect(normalizeReminder(undefined)).toBeUndefined()
  })

  it('formats reminder times in 12-hour style', () => {
    expect(formatReminderTime('08:00')).toBe('8:00 AM')
    expect(formatReminderTime('00:05')).toBe('12:05 AM')
    expect(formatReminderTime('12:30')).toBe('12:30 PM')
    expect(formatReminderTime('19:45')).toBe('7:45 PM')
  })

  it('formats full reminders', () => {
    expect(formatReminder({ time: '08:00', days: [] })).toBe('Every day at 8:00 AM')
    expect(formatReminder({ time: '08:00', days: [0, 1, 2, 3, 4, 5, 6] })).toBe(
      'Every day at 8:00 AM'
    )
    expect(formatReminder({ time: '19:00', days: [1, 3] })).toBe('Mon, Wed at 7:00 PM')
  })
})

describe('defaults', () => {
  it('gives the first habit a fire icon and cycles colors', () => {
    expect(defaultIconFor(0)).toBe('🔥')
    expect(defaultIconFor(1)).toBeTruthy()
    expect(defaultColorFor(0)).not.toBe(defaultColorFor(1))
  })
})

describe('buildHabit', () => {
  it('trims fields and drops an empty note', () => {
    const habit = buildHabit(input({ name: '  Run  ', note: '   ', icon: '', color: '' }))
    expect(habit.name).toBe('Run')
    expect(habit.note).toBeUndefined()
    expect(habit.icon).toBe(DEFAULT_HABIT_ICON)
    expect(habit.color).toBe(DEFAULT_HABIT_COLOR)
    expect(habit.archived).toBe(false)
  })

  it('keeps a note, icon, color, and normalizes days', () => {
    const habit = buildHabit(
      input({ note: ' 5k around the park ', scheduledDays: [6, 0, 6] })
    )
    expect(habit.note).toBe('5k around the park')
    expect(habit.icon).toBe('📚')
    expect(habit.color).toBe('#F25C1F')
    expect(habit.scheduledDays).toEqual([0, 6])
  })

  it('keeps a valid reminder and drops an invalid one', () => {
    expect(buildHabit(input({ reminder: { time: '07:15', days: [1] } })).reminder).toEqual({
      time: '07:15',
      days: [1],
    })
    expect(buildHabit(input({ reminder: { time: 'bad', days: [1] } })).reminder).toBeUndefined()
  })

  it('creates unique ids', () => {
    expect(buildHabit(input()).id).not.toBe(buildHabit(input()).id)
  })
})

describe('applyHabitInput', () => {
  it('updates editable fields and keeps identity', () => {
    const updated = applyHabitInput(
      baseHabit(),
      input({ name: ' New ', note: '', icon: '🏃', color: '#3B82F6', scheduledDays: [3, 1] })
    )
    expect(updated.id).toBe('habit-1')
    expect(updated.createdAt).toBe(100)
    expect(updated.archived).toBe(false)
    expect(updated.name).toBe('New')
    expect(updated.note).toBeUndefined()
    expect(updated.icon).toBe('🏃')
    expect(updated.color).toBe('#3B82F6')
    expect(updated.scheduledDays).toEqual([1, 3])
    expect(updated.updatedAt).toBeGreaterThanOrEqual(100)
  })
})

describe('isScheduledForDate', () => {
  it('matches the weekday of the date', () => {
    const habit = baseHabit({ scheduledDays: [6] })
    expect(isScheduledForDate(habit, new Date(2026, 9, 17))).toBe(true)
    expect(isScheduledForDate(habit, new Date(2026, 9, 16))).toBe(false)
  })
})

describe('formatSchedule and formatFrequency', () => {
  it('labels common schedules', () => {
    expect(formatSchedule([0, 1, 2, 3, 4, 5, 6])).toBe('Every day')
    expect(formatSchedule([1, 2, 3, 4, 5])).toBe('Weekdays')
    expect(formatSchedule([0, 6])).toBe('Weekends')
  })

  it('lists custom schedules in weekday order', () => {
    expect(formatSchedule([6, 2, 0])).toBe('Sun, Tue, Sat')
    expect(formatFrequency([6, 2, 0])).toBe('Sun, Tue, Sat')
  })
})
