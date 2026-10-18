import type { Pet } from '../types/models'
import { adoptPet, feedPet, getPet as loadPetFromDb } from '../data/petRepository'
import {
  canFeed,
  hungerAt,
  moodForHunger,
  stageForXp,
  stageProgress,
  type FeedCheck,
  type PetMood,
  type PetStage,
  type StageProgress,
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

export function getTreats(): number {
  return pet?.treats ?? 0
}

export function getHunger(now: number = Date.now()): number {
  if (!pet) return 100
  return hungerAt(pet.hunger, pet.lastHungerAt, now)
}

export function getMood(): PetMood {
  return moodForHunger(getHunger())
}

export function getStage(): PetStage {
  return stageForXp(getXp())
}

export function getProgress(): StageProgress {
  return stageProgress(getXp())
}

export function getFeedCheck(): FeedCheck {
  if (!pet) return { ok: false, reason: 'Adopt a pet first.' }
  return canFeed(pet, Date.now())
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

export async function feed(): Promise<void> {
  const { pet: fed } = await feedPet()
  pet = fed
}
