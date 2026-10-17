import type { Reward } from '../types/models'
import { listRewards } from '../data/rewardRepository'
import { stageForXp, totalXpFromRewards, type PetStage } from '../domain/pet'

let rewards = $state<Reward[]>([])
let loading = $state(true)
let loadError = $state<string | null>(null)
let loaded = $state(false)

function toError(error: unknown, fallback: string): Error {
  return error instanceof Error ? error : new Error(fallback)
}

export function isLoading(): boolean {
  return loading
}

export function getLoadError(): string | null {
  return loadError
}

export function getTotalXp(): number {
  return totalXpFromRewards(rewards)
}

export function getStage(): PetStage {
  return stageForXp(getTotalXp())
}

export function setRewards(next: Reward[]): void {
  rewards = next
}

export async function loadRewards(force = false): Promise<void> {
  if (loaded && !force) return
  loading = true
  loadError = null
  try {
    rewards = await listRewards()
    loaded = true
  } catch (error) {
    loadError = toError(error, 'Could not load pet progress.').message
  } finally {
    loading = false
  }
}
