import { getLocalDateKey } from '../domain/dates'
import { isScheduledForDate } from '../domain/habits'
import { isCompleted } from '../stores/completions.svelte'
import { getHabits } from '../stores/habits.svelte'
import { pushToast } from '../stores/toasts.svelte'

const STORAGE_KEY = 'streakpet:reminded'
const CHECK_INTERVAL_MS = 30_000
const STALE_AFTER_MINUTES = 180

function loadReminded(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, string>) : {}
  } catch {
    return {}
  }
}

function saveReminded(reminded: Record<string, string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reminded))
  } catch {
    // Reminder de-duplication is best effort.
  }
}

function fireReminder(habitName: string): void {
  pushToast('Reminder', `It's time for "${habitName}".`)
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
  try {
    new Notification('StreakPet reminder', { body: `It's time for "${habitName}".` })
  } catch {
    // Some browsers require a service worker for notifications.
  }
}

let stopWatch: (() => void) | null = null

export function startReminderWatch(): () => void {
  if (stopWatch) return stopWatch

  const reminded = loadReminded()

  function check() {
    const now = new Date()
    const todayKey = getLocalDateKey(now)
    const minutesNow = now.getHours() * 60 + now.getMinutes()

    for (const habit of getHabits()) {
      if (habit.archived || !habit.reminder) continue
      if (!isScheduledForDate(habit, now)) continue
      if (isCompleted(habit.id, todayKey)) continue
      if (reminded[habit.id] === todayKey) continue

      const [hoursText, minutesText] = habit.reminder.time.split(':')
      const dueMinutes = Number(hoursText) * 60 + Number(minutesText)
      if (minutesNow < dueMinutes) continue
      if (minutesNow > dueMinutes + STALE_AFTER_MINUTES) continue

      reminded[habit.id] = todayKey
      saveReminded(reminded)
      fireReminder(habit.name)
    }
  }

  check()
  const interval = window.setInterval(check, CHECK_INTERVAL_MS)
  stopWatch = () => {
    window.clearInterval(interval)
    stopWatch = null
  }
  return stopWatch
}
