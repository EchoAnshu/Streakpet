<script lang="ts">
  import { onMount } from 'svelte'
  import PetSprite from '../components/PetSprite.svelte'
  import {
    FEED_HUNGER_RESTORE,
    FEED_XP,
    MOOD_LABELS,
    PET_SPECIES,
    SPECIES_LABELS,
    STAGE_LABELS,
    isPetSpecies,
    moodForHunger,
    petAgeInDays,
    type PetSpecies,
  } from '../domain/pet'
  import { burstConfetti } from '../lib/confetti'
  import { playAdopt, playFeed } from '../lib/sound'
  import * as petStore from '../stores/pet.svelte'

  let loadError = $derived(petStore.getLoadError())
  let loading = $derived(petStore.isLoading())
  let adopted = $derived(petStore.hasAdopted())
  let species = $derived.by<PetSpecies | null>(() => {
    const value = petStore.getSpecies()
    return value && isPetSpecies(value) ? value : null
  })
  let petName = $derived(petStore.getPetName())
  let stage = $derived(petStore.getStage())
  let treats = $derived(petStore.getTreats())
  let xp = $derived(petStore.getXp())
  let progress = $derived(petStore.getProgress())
  let feedCheck = $derived(petStore.getFeedCheck())

  let nowTick = $state(Date.now())
  let createdAt = $derived(petStore.getCreatedAt())
  let ageInDays = $derived(createdAt === null ? 0 : petAgeInDays(createdAt, nowTick))
  let hunger = $derived(Math.round(petStore.getHunger(nowTick)))
  let mood = $derived(moodForHunger(hunger))
  let hungerColor = $derived(hunger >= 70 ? '#2f9e63' : hunger >= 40 ? '#f5a524' : '#d64545')

  let chosen = $state<PetSpecies>('cat')
  let nameInput = $state('')
  let actionError = $state<string | null>(null)
  let busy = $state(false)
  let bouncing = $state(false)
  let switching = $state(false)

  onMount(() => {
    const interval = window.setInterval(() => (nowTick = Date.now()), 60_000)
    return () => window.clearInterval(interval)
  })

  function actionMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback
  }

  async function adopt() {
    if (busy) return
    busy = true
    actionError = null
    try {
      if (switching) {
        await petStore.switchPet(chosen, nameInput.trim() || null)
        switching = false
      } else {
        await petStore.adopt(chosen, nameInput.trim() || null)
      }
      nameInput = ''
      playAdopt()
      burstConfetti(
        { x: window.innerWidth / 2, y: window.innerHeight / 3 },
        ['#f25c1f', '#f5a524', '#5aa9e6'],
        60
      )
    } catch (error) {
      actionError = actionMessage(error, 'Could not adopt a pet.')
    } finally {
      busy = false
    }
  }

  function startSwitch() {
    const label = petName ?? (species ? SPECIES_LABELS[species] : 'your pet')
    const confirmed = window.confirm(
      `Switch to a new pet? ${label} will be released. Your treats are kept, but XP, growth, and age start over.`
    )
    if (!confirmed) return
    actionError = null
    chosen = species ?? 'cat'
    switching = true
  }

  function cancelSwitch() {
    switching = false
  }

  async function feed() {
    if (busy || !feedCheck.ok) return
    busy = true
    actionError = null
    try {
      await petStore.feed()
      playFeed()
      bouncing = true
      window.setTimeout(() => (bouncing = false), 550)
    } catch (error) {
      actionError = actionMessage(error, 'Could not feed your pet.')
    } finally {
      busy = false
    }
  }
</script>

