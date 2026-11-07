// Dev-only: write a pet record back without settlement so demo helpers can
// age its clocks precisely.
import type { Pet } from '../types/models'
import { openDatabase, requestToPromise, transactionDone } from './db'

export async function putPetRaw(pet: Pet): Promise<void> {
  const db = await openDatabase()
  const transaction = db.transaction('pet', 'readwrite')
  await requestToPromise(transaction.objectStore('pet').put(pet))
  await transactionDone(transaction)
}
