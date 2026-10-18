import { describe, expect, it } from 'vitest'
import {
  THEME_COLORS,
  THEME_LABELS,
  THEME_PREFERENCES,
  isThemePreference,
  resolveTheme,
} from './theme'

describe('theme domain', () => {
  it('resolves explicit preferences regardless of the system', () => {
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('light', false)).toBe('light')
    expect(resolveTheme('dark', true)).toBe('dark')
    expect(resolveTheme('dark', false)).toBe('dark')
  })

  it('follows the system preference when set to system', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
  })

  it('validates stored preferences', () => {
    expect(isThemePreference('light')).toBe(true)
    expect(isThemePreference('dark')).toBe(true)
    expect(isThemePreference('system')).toBe(true)
    expect(isThemePreference('sepia')).toBe(false)
    expect(isThemePreference('')).toBe(false)
  })

  it('defines labels and theme colors for every option', () => {
    for (const preference of THEME_PREFERENCES) {
      expect(THEME_LABELS[preference]).toBeTruthy()
    }
    expect(THEME_COLORS.light).toMatch(/^#[0-9a-f]{6}$/i)
    expect(THEME_COLORS.dark).toMatch(/^#[0-9a-f]{6}$/i)
  })
})
