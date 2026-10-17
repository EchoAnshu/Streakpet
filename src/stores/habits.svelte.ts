import type { Habit } from '../types/models'
import { applyHabitInput, buildHabit, isScheduledForDate, type HabitInput } from '../domain/habits'
import { listHabits, saveHabit } from '../data/habitRepository'

let habits = $state<Habit[]>([])
let loading = $state(true)
let loadError = $state<string | null>(null)
let loaded = $state(false)

function toError(error: unknown, fallback: string): Error {
  return error instanceof Error ? error : new Error(fallback)
}

export function getHabits(): Habit[] {
  return habits
}

export function isLoading(): boolean {
  return loading
}

export function getLoadError(): string | null {
  return loadError
}

export function activeHabits(): Habit[] {
  return habits.filter((habit) => !habit.archived)
}

export function scheduledHabitsFor(date: Date): Habit[] {
  return activeHabits().filter((habit) => isScheduledForDate(habit, date))
}

export async function loadHabits(force = false): Promise<void> {
  if (loaded && !force) return
  loading = true
  loadError = null
  try {
    habits = await listHabits()
    loaded = true
  } catch (error) {
    loadError = toError(error, 'Could not load habits.').message
  } finally {
    loading = false
  }
}

export async function createHabit(input: HabitInput): Promise<void> {
  const habit = buildHabit(input)
  habits = [...habits, habit]
  try {
    await saveHabit(habit)
  } catch (error) {
    habits = habits.filter((item) => item.id !== habit.id)
    throw toError(error, 'Could not save the habit.')
  }
}

export async function updateHabit(id: string, input: HabitInput): Promise<void> {
  const existing = habits.find((habit) => habit.id === id)
  if (!existing) return
  const updated = applyHabitInput(existing, input)
  habits = habits.map((habit) => (habit.id === id ? updated : habit))
  try {
    await saveHabit(updated)
  } catch (error) {
    habits = habits.map((habit) => (habit.id === id ? existing : habit))
    throw toError(error, 'Could not update the habit.')
  }
}

export async function archiveHabit(id: string): Promise<void> {
  const existing = habits.find((habit) => habit.id === id)
  if (!existing) return
  const now = Date.now()
  const archived: Habit = { ...existing, archived: true, archivedAt: now, updatedAt: now }
  habits = habits.map((habit) => (habit.id === id ? archived : habit))
  try {
    await saveHabit(archived)
  } catch (error) {
    habits = habits.map((habit) => (habit.id === id ? existing : habit))
    throw toError(error, 'Could not archive the habit.')
  }
}
