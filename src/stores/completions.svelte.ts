import type { Completion } from '../types/models'
import { addCompletion, deleteCompletion, listCompletions } from '../data/completionRepository'

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

export async function toggleCompletion(habitId: string, dateKey: string): Promise<void> {
  const existing = completions.find(
    (completion) => completion.habitId === habitId && completion.date === dateKey
  )

  if (existing) {
    completions = completions.filter((completion) => completion.id !== existing.id)
    try {
      await deleteCompletion(existing.id)
    } catch (error) {
      completions = [...completions, existing]
      throw toError(error, 'Could not undo the completion.')
    }
    return
  }

  const completion: Completion = {
    id: crypto.randomUUID(),
    habitId,
    date: dateKey,
    completedAt: Date.now(),
  }
  completions = [...completions, completion]
  try {
    await addCompletion(completion)
  } catch (error) {
    completions = completions.filter((item) => item.id !== completion.id)
    throw toError(error, 'Could not save the completion.')
  }
}
