import type { Completion } from '../types/models'
import { openDatabase, requestToPromise, transactionDone } from './db'

export async function addCompletion(completion: Completion): Promise<void> {
  const db = await openDatabase()
  const transaction = db.transaction('completions', 'readwrite')
  const store = transaction.objectStore('completions')
  await Promise.all([requestToPromise(store.add(completion)), transactionDone(transaction)])
}

export async function deleteCompletion(id: string): Promise<void> {
  const db = await openDatabase()
  const transaction = db.transaction('completions', 'readwrite')
  const store = transaction.objectStore('completions')
  await Promise.all([requestToPromise(store.delete(id)), transactionDone(transaction)])
}

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
