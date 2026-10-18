import { describe, expect, it } from 'vitest'
import type { BackupData } from './backup'
import { BACKUP_APP, BACKUP_VERSION, parseBackup, serializeBackup } from './backup'

function makeBackup(): BackupData {
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: '2026-10-18T10:00:00.000Z',
    habits: [
      {
        id: 'h1',
        name: 'Read',
        icon: '📚',
        color: '#F25C1F',
        note: 'Twenty pages',
        scheduledDays: [1, 2, 3, 4, 5],
        reminder: { time: '20:00', days: [1, 2, 3, 4, 5] },
        createdAt: 100,
        updatedAt: 200,
        archived: false,
      },
      {
        id: 'h2',
        name: 'Stretch',
        icon: '🧘',
        color: '#4CC38A',
        scheduledDays: [0, 1, 2, 3, 4, 5, 6],
        createdAt: 100,
        updatedAt: 100,
        archived: true,
        archivedAt: 300,
      },
    ],
    completions: [{ id: 'c1', habitId: 'h1', date: '2026-10-17', completedAt: 500 }],
    pet: {
      id: 'pet',
      species: 'fox',
      name: 'Rusty',
      xp: 120,
      treats: 3,
      hunger: 72.5,
      lastHungerAt: 900,
      createdAt: 400,
    },
    feedings: [{ id: 'f1', at: 600, xp: 10, hungerBefore: 52, hungerAfter: 72 }],
  }
}

describe('backup serialization', () => {
  it('round-trips a full backup', () => {
    const original = makeBackup()
    const parsed = parseBackup(serializeBackup(original))
    expect(parsed).toEqual(original)
  })

  it('round-trips a backup without a pet or feedings', () => {
    const original: BackupData = {
      ...makeBackup(),
      pet: null,
      feedings: [],
    }
    const parsed = parseBackup(serializeBackup(original))
    expect(parsed.pet).toBeNull()
    expect(parsed.feedings).toEqual([])
  })
})

describe('backup validation', () => {
  it('rejects invalid JSON', () => {
    expect(() => parseBackup('{oops')).toThrowError(/not valid JSON/)
  })

  it('rejects files from other apps', () => {
    expect(() => parseBackup(JSON.stringify({ app: 'other', version: 1 }))).toThrowError(
      /not a StreakPet backup/
    )
  })

  it('rejects other backup versions', () => {
    expect(() => parseBackup(JSON.stringify({ app: BACKUP_APP, version: 99 }))).toThrowError(
      /different version/
    )
  })

  it('rejects missing data sections', () => {
    expect(() =>
      parseBackup(JSON.stringify({ app: BACKUP_APP, version: 1, habits: [] }))
    ).toThrowError(/missing habit or completion data/)
  })

  it('rejects habits with invalid schedules', () => {
    const data = makeBackup() as unknown as Record<string, unknown>
    const habits = data.habits as Array<Record<string, unknown>>
    habits[0].scheduledDays = [1, 9]
    expect(() => parseBackup(JSON.stringify(data))).toThrowError(/invalid schedule/)
  })

  it('rejects completions with invalid dates', () => {
    const data = makeBackup() as unknown as Record<string, unknown>
    const completions = data.completions as Array<Record<string, unknown>>
    completions[0].date = 'yesterday'
    expect(() => parseBackup(JSON.stringify(data))).toThrowError(/invalid date/)
  })

  it('rejects pets with unknown species', () => {
    const data = makeBackup() as unknown as Record<string, unknown>
    const pet = data.pet as Record<string, unknown>
    pet.species = 'dragon'
    expect(() => parseBackup(JSON.stringify(data))).toThrowError(/unknown species/)
  })

  it('fills defaults for missing optional habit fields', () => {
    const data = makeBackup() as unknown as Record<string, unknown>
    const habits = data.habits as Array<Record<string, unknown>>
    delete habits[0].icon
    delete habits[0].color
    const parsed = parseBackup(JSON.stringify(data))
    expect(parsed.habits[0].icon).toBe('🎯')
    expect(parsed.habits[0].color).toBe('#F25C1F')
  })

  it('tolerates backups without a feedings array', () => {
    const data = makeBackup() as unknown as Record<string, unknown>
    delete data.feedings
    const parsed = parseBackup(JSON.stringify(data))
    expect(parsed.feedings).toEqual([])
  })
})
