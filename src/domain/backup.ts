import type { Completion, Feeding, Habit, Pet } from '../types/models'
import { isPetSpecies } from './pet'

export const BACKUP_APP = 'streakpet'
export const BACKUP_VERSION = 1

export interface BackupData {
  app: typeof BACKUP_APP
  version: number
  exportedAt: string
  habits: Habit[]
  completions: Completion[]
  pet: Pet | null
  feedings: Feeding[]
}

function fail(message: string): never {
  throw new Error(message)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isValidDays(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    value.every((day) => Number.isInteger(day) && Number(day) >= 0 && Number(day) <= 6)
  )
}

function isValidReminder(value: unknown): boolean {
  if (!isRecord(value)) return false
  return isString(value.time) && /^\d{2}:\d{2}$/.test(value.time) && isValidDays(value.days)
}

function parseHabit(value: unknown, index: number): Habit {
  if (!isRecord(value)) return fail(`Habit ${index + 1} in the backup is not valid.`)
  if (!isString(value.id) || value.id.length === 0) {
    fail(`Habit ${index + 1} in the backup is missing its id.`)
  }
  if (!isString(value.name)) fail(`Habit ${index + 1} in the backup is missing its name.`)
  if (!isValidDays(value.scheduledDays)) {
    fail(`Habit ${index + 1} in the backup has an invalid schedule.`)
  }
  if (!isNumber(value.createdAt) || !isNumber(value.updatedAt)) {
    fail(`Habit ${index + 1} in the backup has invalid timestamps.`)
  }
  if (value.reminder !== undefined && !isValidReminder(value.reminder)) {
    fail(`Habit ${index + 1} in the backup has an invalid reminder.`)
  }

  const habit: Habit = {
    id: value.id as string,
    name: value.name as string,
    icon: isString(value.icon) && value.icon.length > 0 ? value.icon : '🎯',
    color: isString(value.color) && /^#[0-9a-fA-F]{6}$/.test(value.color) ? value.color : '#F25C1F',
    scheduledDays: value.scheduledDays as number[],
    createdAt: value.createdAt as number,
    updatedAt: value.updatedAt as number,
    archived: value.archived === true,
  }
  if (isString(value.note)) habit.note = value.note
  if (value.reminder !== undefined) habit.reminder = value.reminder as Habit['reminder']
  if (isNumber(value.archivedAt)) habit.archivedAt = value.archivedAt
  return habit
}

function parseCompletion(value: unknown, index: number): Completion {
  if (!isRecord(value)) return fail(`Completion ${index + 1} in the backup is not valid.`)
  if (!isString(value.id) || value.id.length === 0) {
    fail(`Completion ${index + 1} in the backup is missing its id.`)
  }
  if (!isString(value.habitId) || value.habitId.length === 0) {
    fail(`Completion ${index + 1} in the backup is missing its habit id.`)
  }
  if (!isString(value.date) || !/^\d{4}-\d{2}-\d{2}$/.test(value.date)) {
    fail(`Completion ${index + 1} in the backup has an invalid date.`)
  }
  if (!isNumber(value.completedAt)) {
    fail(`Completion ${index + 1} in the backup has an invalid timestamp.`)
  }
  return {
    id: value.id as string,
    habitId: value.habitId as string,
    date: value.date as string,
    completedAt: value.completedAt as number,
  }
}

function parseFeeding(value: unknown, index: number): Feeding {
  if (!isRecord(value)) return fail(`Feeding ${index + 1} in the backup is not valid.`)
  if (!isString(value.id) || value.id.length === 0) {
    fail(`Feeding ${index + 1} in the backup is missing its id.`)
  }
  if (!isNumber(value.at) || !isNumber(value.xp)) {
    fail(`Feeding ${index + 1} in the backup has invalid numbers.`)
  }
  return {
    id: value.id as string,
    at: value.at as number,
    xp: value.xp as number,
    hungerBefore: isNumber(value.hungerBefore) ? value.hungerBefore : 0,
    hungerAfter: isNumber(value.hungerAfter) ? value.hungerAfter : 0,
  }
}

function parsePet(value: unknown): Pet | null {
  if (value === null || value === undefined) return null
  if (!isRecord(value)) fail('The pet in the backup is not valid.')
  if (value.species !== null && !(isString(value.species) && isPetSpecies(value.species))) {
    fail('The pet in the backup has an unknown species.')
  }
  if (value.name !== null && !isString(value.name)) {
    fail('The pet in the backup has an invalid name.')
  }
  if (!isNumber(value.xp) || !isNumber(value.treats) || !isNumber(value.hunger)) {
    fail('The pet in the backup has invalid numbers.')
  }
  return {
    id: 'pet',
    species: value.species as string | null,
    name: value.name as string | null,
    xp: value.xp as number,
    treats: value.treats as number,
    hunger: value.hunger as number,
    lastHungerAt: isNumber(value.lastHungerAt) ? value.lastHungerAt : Date.now(),
    createdAt: isNumber(value.createdAt) ? value.createdAt : Date.now(),
  }
}

export function serializeBackup(data: BackupData): string {
  return JSON.stringify(data, null, 2)
}

export function parseBackup(text: string): BackupData {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    fail('That file is not valid JSON.')
  }
  if (!isRecord(raw)) fail('That file is not a StreakPet backup.')
  if (raw.app !== BACKUP_APP) fail('That file is not a StreakPet backup.')
  if (raw.version !== BACKUP_VERSION) {
    fail('That backup was made with a different version of StreakPet.')
  }
  if (!Array.isArray(raw.habits) || !Array.isArray(raw.completions)) {
    fail('The backup is missing habit or completion data.')
  }
  if (raw.feedings !== undefined && !Array.isArray(raw.feedings)) {
    fail('The backup has invalid feeding data.')
  }

  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: isString(raw.exportedAt) ? raw.exportedAt : new Date().toISOString(),
    habits: raw.habits.map(parseHabit),
    completions: raw.completions.map(parseCompletion),
    pet: parsePet(raw.pet),
    feedings: (raw.feedings ?? []).map(parseFeeding),
  }
}
