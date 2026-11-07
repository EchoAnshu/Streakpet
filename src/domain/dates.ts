export function getLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseDateKey(dateKey: string): Date {
  const parts = dateKey.split('-')
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
}

export function formatDisplayDate(date: Date = new Date()): string {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatDateKey(dateKey: string): string {
  return formatDisplayDate(parseDateKey(dateKey))
}

export function getWeekdayIndex(date: Date = new Date()): number {
  return date.getDay()
}

export function addDaysToKey(dateKey: string, days: number): string {
  const date = parseDateKey(dateKey)
  date.setDate(date.getDate() + days)
  return getLocalDateKey(date)
}

export function compareDateKeys(a: string, b: string): number {
  return Date.parse(`${a}T00:00:00`) - Date.parse(`${b}T00:00:00`)
}

/** Whole calendar days from a to b (b-a); DST shifts round to the true day count. */
export function daysBetweenKeys(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00`) - Date.parse(`${a}T00:00:00`)) / (24 * 60 * 60 * 1000))
}