<div class="pet-view">
  {#if loading}
    <p class="pet-view__status">Loading your pet…</p>
  {:else if loadError}
    <div class="card pet-view__error" role="alert">
      <p>{loadError}</p>
      <button type="button" class="button button--primary" onclick={() => petStore.loadPet(true)}>
        Try again
      </button>
    </div>
  {:else if !adopted || switching}
    <section class="card adopt">
      <h2 class="adopt__title">{switching ? 'Choose a new companion' : 'Choose your companion'}</h2>
      <p class="adopt__hint">
        {#if switching}
          Your current pet will be released. Your treats are kept; XP, growth, and age start over.
        {:else}
          Finish habits to earn treats, then feed your pet to help it grow.
        {/if}
      </p>

      <div class="adopt__grid" role="radiogroup" aria-label="Pet species">
        {#each PET_SPECIES as option (option)}
          <button
            type="button"
            class="adopt__option"
            class:adopt__option--selected={chosen === option}
            role="radio"
            aria-checked={chosen === option}
            onclick={() => (chosen = option)}
          >
            <PetSprite species={option} size={64} />
            <span class="adopt__option-label">{SPECIES_LABELS[option]}</span>
          </button>
        {/each}
      </div>

      <input
        class="adopt__input"
        type="text"
        bind:value={nameInput}
        maxlength="24"
        placeholder={switching ? 'Name your new pet (optional)' : 'Name your pet (optional)'}
        aria-label="Pet name"
      />

      <button
        type="button"
        class="button button--primary adopt__submit"
        disabled={busy}
        onclick={adopt}
      >
        {busy ? 'Adopting…' : `Adopt a ${SPECIES_LABELS[chosen]}`}
      </button>

      {#if switching}
        <button type="button" class="button button--ghost adopt__cancel" onclick={cancelSwitch}>
          Keep my current pet
        </button>
      {/if}
    </section>
  {:else if species}
    <section class="card pet-card">
      <div class="pet-card__sprite">
        <PetSprite
          {species}
          size={stage === 'baby' ? 120 : stage === 'teen' ? 152 : 184}
          label={`${SPECIES_LABELS[species]} at the ${STAGE_LABELS[stage].toLowerCase()} stage`}
          bounce={bouncing}
          idle
          {mood}
        />
      </div>

      <h2 class="pet-card__name">
        {petName ?? SPECIES_LABELS[species]}
      </h2>
      <p class="pet-card__age">
        {ageInDays} {ageInDays === 1 ? 'day' : 'days'} old
      </p>
      <div class="pet-card__chips">
        <span class="pet-chip">{STAGE_LABELS[stage]}</span>
        <span class="pet-chip" class:pet-chip--mood={mood === 'sad' || mood === 'hungry'}>
          {MOOD_LABELS[mood]}
        </span>
        <span class="pet-chip">{SPECIES_LABELS[species]}</span>
      </div>

      <div class="pet-card__meter">
        <div class="pet-card__meter-head">
          <span class="pet-card__meter-label">Fullness</span>
          <span class="pet-card__meter-value">{hunger} / 100</span>
        </div>
        <div
          class="pet-card__meter-track"
          role="progressbar"
          aria-label="Pet fullness"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={hunger}
        >
          <div
            class="pet-card__meter-fill"
            style={`width:${hunger}%;background:${hungerColor}`}
          ></div>
        </div>
        <p class="pet-card__meter-hint">Fullness drains every day. Feed treats to restore it.</p>
      </div>

      <div class="pet-card__feed-row">
        <div class="pet-card__treats" aria-label={`${treats} treats`}>
          <svg
            class="pet-card__treat-icon"
            viewBox="0 0 8 8"
            aria-hidden="true"
            focusable="false"
            shape-rendering="crispEdges"
          >
            <rect x="1" y="1" width="6" height="6" rx="1" fill="#d9954a"></rect>
            <rect x="2" y="2" width="1" height="1" fill="#8a5a2b"></rect>
            <rect x="5" y="3" width="1" height="1" fill="#8a5a2b"></rect>
            <rect x="3" y="5" width="1" height="1" fill="#8a5a2b"></rect>
          </svg>
          <span class="pet-card__treat-count">
            {treats} {treats === 1 ? 'treat' : 'treats'}
          </span>
        </div>
        <button
          type="button"
          class="button button--primary pet-card__feed"
          disabled={busy || !feedCheck.ok}
          title={feedCheck.ok ? undefined : feedCheck.reason}
          onclick={feed}
        >
          Feed (+{FEED_HUNGER_RESTORE} fullness)
        </button>
      </div>
      {#if !feedCheck.ok && feedCheck.reason}
        <p class="pet-card__feed-note">{feedCheck.reason}</p>
      {/if}
      <p class="pet-card__feed-note">
        Each feeding spends 1 treat and gives +{FEED_XP} XP.
      </p>
    </section>

    <section class="card">
      <h2 class="pet-card__section-title">Growth</h2>
      {#if progress.goal && progress.nextStage}
        <div
          class="pet-card__meter-track"
          role="progressbar"
          aria-label={`Progress to the ${STAGE_LABELS[progress.nextStage].toLowerCase()} stage`}
          aria-valuemin="0"
          aria-valuemax={progress.goal}
          aria-valuenow={progress.earned}
        >
          <div
            class="pet-card__meter-fill"
            style={`width:${Math.min(100, Math.round((progress.earned / progress.goal) * 100))}%;background:#f25c1f`}
          ></div>
        </div>
        <p class="pet-card__meter-hint">
          {progress.earned} / {progress.goal} XP — about {Math.ceil((progress.goal - progress.earned) / FEED_XP)} more
          {Math.ceil((progress.goal - progress.earned) / FEED_XP) === 1 ? 'feeding' : 'feedings'} to
          {STAGE_LABELS[progress.nextStage]}
        </p>
      {:else}
        <p class="pet-card__meter-hint">Fully grown</p>
      {/if}
      <p class="pet-card__meter-hint">{xp} XP earned so far.</p>
    </section>

    <section class="card">
      <h2 class="pet-card__section-title">Companion</h2>
      <p class="pet-card__meter-hint">
        Want a different companion? You can switch pets at any time.
      </p>
      <button type="button" class="button button--ghost pet-card__switch" onclick={startSwitch}>
        Switch pet
      </button>
    </section>
  {/if}

  {#if actionError}
    <p class="pet-view__action-error" role="alert">{actionError}</p>
  {/if}
</div>

<style>
  .pet-view {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .pet-view__status {
    color: var(--color-muted);
  }

  .pet-view__error {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-3);
  }

  .pet-view__action-error {
    color: var(--color-danger);
    font-size: 0.875rem;
  }

  .adopt {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .adopt__title {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 800;
  }

  .adopt__hint {
    color: var(--color-muted);
    font-size: 0.9375rem;
  }

  .adopt__grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-2);
  }

  .adopt__option {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-3) var(--space-1);
    border: 1.5px solid var(--color-border);
    border-radius: var(--radius-button);
    background: var(--color-surface);
    cursor: pointer;
    font: inherit;
    transition: border-color 0.15s ease, background 0.15s ease;
  }

  .adopt__option--selected {
    border-color: var(--color-primary);
    background: var(--color-primary-soft);
  }

  .adopt__option-label {
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--color-muted);
  }

  .adopt__option--selected .adopt__option-label {
    color: var(--color-primary);
  }

  .adopt__input {
    font: inherit;
    color: inherit;
    padding: 12px var(--space-4);
    border: 1.5px solid var(--color-border-strong);
    border-radius: var(--radius-button);
    background: var(--color-surface);
    min-height: 48px;
  }

  .adopt__input:focus-visible {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(242, 92, 31, 0.14);
  }

  .adopt__submit {
    width: 100%;
  }

  .adopt__cancel {
    width: 100%;
  }

  .pet-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-3);
    text-align: center;
    padding: var(--space-5) var(--space-4);
  }

  .pet-card__sprite {
    padding: var(--space-2);
  }

  .pet-card__name {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 800;
    letter-spacing: -0.02em;
  }

  .pet-card__age {
    color: var(--color-muted);
    font-size: 0.875rem;
    font-weight: 600;
    margin-top: calc(-1 * var(--space-2));
  }

  .pet-card__chips {
    display: flex;
    gap: var(--space-2);
    flex-wrap: wrap;
    justify-content: center;
  }

  .pet-chip {
    padding: 4px 12px;
    border-radius: var(--radius-pill);
    background: var(--color-background);
    border: 1px solid var(--color-border);
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--color-muted);
  }

  .pet-chip--mood {
    color: var(--color-primary);
    border-color: rgba(242, 92, 31, 0.3);
    background: var(--color-primary-soft);
  }

  .pet-card__meter {
    width: 100%;
    text-align: left;
  }

  .pet-card__meter-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: var(--space-1);
  }

  .pet-card__meter-label {
    font-weight: 700;
    font-size: 0.9375rem;
  }

  .pet-card__meter-value {
    color: var(--color-muted);
    font-size: 0.8125rem;
  }

  .pet-card__meter-track {
    width: 100%;
    height: 10px;
    border-radius: var(--radius-pill);
    background: var(--color-border);
    overflow: hidden;
  }

  .pet-card__meter-fill {
    height: 100%;
    border-radius: var(--radius-pill);
    transition: width 0.3s ease, background 0.3s ease;
  }

  .pet-card__meter-hint {
    color: var(--color-muted);
    font-size: 0.8125rem;
    margin-top: var(--space-1);
  }

  .pet-card__feed-row {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    flex-wrap: wrap;
  }

  .pet-card__treats {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    font-weight: 700;
  }

  .pet-card__treat-icon {
    width: 22px;
    height: 22px;
  }

  .pet-card__treat-count {
    font-size: 0.9375rem;
  }

  .pet-card__feed {
    flex: 1;
    min-width: 160px;
  }

  .pet-card__feed-note {
    color: var(--color-muted);
    font-size: 0.8125rem;
  }

  .pet-card__section-title {
    margin: 0 0 var(--space-2);
    font-size: 1.0625rem;
    font-weight: 800;
    text-align: left;
  }

  .pet-card__switch {
    width: 100%;
    margin-top: var(--space-3);
  }
</style>
