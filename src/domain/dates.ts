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
