import type { Pet, TreatLot } from '../types/models'
import {
  applyVanish,
  COOKIE_INVENTORY_MAX,
  createDefaultPet,
  isPetSpecies,
  reconcileSurvival,
} from '../domain/pet'
import { getLocalDateKey } from '../domain/dates'
import { openDatabase, requestToPromise, transactionDone } from './db'

type StoredPet = Pet & Record<string, unknown>

/** Old treat-based records migrate into the cookie model; decay fields die. */
function migratePet(raw: StoredPet, now: number): Pet {
  const legacyLots = Array.isArray(raw.treatLots) ? (raw.treatLots as TreatLot[]) : []
  const legacyTreats = typeof raw.treats === 'number' && raw.treats > 0 ? raw.treats : 0
  const alreadyMigrated =
    typeof raw.cookies === 'number' && typeof raw.activeDays === 'number' && typeof raw.petStatus === 'string'
  if (alreadyMigrated && !('treats' in raw)) return raw as unknown as Pet

  // Leftover treats become cookies; the shared cycle keeps the oldest earn date.
  const earnCandidates: number[] = [...legacyLots.map((lot) => lot.at), now]
  const migratedCookies =
    'treats' in raw
      ? Math.min(
          COOKIE_INVENTORY_MAX,
          Math.max(legacyTreats, legacyLots.reduce((sum, lot) => sum + lot.count, 0)),
        )
      : Math.max(0, alreadyMigrated ? (raw.cookies as number) : 0)

  const migrated: Pet = {
    id: 'pet',
    species: null,
    name: null,
    xp: typeof raw.xp === 'number' ? raw.xp : 0,
    createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : now,
    cookies: migratedCookies,
    currentStreak: 0,
    activeDays: 0,
    longestStreak: 0,
    petStatus: 'healthy',
  }
  if (speciesRaw(raw)) {
    migrated.species = raw.species as string
    migrated.name = (raw.name as string | null) ?? null
  }
  if (!alreadyMigrated || 'treats' in raw) {
    // Legacy treats inherit the oldest lot timestamp so the shared cycle
    // expires them promptly; a fresh record anchors its cycle at adoption.
    migrated.cookieEarnerAt = Math.min(...earnCandidates.filter((at) => Number.isFinite(at)))
    migrated.streakAnchorDate = getLocalDateKey(new Date())
  }
  return migrated
}

function speciesRaw(raw: Record<string, unknown>): boolean {
  return typeof raw.species === 'string' && isPetSpecies(raw.species)
}

/** Load the pet settled against the full completion record; releases dead pets. */
export async function getPet(): Promise<Pet> {
  const db = await openDatabase()
  const transaction = db.transaction(['pet', 'completions'], 'readwrite')
  const petStore = transaction.objectStore('pet')
  const completionsStore = transaction.objectStore('completions')

  const raw = await requestToPromise(petStore.get('pet') as IDBRequest<StoredPet | undefined>)
  const todayKey = getLocalDateKey(new Date())
  if (!raw) {
    const fresh = createDefaultPet(Date.now(), todayKey)
    await Promise.all([requestToPromise(petStore.put(fresh)), transactionDone(transaction)])
    return fresh
  }

  const pet = migratePet(raw, Date.now())
  const completions = await requestToPromise(
    completionsStore.getAll() as IDBRequest<{ date: string }[]>
  )
  const settled = settle(pet, completions, todayKey)
  await Promise.all([requestToPromise(petStore.put(settled.pet)), transactionDone(transaction)])
  return settled.pet
}

function settle(pet: Pet, completions: { date: string }[], todayKey: string): ReturnType<typeof reconcileSurvival> {
  const dates = new Set(completions.map((completion) => completion.date))
  const { pet: walked, vanished, vanishDate } = reconcileSurvival(pet, dates, todayKey)
  if (vanished) {
    return { pet: applyVanish(walked, todayKey, Date.now()), vanished, vanishDate }
  }
  return { pet: walked, vanished, vanishDate }
}

export interface AdoptOptions {
  /** Fresh streak life on adoption (the only supported flow). */
  freshStart?: boolean
}

export async function adoptPet(
  species: string,
  name: string | null,
  options: AdoptOptions = {},
): Promise<Pet> {
  const db = await openDatabase()
  const transaction = db.transaction('pet', 'readwrite')
  const petStore = transaction.objectStore('pet')
  const now = Date.now()
  const request = await requestToPromise(petStore.get('pet') as IDBRequest<StoredPet | undefined>)
  const todayKey = getLocalDateKey(new Date())
  const pet = request ? migratePet(request, now) : createDefaultPet(now, todayKey)
  const fresh = options.freshStart !== false

  const adopted: Pet = {
    ...pet,
    species,
    name: name?.trim() ? name.trim() : null,
    xp: fresh ? 0 : pet.xp,
    // A new streak life always starts counting today.
    ...(fresh
      ? {
          streakAnchorDate: todayKey,
          cookieSpendDates: [],
          cookieMilestoneDates: [],
        }
      : {}),
    petStatus: 'healthy',
  } as Pet
  delete (adopted as Partial<Pet>).lastRunAwayAt
  await Promise.all([requestToPromise(petStore.put(adopted)), transactionDone(transaction)])
  return adopted
}

/** Re-run settlement after the completion record changed. */
export async function settleAfterCompletionChange(): Promise<Pet> {
  const db = await openDatabase()
  const transaction = db.transaction(['pet', 'completions'], 'readwrite')
  const petStore = transaction.objectStore('pet')
  const completionsStore = transaction.objectStore('completions')
  const now = Date.now()

  const raw = await requestToPromise(petStore.get('pet') as IDBRequest<StoredPet | undefined>)
  const pet = raw ? migratePet(raw, now) : createDefaultPet(now, getLocalDateKey(new Date()))
  const completions = await requestToPromise(
    completionsStore.getAll() as IDBRequest<{ date: string }[]>
  )
  const { pet: settled } = settle(pet, completions, getLocalDateKey(new Date()))
  await Promise.all([requestToPromise(petStore.put(settled)), transactionDone(transaction)])
  return settled
}
