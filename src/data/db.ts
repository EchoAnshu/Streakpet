const DB_NAME = 'streakpet-db'
const DB_VERSION = 1

let dbPromise: Promise<IDBDatabase> | null = null

export function openDatabase(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB is not available in this browser.'))
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result

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

export function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Database request failed.'))
  })
}

export function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error('Database transaction failed.'))
    transaction.onabort = () => reject(transaction.error ?? new Error('Database transaction aborted.'))
  })
}
