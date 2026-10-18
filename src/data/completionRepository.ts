import type { Completion, Habit, Pet } from '../types/models'
import { openDatabase, requestToPromise, transactionDone } from './db'
import { parseDateKey } from '../domain/dates'
import { isScheduledForDate } from '../domain/habits'
import {
  FULL_DAY_BONUS_TREATS,
  TREATS_PER_COMPLETION,
  createDefaultPet,
  hungerAt,
} from '../domain/pet'

export async function listCompletions(): Promise<Completion[]> {
  const db = await openDatabase()
  const transaction = db.transaction('completions', 'readonly')
  const store = transaction.objectStore('completions')
  const [completions] = await Promise.all([
    requestToPromise(store.getAll() as IDBRequest<Completion[]>),
    transactionDone(transaction),
  ])
  return completions
}

async function scheduledHabitIdsFor(store: IDBObjectStore, date: Date): Promise<string[]> {
  const habits = await requestToPromise(store.getAll() as IDBRequest<Habit[]>)
  return habits
    .filter((habit) => !habit.archived && isScheduledForDate(habit, date))
    .map((habit) => habit.id)
}

async function completedHabitIdsFor(store: IDBObjectStore, dateKey: string): Promise<string[]> {
  const completions = await requestToPromise(
    store.index('date').getAll(dateKey) as IDBRequest<Completion[]>
  )
  return completions.map((completion) => completion.habitId)
}

function fullDayReached(scheduledIds: string[], completedIds: string[]): boolean {
  if (scheduledIds.length === 0) return false
  const completed = new Set(completedIds)
  return scheduledIds.every((habitId) => completed.has(habitId))
}

async function loadOrCreatePet(store: IDBObjectStore, now: number): Promise<Pet> {
  const existing = await requestToPromise(store.get('pet') as IDBRequest<Pet | undefined>)
  return existing ?? createDefaultPet(now)
}

function refreshedPet(pet: Pet, treatsDelta: number, now: number): Pet {
  return {
    ...pet,
    treats: Math.max(0, pet.treats + treatsDelta),
    hunger: hungerAt(pet.hunger, pet.lastHungerAt, now),
    lastHungerAt: now,
  }
}

export async function applyCompletion(completion: Completion): Promise<Pet> {
  const db = await openDatabase()
  const transaction = db.transaction(['completions', 'habits', 'pet'], 'readwrite')
  const completionsStore = transaction.objectStore('completions')
  const habitsStore = transaction.objectStore('habits')
  const petStore = transaction.objectStore('pet')
  const now = Date.now()

  await requestToPromise(completionsStore.add(completion))

  const date = parseDateKey(completion.date)
  const scheduledIds = await scheduledHabitIdsFor(habitsStore, date)
  const completedIds = await completedHabitIdsFor(completionsStore, completion.date)
  const bonus = fullDayReached(scheduledIds, completedIds) ? FULL_DAY_BONUS_TREATS : 0

  const pet = await loadOrCreatePet(petStore, now)
  const updated = refreshedPet(pet, TREATS_PER_COMPLETION + bonus, now)

  await Promise.all([requestToPromise(petStore.put(updated)), transactionDone(transaction)])
  return updated
}

export async function revertCompletion(habitId: string, dateKey: string): Promise<Pet> {
  const db = await openDatabase()
  const transaction = db.transaction(['completions', 'habits', 'pet'], 'readwrite')
  const completionsStore = transaction.objectStore('completions')
  const habitsStore = transaction.objectStore('habits')
  const petStore = transaction.objectStore('pet')
  const now = Date.now()

  const date = parseDateKey(dateKey)
  const scheduledIds = await scheduledHabitIdsFor(habitsStore, date)
  const completedBefore = await completedHabitIdsFor(completionsStore, dateKey)

  const existing = await requestToPromise(
    completionsStore.index('habitId_date').get([habitId, dateKey]) as IDBRequest<
      Completion | undefined
    >
  )

  let treatsDelta = 0
  if (existing) {
    await requestToPromise(completionsStore.delete(existing.id))
    treatsDelta -= TREATS_PER_COMPLETION
  }

  const completedAfter = completedBefore.filter((id) => id !== habitId)
  const wasFull = fullDayReached(scheduledIds, completedBefore)
  const isFull = fullDayReached(scheduledIds, completedAfter)
  if (wasFull && !isFull) {
    treatsDelta -= FULL_DAY_BONUS_TREATS
  }

  const pet = await loadOrCreatePet(petStore, now)
  const updated = refreshedPet(pet, treatsDelta, now)

  await Promise.all([requestToPromise(petStore.put(updated)), transactionDone(transaction)])
  return updated
}
