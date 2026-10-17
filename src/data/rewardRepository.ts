import type { Reward } from '../types/models'
import { openDatabase, requestToPromise, transactionDone } from './db'

export async function listRewards(): Promise<Reward[]> {
  const db = await openDatabase()
  const transaction = db.transaction('rewards', 'readonly')
  const store = transaction.objectStore('rewards')
  const [rewards] = await Promise.all([
    requestToPromise(store.getAll() as IDBRequest<Reward[]>),
    transactionDone(transaction),
  ])
  return rewards
}
