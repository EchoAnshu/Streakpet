<script lang="ts">
  import { onMount } from 'svelte'
  import PetSprite from './PetSprite.svelte'
  import {
    SPECIES_LABELS,
    STATUS_LABELS,
    isPetSpecies,
    moodForStatus,
    petAgeInDays,
    stageForXp,
    type PetSpecies,
  } from '../domain/pet'
  import { petMoodOverride } from '../lib/petMoodOverride'
  import * as petStore from '../stores/pet.svelte'

  interface Props {
    onOpenPet: () => void
  }

  let { onOpenPet }: Props = $props()

  let adopted = $derived(petStore.hasAdopted())
  let species = $derived.by<PetSpecies | null>(() => {
    const value = petStore.getSpecies()
    return value && isPetSpecies(value) ? value : null
  })
  let petName = $derived(petStore.getPetName())
  let stage = $derived(stageForXp(petStore.getXp()))
  let spriteSize = $derived(stage === 'baby' ? 72 : stage === 'teen' ? 80 : 88)
  let cookies = $derived(petStore.getCookies())
  let currentStreak = $derived(petStore.getCurrentStreak())
  let status = $derived(petStore.getPetStatus())
  let mood = $derived(petMoodOverride() ?? moodForStatus(status))

  let nowTick = $state(Date.now())
  let createdAt = $derived(petStore.getCreatedAt())
  let ageInDays = $derived(createdAt === null ? 0 : petAgeInDays(createdAt, nowTick))

  onMount(() => {
    const interval = window.setInterval(() => (nowTick = Date.now()), 60_000)
    return () => window.clearInterval(interval)
  })
</script>

{#if adopted && species}
  <div class="pet-companion card">
    <button type="button" class="pet-companion__open" onclick={onOpenPet}>
      <span class="pet-companion__sprite">
        <PetSprite {species} size={spriteSize} idle {mood} {stage} />
      </span>
      <span class="pet-companion__body">
        <span class="pet-companion__name">{petName ?? SPECIES_LABELS[species]}</span>
        <span class="pet-companion__meta">
          {currentStreak}-day streak · {STATUS_LABELS[status]} · {ageInDays}
          {ageInDays === 1 ? 'day' : 'days'} old · {cookies}
          {cookies === 1 ? 'cookie' : 'cookies'}
        </span>
        {#if status === 'hungry'}
          <span class="pet-companion__urgent" role="alert">
            Complete a habit today — a second idle day could break the streak.
          </span>
        {/if}
      </span>
    </button>
    <span class="pet-companion__arrow" aria-hidden="true">›</span>
  </div>
{:else}
  <button type="button" class="pet-companion pet-companion--empty card" onclick={onOpenPet}>
    <span class="pet-companion__sprite">
      <PetSprite species="cat" size={64} />
    </span>
    <span class="pet-companion__body">
      <span class="pet-companion__name">Adopt a pixel pet</span>
      <span class="pet-companion__meta">Finish habits to keep it alive and grow.</span>
      {#if petStore.getRunAwayNote()}
        <span class="pet-companion__urgent" role="alert">{petStore.getRunAwayNote()}</span>
      {/if}
    </span>
    <span class="pet-companion__arrow" aria-hidden="true">›</span>
  </button>
{/if}

<style>
  .pet-companion {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    width: 100%;
    font: inherit;
    color: inherit;
    text-align: left;
    cursor: pointer;
    transition: border-color 0.15s ease;
  }

  .pet-companion:hover {
    border-color: var(--color-border-strong);
  }

  .pet-companion__open {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    flex: 1;
    min-width: 0;
    padding: 0;
    border: none;
    background: none;
    font: inherit;
    color: inherit;
    text-align: left;
    cursor: pointer;
  }

  .pet-companion__sprite {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-2);
    border-radius: 18px;
    background: var(--color-primary-soft);
    flex-shrink: 0;
  }

  .pet-companion--empty .pet-companion__sprite {
    background: var(--color-background);
    opacity: 0.85;
  }

  .pet-companion__body {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }

  .pet-companion__name {
    font-weight: 800;
    font-size: 1.0625rem;
    color: var(--color-text);
  }

  .pet-companion__meta {
    font-size: 0.8125rem;
    color: var(--color-muted);
  }

  .pet-companion__urgent {
    font-size: 0.78125rem;
    font-weight: 600;
    color: var(--color-danger);
  }

  .pet-companion__arrow {
    font-size: 1.5rem;
    line-height: 1;
    color: var(--color-muted);
    flex-shrink: 0;
  }
</style>
