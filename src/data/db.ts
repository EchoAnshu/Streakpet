import { defaultColorFor, defaultIconFor } from '../domain/habits'

const DB_NAME = 'streakpet-db'
const DB_VERSION = 3

let dbPromise: Promise<IDBDatabase> | null = null

export function openDatabase(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available in this browser.'))
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = request.result
      const transaction = request.transaction
      if (!transaction) return

      if (!db.objectStoreNames.contains('habits')) {
        const habits = db.createObjectStore('habits', { keyPath: 'id' })
        habits.createIndex('archived', 'archived')
      }

      if (!db.objectStoreNames.contains('completions')) {
        const completions = db.createObjectStore('completions', { keyPath: 'id' })
        completions.createIndex('habitId', 'habitId')
        completions.createIndex('date', 'date')
        completions.createIndex('habitId_date', ['habitId', 'date'], { unique: true })
      }

      if (!db.objectStoreNames.contains('rewards')) {
        const rewards = db.createObjectStore('rewards', { keyPath: 'id' })
        rewards.createIndex('date', 'date')
        rewards.createIndex('habitId', 'habitId')
      }

      if (!db.objectStoreNames.contains('pet')) {
        db.createObjectStore('pet', { keyPath: 'id' })
      }

      if (!db.objectStoreNames.contains('feedings')) {
        const feedings = db.createObjectStore('feedings', { keyPath: 'id' })
        feedings.createIndex('at', 'at')
      }

      if (event.oldVersion < 3) {
        migrateToVersion3(transaction)
      }
    }

    request.onsuccess = () => {
      const db = request.result
      db.onversionchange = () => {
        db.close()
        dbPromise = null
      }
      resolve(db)
    }

    request.onerror = () => {
      reject(request.error ?? new Error('Could not open the local database.'))
    }

    request.onblocked = () => {
      reject(new Error('The database is blocked by another open tab.'))
    }
  })

  return dbPromise
}

function migrateToVersion3(transaction: IDBTransaction): void {
  const habitsStore = transaction.objectStore('habits')
  const rewardsStore = transaction.objectStore('rewards')
  const petStore = transaction.objectStore('pet')

  let habitsDone = false
  let rewardsDone = false
  let legacyXp = 0

  const maybeWritePet = () => {
    if (!habitsDone || !rewardsDone) return
    const getRequest = petStore.get('pet')
    getRequest.onsuccess = () => {
      if (getRequest.result) return
      const now = Date.now()
      petStore.put({
        id: 'pet',
        species: null,
        name: null,
        xp: legacyXp,
        treats: 0,
        hunger: 100,
        lastHungerAt: now,
        createdAt: now,
      })
    }
  }

  let habitIndex = 0
  const habitCursor = habitsStore.openCursor()
  habitCursor.onsuccess = () => {
    const cursor = habitCursor.result
    if (cursor) {
      const habit = cursor.value
      const updated = { ...habit }
      if (typeof updated.icon !== 'string' || updated.icon.length === 0) {
        updated.icon = defaultIconFor(habitIndex)
      }
      if (typeof updated.color !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(updated.color)) {
        updated.color = defaultColorFor(habitIndex)
      }
      if (typeof updated.note !== 'string' && typeof updated.description === 'string') {
        updated.note = updated.description
      }
      delete updated.description
      cursor.update(updated)
      habitIndex += 1
      cursor.continue()
    } else {
      habitsDone = true
      maybeWritePet()
    }
  }

  const rewardCursor = rewardsStore.openCursor()
  rewardCursor.onsuccess = () => {
    const cursor = rewardCursor.result
    if (cursor) {
      const reward = cursor.value
      if (!reward.reversed && typeof reward.xp === 'number') {
        legacyXp += reward.xp
      }
      cursor.continue()
    } else {
      rewardsDone = true
      maybeWritePet()
    }
  }
}

export async function closeDatabase(): Promise<void> {
  if (!dbPromise) return
  try {
    const db = await dbPromise
    db.close()
  } catch {
    // The connection never opened; nothing to close.
  }
  dbPromise = null
}

export function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Database request failed.'))
  })
}

export function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () =>
      reject(transaction.error ?? new Error('Database transaction failed.'))
    transaction.onabort = () => reject(transaction.error ?? new Error('Database transaction aborted.'))
  })
}
