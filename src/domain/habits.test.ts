import { describe, expect, it } from 'vitest'
import type { Habit } from '../types/models'
import {
  applyHabitInput,
  buildHabit,
  formatSchedule,
  isScheduledForDate,
  normalizeScheduledDays,
  validateHabitInput,
  type HabitInput,
} from './habits'

function input(partial: Partial<HabitInput> = {}): HabitInput {
  return { name: 'Read', description: '', scheduledDays: [1], ...partial }
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

  it('requires at least one valid scheduled day', () => {
    expect(validateHabitInput(input({ scheduledDays: [] })).scheduledDays).toBeTruthy()
    expect(validateHabitInput(input({ scheduledDays: [7, -2] })).scheduledDays).toBeTruthy()
    expect(validateHabitInput(input({ scheduledDays: [5] })).scheduledDays).toBeUndefined()
  })

  it('accepts a valid input', () => {
    expect(validateHabitInput(input())).toEqual({})
  })
})

describe('buildHabit', () => {
  it('trims the name and drops an empty description', () => {
    const habit = buildHabit(input({ name: '  Run  ', description: '   ' }))
    expect(habit.name).toBe('Run')
    expect(habit.description).toBeUndefined()
    expect(habit.archived).toBe(false)
  })

  it('keeps a non-empty description and normalizes days', () => {
    const habit = buildHabit(input({ description: ' 5k around the park ', scheduledDays: [6, 0, 6] }))
    expect(habit.description).toBe('5k around the park')
    expect(habit.scheduledDays).toEqual([0, 6])
  })

  it('creates unique ids', () => {
    expect(buildHabit(input()).id).not.toBe(buildHabit(input()).id)
  })
})

describe('applyHabitInput', () => {
  it('updates editable fields and keeps identity', () => {
    const base: Habit = {
      id: 'habit-1',
      name: 'Old',
      description: 'Old description',
      scheduledDays: [1],
      createdAt: 100,
      updatedAt: 100,
      archived: false,
    }
    const updated = applyHabitInput(base, input({ name: ' New ', description: '', scheduledDays: [3, 1] }))
    expect(updated.id).toBe('habit-1')
    expect(updated.createdAt).toBe(100)
    expect(updated.archived).toBe(false)
    expect(updated.name).toBe('New')
    expect(updated.description).toBeUndefined()
    expect(updated.scheduledDays).toEqual([1, 3])
    expect(updated.updatedAt).toBeGreaterThanOrEqual(100)
  })
})

describe('isScheduledForDate', () => {
  it('matches the weekday of the date', () => {
    const habit: Habit = {
      id: 'habit-1',
      name: 'Read',
      scheduledDays: [6],
      createdAt: 0,
      updatedAt: 0,
      archived: false,
    }
    expect(isScheduledForDate(habit, new Date(2026, 9, 17))).toBe(true)
    expect(isScheduledForDate(habit, new Date(2026, 9, 16))).toBe(false)
  })
})

describe('formatSchedule', () => {
  it('labels common schedules', () => {
    expect(formatSchedule([0, 1, 2, 3, 4, 5, 6])).toBe('Every day')
    expect(formatSchedule([1, 2, 3, 4, 5])).toBe('Weekdays')
    expect(formatSchedule([0, 6])).toBe('Weekends')
  })

  it('lists custom schedules in weekday order', () => {
    expect(formatSchedule([6, 2, 0])).toBe('Sun, Tue, Sat')
  })
})
