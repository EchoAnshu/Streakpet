import type { Feeding, Pet } from '../types/models'
import { applyFeed, canFeed, createDefaultPet, HUNGER_MAX } from '../domain/pet'
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

export interface AdoptOptions {
  freshStart?: boolean
}

export async function adoptPet(
  species: string,
  name: string | null,
  options: AdoptOptions = {}
): Promise<Pet> {
  const db = await openDatabase()
  const transaction = db.transaction('pet', 'readwrite')
  const store = transaction.objectStore('pet')
  const now = Date.now()
  const existing = await requestToPromise(store.get('pet') as IDBRequest<Pet | undefined>)
  const base = existing ?? createDefaultPet(now)
  const fresh = options.freshStart === true
  const adopted: Pet = {
    ...base,
    species,
    name: name?.trim() ? name.trim() : null,
    xp: fresh ? 0 : base.xp,
    treats: base.treats,
    hunger: fresh ? HUNGER_MAX : base.hunger,
    lastHungerAt: fresh ? now : base.lastHungerAt,
    createdAt: fresh ? now : base.createdAt,
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
