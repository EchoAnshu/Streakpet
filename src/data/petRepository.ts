import type { Feeding, Pet } from '../types/models'
import { applyFeed, canFeed, createDefaultPet } from '../domain/pet'
import { openDatabase, requestToPromise, transactionDone } from './db'

export async function getPet(): Promise<Pet> {
  const db = await openDatabase()
  const transaction = db.transaction('pet', 'readwrite')
  const store = transaction.objectStore('pet')
  const existing = await requestToPromise(store.get('pet') as IDBRequest<Pet | undefined>)
  if (existing) {
    await transactionDone(transaction)
    return existing
  }
  const pet = createDefaultPet(Date.now())
  await Promise.all([requestToPromise(store.put(pet)), transactionDone(transaction)])
  return pet
}

export async function adoptPet(species: string, name: string | null): Promise<Pet> {
  const db = await openDatabase()
  const transaction = db.transaction('pet', 'readwrite')
  const store = transaction.objectStore('pet')
  const existing = await requestToPromise(store.get('pet') as IDBRequest<Pet | undefined>)
  const pet = existing ?? createDefaultPet(Date.now())
  const adopted: Pet = {
    ...pet,
    species,
    name: name?.trim() ? name.trim() : null,
  }
  await Promise.all([requestToPromise(store.put(adopted)), transactionDone(transaction)])
  return adopted
}

export interface FeedOutcome {
  pet: Pet
  feeding: Feeding
}

export async function feedPet(): Promise<FeedOutcome> {
  const db = await openDatabase()
  const transaction = db.transaction(['pet', 'feedings'], 'readwrite')
  const petStore = transaction.objectStore('pet')
  const feedingsStore = transaction.objectStore('feedings')
  const now = Date.now()

  const existing = await requestToPromise(petStore.get('pet') as IDBRequest<Pet | undefined>)
  const pet = existing ?? createDefaultPet(now)

  const check = canFeed(pet, now)
  if (!check.ok) {
    transaction.abort()
    throw new Error(check.reason ?? 'Cannot feed right now.')
  }

  const { pet: fed, feeding } = applyFeed(pet, now, crypto.randomUUID())
  await Promise.all([
    requestToPromise(petStore.put(fed)),
    requestToPromise(feedingsStore.add(feeding)),
    transactionDone(transaction),
  ])
  return { pet: fed, feeding }
}

export async function listFeedings(): Promise<Feeding[]> {
  const db = await openDatabase()
  const transaction = db.transaction('feedings', 'readonly')
  const store = transaction.objectStore('feedings')
  const [feedings] = await Promise.all([
    requestToPromise(store.getAll() as IDBRequest<Feeding[]>),
    transactionDone(transaction),
  ])
  return feedings
}
