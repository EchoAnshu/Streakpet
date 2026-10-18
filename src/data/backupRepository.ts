import { openDatabase, requestToPromise, transactionDone } from './db'
import { listCompletions } from './completionRepository'
import { listHabits } from './habitRepository'
import { listFeedings } from './petRepository'
import type { BackupData } from '../domain/backup'
import { BACKUP_APP, BACKUP_VERSION } from '../domain/backup'
import type { Pet } from '../types/models'

async function readPet(): Promise<Pet | null> {
  const db = await openDatabase()
  const transaction = db.transaction('pet', 'readonly')
  const store = transaction.objectStore('pet')
  const [pet] = await Promise.all([
    requestToPromise(store.get('pet') as IDBRequest<Pet | undefined>),
    transactionDone(transaction),
  ])
  return pet ?? null
}

export async function exportBackup(): Promise<BackupData> {
  const [habits, completions, feedings, pet] = await Promise.all([
    listHabits(),
    listCompletions(),
    listFeedings(),
    readPet(),
  ])
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    habits,
    completions,
    pet,
    feedings,
  }
}

export async function importBackup(data: BackupData): Promise<void> {
  const db = await openDatabase()
  const transaction = db.transaction(['habits', 'completions', 'pet', 'feedings'], 'readwrite')
  const habitsStore = transaction.objectStore('habits')
  const completionsStore = transaction.objectStore('completions')
  const petStore = transaction.objectStore('pet')
  const feedingsStore = transaction.objectStore('feedings')

  habitsStore.clear()
  completionsStore.clear()
  petStore.clear()
  feedingsStore.clear()

  for (const habit of data.habits) habitsStore.put(habit)
  for (const completion of data.completions) completionsStore.put(completion)
  for (const feeding of data.feedings) feedingsStore.put(feeding)
  if (data.pet) petStore.put(data.pet)

  await transactionDone(transaction)
}
