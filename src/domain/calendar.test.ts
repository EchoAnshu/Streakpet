import { describe, expect, it } from 'vitest'
import {
  MONTH_GRID_CELLS,
  buildActivityMonthLabels,
  buildActivityWeeks,
  buildMonthGrid,
} from './calendar'
import { getWeekdayIndex } from './dates'

describe('buildMonthGrid', () => {
  it('builds a Monday-first 6-week grid covering October 2026', () => {
    const cells = buildMonthGrid(2026, 9)
    expect(cells).toHaveLength(MONTH_GRID_CELLS)
    expect(cells[0].key).toBe('2026-09-28')
    expect(getWeekdayIndex(cells[0].date)).toBe(1)
    expect(cells[0].inMonth).toBe(false)

    const firstOfMonth = cells.find((cell) => cell.key === '2026-10-01')
    expect(firstOfMonth?.inMonth).toBe(true)

    const inMonth = cells.filter((cell) => cell.inMonth)
    expect(inMonth).toHaveLength(31)
    expect(inMonth[0].key).toBe('2026-10-01')
    expect(inMonth[30].key).toBe('2026-10-31')
  })

  it('handles months that start on a Monday', () => {
    const cells = buildMonthGrid(2026, 5)
    expect(cells[0].key).toBe('2026-06-01')
    expect(cells[0].inMonth).toBe(true)
    expect(cells.filter((cell) => cell.inMonth)).toHaveLength(30)
  })

  it('handles February without a leap day', () => {
    const cells = buildMonthGrid(2027, 1)
    expect(cells.filter((cell) => cell.inMonth)).toHaveLength(28)
  })

  it('has contiguous days across the boundaries', () => {
    const cells = buildMonthGrid(2026, 9)
    for (let index = 1; index < cells.length; index += 1) {
      const previous = cells[index - 1].date
      const current = cells[index].date
      const diff = current.getTime() - previous.getTime()
      expect(diff).toBe(24 * 60 * 60 * 1000)
    }
  })
})

describe('buildActivityWeeks', () => {
  it('covers whole weeks from the Monday before January 1st to the Sunday after December 31st', () => {
    const weeks = buildActivityWeeks(2026)
    expect(weeks).toHaveLength(53)
    expect(weeks[0].key).toBe('2025-12-29')
    expect(weeks[0].cells[0].key).toBe('2025-12-29')
    expect(weeks[0].cells[3].key).toBe('2026-01-01')
    expect(getWeekdayIndex(weeks[0].cells[0].date)).toBe(1)

    const lastWeek = weeks[52]
    expect(lastWeek.cells[3].date.getFullYear()).toBe(2026)
    expect(new Date(lastWeek.cells[6].date).getTime() - new Date(lastWeek.cells[0].date).getTime()).toBe(
      6 * 24 * 60 * 60 * 1000
    )
  })

  it('keeps every week at exactly seven days', () => {
    const weeks = buildActivityWeeks(2026)
    for (const week of weeks) {
      expect(week.cells).toHaveLength(7)
    }
  })
})

describe('buildActivityMonthLabels', () => {
  it('groups weeks into month labels that cover the whole grid', () => {
    const weeks = buildActivityWeeks(2026)
    const labels = buildActivityMonthLabels(weeks)
    expect(labels.length).toBeGreaterThanOrEqual(12)
    const totalSpan = labels.reduce((sum, label) => sum + label.span, 0)
    expect(totalSpan).toBe(weeks.length)
    for (const label of labels) {
      expect(label.label.length).toBeGreaterThan(1)
      expect(label.span).toBeGreaterThan(0)
    }
  })
})
