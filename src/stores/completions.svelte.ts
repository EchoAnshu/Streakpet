import type { Completion, Habit } from '../types/models'
import { applyCompletion, listCompletions, revertCompletion } from '../data/completionRepository'
import { parseDateKey } from '../domain/dates'
import { isScheduledForDate } from '../domain/habits'
import { setRewards } from './pet.svelte'

let completions = $state<Completion[]>([])
let loading = $state(true)
let loadError = $state<string | null>(null)
let loaded = $state(false)

function toError(error: unknown, fallback: string): Error {
  return error instanceof Error ? error : new Error(fallback)
}

export function isLoading(): boolean {
  return loading
}

export function getCompletions(): Completion[] {
  return completions
}

export function getLoadError(): string | null {
  return loadError
}

export function isCompleted(habitId: string, dateKey: string): boolean {
  return completions.some(
    (completion) => completion.habitId === habitId && completion.date === dateKey
  )
}

export function completedCountFor(dateKey: string, habitIds: string[]): number {
  const ids = new Set(habitIds)
  return completions.filter(
    (completion) => completion.date === dateKey && ids.has(completion.habitId)
  ).length
}

export async function loadCompletions(force = false): Promise<void> {
  if (loaded && !force) return
  loading = true
  loadError = null
  try {
    completions = await listCompletions()
    loaded = true
  } catch (error) {
    loadError = toError(error, 'Could not load completions.').message
  } finally {
    loading = false
  }
}

export async function toggleCompletion(habit: Habit, dateKey: string): Promise<void> {
  const existing = completions.find(
    (completion) => completion.habitId === habit.id && completion.date === dateKey
  )

  if (existing) {
    completions = completions.filter((completion) => completion.id !== existing.id)
    try {
      setRewards(await revertCompletion(habit.id, dateKey))
    } catch (error) {
      completions = [...completions, existing]
      throw toError(error, 'Could not undo the completion.')
    }
    return
  }

  if (!isScheduledForDate(habit, parseDateKey(dateKey))) {
    throw new Error(`"${habit.name}" is not scheduled on this day.`)
  }

  const completion: Completion = {
    id: crypto.randomUUID(),
    habitId: habit.id,
    date: dateKey,
    completedAt: Date.now(),
  }
  completions = [...completions, completion]
  try {
    setRewards(await applyCompletion(completion))
  } catch (error) {
    completions = completions.filter((item) => item.id !== completion.id)
    throw toError(error, 'Could not save the completion.')
  }
}
