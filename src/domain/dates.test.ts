import { describe, expect, it } from 'vitest'
import { formatDateKey, getLocalDateKey, getWeekdayIndex, parseDateKey } from './dates'

describe('getLocalDateKey', () => {
  it('pads months and days', () => {
    expect(getLocalDateKey(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  it('keeps the local calendar day close to midnight', () => {
    expect(getLocalDateKey(new Date(2026, 9, 17, 23, 59, 59))).toBe('2026-10-17')
    expect(getLocalDateKey(new Date(2026, 9, 18, 0, 0, 1))).toBe('2026-10-18')
  })

  it('handles year boundaries', () => {
    expect(getLocalDateKey(new Date(2025, 11, 31, 23, 59))).toBe('2025-12-31')
    expect(getLocalDateKey(new Date(2026, 0, 1, 0, 0))).toBe('2026-01-01')
  })
})

describe('parseDateKey', () => {
  it('round-trips with getLocalDateKey', () => {
    for (const key of ['2026-01-01', '2026-10-17', '2025-12-31']) {
      expect(getLocalDateKey(parseDateKey(key))).toBe(key)
    }
  })

  it('preserves local calendar components', () => {
    const date = parseDateKey('2026-10-17')
    expect(date.getFullYear()).toBe(2026)
    expect(date.getMonth()).toBe(9)
    expect(date.getDate()).toBe(17)
  })
})

describe('getWeekdayIndex', () => {
  it('returns 0 for Sunday through 6 for Saturday', () => {
    expect(getWeekdayIndex(new Date(2026, 9, 18))).toBe(0)
    expect(getWeekdayIndex(new Date(2026, 9, 17))).toBe(6)
  })
})

describe('formatDateKey', () => {
  it('formats a key into a non-empty display string containing the year', () => {
    const label = formatDateKey('2026-10-17')
    expect(label.length).toBeGreaterThan(0)
    expect(label).toContain('2026')
  })
})
