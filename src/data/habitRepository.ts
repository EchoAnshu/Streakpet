import type { Habit } from '../types/models'
import { openDatabase, requestToPromise, transactionDone } from './db'

export async function listHabits(): Promise<Habit[]> {
  const db = await openDatabase()
  const transaction = db.transaction('habits', 'readonly')
  const store = transaction.objectStore('habits')
  const [habits] = await Promise.all([
    requestToPromise(store.getAll() as IDBRequest<Habit[]>),
    transactionDone(transaction),
  ])
  return habits
}

export async function saveHabit(habit: Habit): Promise<void> {
  const db = await openDatabase()
  const transaction = db.transaction('habits', 'readwrite')
  const store = transaction.objectStore('habits')
  await Promise.all([requestToPromise(store.put(habit)), transactionDone(transaction)])
}
