import { getLocalDateKey } from './dates'

export interface MonthCell {
  date: Date
  key: string
  inMonth: boolean
}

export const MONTH_GRID_CELLS = 42

export function buildMonthGrid(year: number, month: number): MonthCell[] {
  const first = new Date(year, month, 1)
  const offset = (first.getDay() + 6) % 7
  const start = new Date(year, month, 1 - offset)
  const cells: MonthCell[] = []
  for (let index = 0; index < MONTH_GRID_CELLS; index += 1) {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index)
    cells.push({
      date,
      key: getLocalDateKey(date),
      inMonth: date.getMonth() === month && date.getFullYear() === year,
    })
  }
  return cells
}

export interface ActivityCell {
  date: Date
  key: string
}

export interface ActivityWeek {
  key: string
  cells: ActivityCell[]
}

export interface ActivityMonthLabel {
  label: string
  span: number
}

export function buildActivityWeeks(year: number): ActivityWeek[] {
  const first = new Date(year, 0, 1)
  const startOffset = (first.getDay() + 6) % 7
  const start = new Date(year, 0, 1 - startOffset)

  const last = new Date(year, 11, 31)
  const endOffset = 6 - ((last.getDay() + 6) % 7)
  const end = new Date(year, 11, 31 + endOffset)

  const weeks: ActivityWeek[] = []
  const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  while (cursor.getTime() <= end.getTime()) {
    const cells: ActivityCell[] = []
    for (let index = 0; index < 7; index += 1) {
      const date = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + index)
      cells.push({ date, key: getLocalDateKey(date) })
    }
    weeks.push({ key: getLocalDateKey(cursor), cells })
    cursor.setDate(cursor.getDate() + 7)
  }
  return weeks
}

export function buildActivityMonthLabels(weeks: ActivityWeek[]): ActivityMonthLabel[] {
  const labels: ActivityMonthLabel[] = []
  for (const week of weeks) {
    const thursday = week.cells[3].date
    const label = thursday.toLocaleDateString(undefined, { month: 'short' })
    const previous = labels[labels.length - 1]
    if (previous && previous.label === label) {
      previous.span += 1
    } else {
      labels.push({ label, span: 1 })
    }
  }
  return labels
}
