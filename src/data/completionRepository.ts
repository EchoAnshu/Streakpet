import type { Completion, Pet } from '../types/models'
import { openDatabase, requestToPromise, transactionDone } from './db'
import { settleAfterCompletionChange } from './petRepository'
import { XP_PER_COMPLETION } from '../domain/pet'

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

function withXpDelta(pet: Pet, delta: number): Pet {
  return { ...pet, xp: Math.max(0, pet.xp + delta * XP_PER_COMPLETION) }
}

export async function applyCompletion(completion: Completion): Promise<Pet> {
  const db = await openDatabase()
  const transaction = db.transaction(['completions', 'pet'], 'readwrite')
  const completionsStore = transaction.objectStore('completions')
  const petStore = transaction.objectStore('pet')
  const now = Date.now()

  await requestToPromise(completionsStore.add(completion))
  const raw = await requestToPromise(petStore.get('pet') as IDBRequest<Pet | undefined>)
  if (raw) {
    const pet = withXpDelta(raw, 1)
    await requestToPromise(petStore.put(pet))
  }
  await transactionDone(transaction)
  return settleAfterCompletionChange()
}

export async function revertCompletion(habitId: string, dateKey: string): Promise<Pet> {
  const db = await openDatabase()
  const transaction = db.transaction(['completions', 'pet'], 'readwrite')
  const completionsStore = transaction.objectStore('completions')
  const petStore = transaction.objectStore('pet')
  const now = Date.now()

  const existing = await requestToPromise(
    completionsStore.index('habitId_date').get([habitId, dateKey]) as IDBRequest<
      Completion | undefined
    >
  )

  let xpDelta = 0
  if (existing) {
    await requestToPromise(completionsStore.delete(existing.id))
    xpDelta -= 1
  }

  const raw = await requestToPromise(petStore.get('pet') as IDBRequest<Pet | undefined>)
  if (raw) {
    const pet = withXpDelta(raw, xpDelta)
    await requestToPromise(petStore.put(pet))
  }
  await transactionDone(transaction)
  return settleAfterCompletionChange()
}
