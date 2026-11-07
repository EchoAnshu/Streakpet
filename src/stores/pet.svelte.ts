import type { Pet, PetStatus } from '../types/models'
import { adoptPet, getPet as loadPetFromDb } from '../data/petRepository'
import {
  cookieExpiryDate,
  moodForStatus,
  MOOD_LABELS,
  petAgeInDays,
  stageForXp,
  stageProgress,
  STAGE_LABELS,
  STATUS_LABELS,
} from '../domain/pet'

let pet = $state<Pet | null>(null)
let loading = $state(true)
let loadError = $state<string | null>(null)
let loaded = $state(false)

function toError(error: unknown, fallback: string): Error {
  return error instanceof Error ? error : new Error(fallback)
}

export function getPet(): Pet | null {
  return pet
}

export function isLoading(): boolean {
  return loading
}

export function getLoadError(): string | null {
  return loadError
}

export function setPet(next: Pet): void {
  pet = next
}

export function hasAdopted(): boolean {
  return Boolean(pet?.species)
}

export function getSpecies(): string | null {
  return pet?.species ?? null
}

export function getPetName(): string | null {
  return pet?.name ?? null
}

export function getXp(): number {
  return pet?.xp ?? 0
}

export function getCookies(): number {
  return pet?.cookies ?? 0
}

export function getCookieExpiry(): number | null {
  return pet ? cookieExpiryDate(pet) : null
}

export function getCurrentStreak(): number {
  return pet?.currentStreak ?? 0
}

export function getActiveDays(): number {
  return pet?.activeDays ?? 0
}

export function getLongestStreak(): number {
  return pet?.longestStreak ?? 0
}

export function getPetStatus(): PetStatus {
  return pet?.petStatus ?? 'healthy'
}

export function getStatusLabel(): string {
  return STATUS_LABELS[getPetStatus()]
}

export function getMoodLabel(): string {
  return MOOD_LABELS[moodForStatus(getPetStatus())]
}

export function getRunAwayNote(): string | null {
  if (!pet || pet.species) return null
  return typeof pet.lastRunAwayAt === 'number'
    ? 'Your pet ran away and the streak broke. Finish habits to start a new run!'
    : null
}

export function getCreatedAt(): number | null {
  return pet?.createdAt ?? null
}

export function getStageLabel(): string {
  return STAGE_LABELS[stageForXp(getXp())]
}

export function getAgeInDays(nowTick: number): number {
  const createdAt = pet?.createdAt
  return createdAt === undefined ? 0 : petAgeInDays(createdAt, nowTick)
}

export function getProgress():
  | ReturnType<typeof stageProgress>
  | undefined {
  return stageProgress(getXp())
}

export async function loadPet(force = false): Promise<void> {
  if (loaded && !force) return
  loading = true
  loadError = null
  try {
    pet = await loadPetFromDb()
    loaded = true
  } catch (error) {
    loadError = toError(error, 'Could not load your pet.').message
  } finally {
    loading = false
  }
}

export async function adopt(species: string, name: string | null): Promise<void> {
  pet = await adoptPet(species, name)
}

export async function switchPet(species: string, name: string | null): Promise<void> {
  pet = await adoptPet(species, name, { freshStart: true })
}
