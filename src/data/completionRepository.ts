import type { Completion, Habit, Reward } from '../types/models'
import { openDatabase, requestToPromise, transactionDone } from './db'
import { parseDateKey } from '../domain/dates'
import { isScheduledForDate } from '../domain/habits'
import {
  DAILY_BONUS_XP,
  HABIT_COMPLETION_XP,
  dailyBonusKey,
  habitRewardKey,
  isDailyBonusEarned,
} from '../domain/pet'

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

async function scheduledHabitIdsFor(store: IDBObjectStore, date: Date): Promise<string[]> {
  const habits = await requestToPromise(store.getAll() as IDBRequest<Habit[]>)
  return habits
    .filter((habit) => !habit.archived && isScheduledForDate(habit, date))
    .map((habit) => habit.id)
}

async function completedHabitIdsFor(store: IDBObjectStore, dateKey: string): Promise<string[]> {
  const completions = await requestToPromise(
    store.index('date').getAll(dateKey) as IDBRequest<Completion[]>
  )
  return completions.map((completion) => completion.habitId)
}

async function activateReward(store: IDBObjectStore, reward: Reward): Promise<void> {
  const existing = await requestToPromise(store.get(reward.id) as IDBRequest<Reward | undefined>)
  if (!existing) {
    await requestToPromise(store.add(reward))
  } else if (existing.reversed) {
    await requestToPromise(store.put({ ...existing, reversed: false, reversedAt: undefined }))
  }
}

async function reverseReward(store: IDBObjectStore, id: string, reversedAt: number): Promise<void> {
  const existing = await requestToPromise(store.get(id) as IDBRequest<Reward | undefined>)
  if (existing && !existing.reversed) {
    await requestToPromise(store.put({ ...existing, reversed: true, reversedAt }))
  }
}

export async function applyCompletion(completion: Completion): Promise<Reward[]> {
  const db = await openDatabase()
  const transaction = db.transaction(['completions', 'rewards', 'habits'], 'readwrite')
  const completionsStore = transaction.objectStore('completions')
  const rewardsStore = transaction.objectStore('rewards')
  const habitsStore = transaction.objectStore('habits')

  await Promise.all([
    requestToPromise(completionsStore.add(completion)),
    activateReward(rewardsStore, {
      id: habitRewardKey(completion.habitId, completion.date),
      type: 'habit_completion',
      date: completion.date,
      habitId: completion.habitId,
      xp: HABIT_COMPLETION_XP,
      reversed: false,
      createdAt: completion.completedAt,
    }),
  ])

  const date = parseDateKey(completion.date)
  const scheduledIds = await scheduledHabitIdsFor(habitsStore, date)
  const completedIds = await completedHabitIdsFor(completionsStore, completion.date)

  if (isDailyBonusEarned(scheduledIds, completedIds)) {
    await activateReward(rewardsStore, {
      id: dailyBonusKey(completion.date),
      type: 'daily_bonus',
      date: completion.date,
      xp: DAILY_BONUS_XP,
      reversed: false,
      createdAt: completion.completedAt,
    })
  }

  const [rewards] = await Promise.all([
    requestToPromise(rewardsStore.getAll() as IDBRequest<Reward[]>),
    transactionDone(transaction),
  ])
  return rewards
}

export async function recalculateDailyBonus(dateKey: string): Promise<Reward[]> {
  const db = await openDatabase()
  const transaction = db.transaction(['completions', 'rewards', 'habits'], 'readwrite')
  const completionsStore = transaction.objectStore('completions')
  const rewardsStore = transaction.objectStore('rewards')
  const habitsStore = transaction.objectStore('habits')

  const date = parseDateKey(dateKey)
  const scheduledIds = await scheduledHabitIdsFor(habitsStore, date)
  const completedIds = await completedHabitIdsFor(completionsStore, dateKey)
  const bonusId = dailyBonusKey(dateKey)

  if (isDailyBonusEarned(scheduledIds, completedIds)) {
    await activateReward(rewardsStore, {
      id: bonusId,
      type: 'daily_bonus',
      date: dateKey,
      xp: DAILY_BONUS_XP,
      reversed: false,
      createdAt: Date.now(),
    })
  } else {
    await reverseReward(rewardsStore, bonusId, Date.now())
  }

  const [rewards] = await Promise.all([
    requestToPromise(rewardsStore.getAll() as IDBRequest<Reward[]>),
    transactionDone(transaction),
  ])
  return rewards
}

export async function revertCompletion(habitId: string, dateKey: string): Promise<Reward[]> {
  const db = await openDatabase()
  const transaction = db.transaction(['completions', 'rewards', 'habits'], 'readwrite')
  const completionsStore = transaction.objectStore('completions')
  const rewardsStore = transaction.objectStore('rewards')
  const habitsStore = transaction.objectStore('habits')

  const existing = await requestToPromise(
    completionsStore.index('habitId_date').get([habitId, dateKey]) as IDBRequest<
      Completion | undefined
    >
  )
  if (existing) {
    await requestToPromise(completionsStore.delete(existing.id))
  }

  const now = Date.now()
  await reverseReward(rewardsStore, habitRewardKey(habitId, dateKey), now)

  const date = parseDateKey(dateKey)
  const scheduledIds = await scheduledHabitIdsFor(habitsStore, date)
  const completedIds = await completedHabitIdsFor(completionsStore, dateKey)

  if (!isDailyBonusEarned(scheduledIds, completedIds)) {
    await reverseReward(rewardsStore, dailyBonusKey(dateKey), now)
  }

  const [rewards] = await Promise.all([
    requestToPromise(rewardsStore.getAll() as IDBRequest<Reward[]>),
    transactionDone(transaction),
  ])
  return rewards
}
