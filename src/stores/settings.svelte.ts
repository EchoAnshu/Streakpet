import {
  THEME_COLORS,
  isThemePreference,
  resolveTheme,
  type ThemePreference,
} from '../domain/theme'

const MUTED_STORAGE_KEY = 'streakpet:muted'
const THEME_STORAGE_KEY = 'streakpet:theme'

function readMuted(): boolean {
  try {
    return localStorage.getItem(MUTED_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function readTheme(): ThemePreference {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY)
    return raw && isThemePreference(raw) ? raw : 'system'
  } catch {
    return 'system'
  }
}

let muted = $state(readMuted())
let theme = $state<ThemePreference>(readTheme())

export function getMuted(): boolean {
  return muted
}

export function setMuted(value: boolean): void {
  muted = value
  try {
    localStorage.setItem(MUTED_STORAGE_KEY, value ? '1' : '0')
  } catch {
    // Persisting the preference is best effort.
  }
}

export function getTheme(): ThemePreference {
  return theme
}

function systemPrefersDark(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )
}

function applyTheme(): void {
  if (typeof document === 'undefined') return
  const resolved = resolveTheme(theme, systemPrefersDark())
  document.documentElement.dataset.theme = resolved
  const meta = document.querySelector('meta[name="theme-color"]')
  meta?.setAttribute('content', THEME_COLORS[resolved])
}

export function setTheme(next: ThemePreference): void {
  theme = next
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next)
  } catch {
    // Persisting the preference is best effort.
  }
  applyTheme()
}

let listening = false

export function initTheme(): void {
  applyTheme()
  if (listening || typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return
  }
  listening = true
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (theme === 'system') applyTheme()
  })
}
