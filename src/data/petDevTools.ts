// Dev-only: read and write raw records without settlement so demo helpers can
// age clocks and seed history precisely.
import type { Completion, Pet } from '../types/models'
import { openDatabase, requestToPromise, transactionDone } from './db'

export async function putPetRaw(pet: Pet): Promise<void> {
  const db = await openDatabase()
  const transaction = db.transaction('pet', 'readwrite')
  await requestToPromise(transaction.objectStore('pet').put(pet))
  await transactionDone(transaction)
}

export async function getPetRaw(): Promise<Pet | null> {
  const db = await openDatabase()
  const transaction = db.transaction('pet', 'readonly')
  const [pet] = await Promise.all([
    requestToPromise(transaction.objectStore('pet').get('pet') as IDBRequest<Pet | undefined>),
    transactionDone(transaction),
  ])
  return pet ?? null
}

export async function putCompletionsRaw(completions: Completion[]): Promise<void> {
  const db = await openDatabase()
  const transaction = db.transaction('completions', 'readwrite')
  const store = transaction.objectStore('completions')
  for (const completion of completions) store.put(completion)
  await transactionDone(transaction)
}

export async function clearCompletionsRaw(): Promise<void> {
  const db = await openDatabase()
  const transaction = db.transaction('completions', 'readwrite')
  await requestToPromise(transaction.objectStore('completions').clear())
  await transactionDone(transaction)
}
