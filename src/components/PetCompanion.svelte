<script lang="ts">
  import { onMount } from 'svelte'
  import PetSprite from './PetSprite.svelte'
  import {
    MOOD_LABELS,
    SPECIES_LABELS,
    STAGE_LABELS,
    isPetSpecies,
    moodForHunger,
    type PetSpecies,
  } from '../domain/pet'
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
  let stage = $derived(petStore.getStage())
  let treats = $derived(petStore.getTreats())

  let nowTick = $state(Date.now())
  let hunger = $derived(Math.round(petStore.getHunger(nowTick)))
  let mood = $derived(moodForHunger(hunger))
  let hungerColor = $derived(hunger >= 70 ? '#2f9e63' : hunger >= 40 ? '#f5a524' : '#d64545')

  onMount(() => {
    const interval = window.setInterval(() => (nowTick = Date.now()), 60_000)
    return () => window.clearInterval(interval)
  })
</script>

{#if adopted && species}
  <button type="button" class="pet-companion card" onclick={onOpenPet}>
    <span class="pet-companion__sprite">
      <PetSprite {species} size={76} />
    </span>
    <span class="pet-companion__body">
      <span class="pet-companion__name">{petName ?? SPECIES_LABELS[species]}</span>
      <span class="pet-companion__meta">
        {STAGE_LABELS[stage]} · {MOOD_LABELS[mood]} · {treats}
        {treats === 1 ? 'treat' : 'treats'}
      </span>
      <span class="pet-companion__meter">
        <span class="pet-companion__meter-track">
          <span
            class="pet-companion__meter-fill"
            style={`width:${hunger}%;background:${hungerColor}`}
          ></span>
        </span>
        <span class="pet-companion__meter-value">{hunger}</span>
      </span>
    </span>
    <span class="pet-companion__arrow" aria-hidden="true">›</span>
  </button>
{:else}
  <button type="button" class="pet-companion pet-companion--empty card" onclick={onOpenPet}>
    <span class="pet-companion__sprite">
      <PetSprite species="cat" size={64} />
    </span>
    <span class="pet-companion__body">
      <span class="pet-companion__name">Adopt a pixel pet</span>
      <span class="pet-companion__meta">Finish habits to earn treats and help it grow.</span>
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

  .pet-companion__meter {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-top: var(--space-1);
  }

  .pet-companion__meter-track {
    flex: 1;
    height: 8px;
    border-radius: var(--radius-pill);
    background: var(--color-border);
    overflow: hidden;
  }

  .pet-companion__meter-fill {
    display: block;
    height: 100%;
    border-radius: var(--radius-pill);
    transition: width 0.3s ease, background 0.3s ease;
  }

  .pet-companion__meter-value {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--color-muted);
    font-variant-numeric: tabular-nums;
  }

  .pet-companion__arrow {
    font-size: 1.5rem;
    line-height: 1;
    color: var(--color-muted);
    flex-shrink: 0;
  }
</style>
