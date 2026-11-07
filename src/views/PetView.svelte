<script lang="ts">
  import { onMount } from 'svelte'
  import PetSprite from '../components/PetSprite.svelte'
  import {
    COOKIE_MILESTONE_ACTIVE_DAYS,
    MOOD_LABELS,
    PET_SPECIES,
    SPECIES_LABELS,
    STAGE_LABELS,
    STATUS_LABELS,
    XP_PER_COMPLETION,
    activeDaysToNextCookie,
    isPetSpecies,
    moodForStatus,
    petAgeInDays,
    stageForXp,
    stageProgress,
    type PetSpecies,
  } from '../domain/pet'
  import { burstConfetti } from '../lib/confetti'
  import { playAdopt } from '../lib/sound'
  import { petMoodOverride } from '../lib/petMoodOverride'
  import * as petStore from '../stores/pet.svelte'

  const DAY_MS = 24 * 60 * 60 * 1000

  let loadError = $derived(petStore.getLoadError())
  let loading = $derived(petStore.isLoading())
  let adopted = $derived(petStore.hasAdopted())
  let species = $derived.by<PetSpecies | null>(() => {
    const value = petStore.getSpecies()
    return value && isPetSpecies(value) ? value : null
  })
  let petName = $derived(petStore.getPetName())
  let xp = $derived(petStore.getXp())
  let stage = $derived(stageForXp(xp))
  let progress = $derived(stageProgress(xp))

  let nowTick = $state(Date.now())
  let createdAt = $derived(petStore.getCreatedAt())
  let ageInDays = $derived(createdAt === null ? 0 : petAgeInDays(createdAt, nowTick))
  let status = $derived(petStore.getPetStatus())
  let mood = $derived(petMoodOverride() ?? moodForStatus(status))

  let cookies = $derived(petStore.getCookies())
  let cookieExpiry = $derived(petStore.getCookieExpiry())
  let cookieDaysLeft = $derived(
    cookieExpiry === null ? null : Math.max(0, Math.ceil((cookieExpiry - nowTick) / DAY_MS))
  )

  let currentStreak = $derived(petStore.getCurrentStreak())
  let longestStreak = $derived(petStore.getLongestStreak())
  let activeDays = $derived(petStore.getActiveDays())
  let daysToNextCookie = $derived(activeDaysToNextCookie(activeDays))
  let protectedDays = $derived.by(() => {
    const pet = petStore.getPet()
    return pet ? (pet.cookieSpendDates?.length ?? 0) : 0
  })

  let urgentNote = $derived(
    status === 'hungry'
      ? 'No habits finished today — one more idle day could cost a cookie… or the whole streak!'
      : null
  )

  let chosen = $state<PetSpecies>('cat')
  let nameInput = $state('')
  let actionError = $state<string | null>(null)
  let busy = $state(false)
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
      `Switch to a new pet? ${label} will be released. Your cookies are kept, but XP, growth, and age start over.`
    )
    if (!confirmed) return
    actionError = null
    chosen = species ?? 'cat'
    switching = true
  }

  function cancelSwitch() {
    switching = false
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
          Your current pet will be released. Your cookies are kept; XP, growth, and the streak start over.
        {:else}
          Finish at least one habit every day to keep your streak alive and your pet around.
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
          idle
          {mood}
          {stage}
        />
      </div>

      <h2 class="pet-card__name">
        {petName ?? SPECIES_LABELS[species]}
      </h2>
      <p class="pet-card__age">
        {ageInDays} {ageInDays === 1 ? 'day' : 'days'} old · {STATUS_LABELS[status]}
      </p>
      <div class="pet-card__chips">
        <span class="pet-chip">{STAGE_LABELS[stage]}</span>
        <span class="pet-chip" class:pet-chip--mood={mood === 'sad' || mood === 'hungry'}>
          {MOOD_LABELS[mood]}
        </span>
        <span class="pet-chip">{SPECIES_LABELS[species]}</span>
      </div>

      {#if urgentNote}
        <p class="pet-card__urgent" role="alert">{urgentNote}</p>
      {/if}
    </section>

    <section class="card">
      <h2 class="pet-card__section-title">Streak</h2>
      <div class="streak-stats">
        <div class="streak-stat">
          <span class="streak-stat__value">{currentStreak}</span>
          <span class="streak-stat__label">Current</span>
        </div>
        <div class="streak-stat">
          <span class="streak-stat__value">{longestStreak}</span>
          <span class="streak-stat__label">Best</span>
        </div>
        <div class="streak-stat">
          <span class="streak-stat__value">{activeDays}</span>
          <span class="streak-stat__label">Active days</span>
        </div>
        <div class="streak-stat">
          <span class="streak-stat__value">{protectedDays}</span>
          <span class="streak-stat__label">Protected</span>
        </div>
      </div>
      <p class="pet-card__hint">
        Finish {daysToNextCookie} more {daysToNextCookie === 1 ? 'active day' : 'active days'} to
        earn the next cookie (every {COOKIE_MILESTONE_ACTIVE_DAYS} ticks).
      </p>
    </section>

    <section class="card">
      <h2 class="pet-card__section-title">Cookies</h2>
      <div class="cookie-inventory" aria-label={`${cookies} cookies in inventory`}>
        {#each Array.from({ length: 2 }, (_, slot) => slot) as slot (slot)}
          <div
            class="cookie-inventory__slot"
            class:cookie-inventory__slot--filled={slot < cookies}
          >
            <svg viewBox="0 0 10 10" aria-hidden="true" focusable="false" class="cookie-inventory__icon">
              <rect x="1" y="1" width="8" height="8" rx="2" fill="#b9762f"></rect>
              <rect x="3" y="3" width="1.5" height="1.5" fill="#3c2309"></rect>
              <rect x="6.5" y="4" width="1.5" height="1.5" fill="#3c2309"></rect>
              <rect x="4" y="6.5" width="1.5" height="1.5" fill="#3c2309"></rect>
            </svg>
          </div>
        {/each}
      </div>
      <p class="pet-card__hint">
        {#if cookies > 0 && cookieDaysLeft !== null}
          {cookies} {cookies === 1 ? 'cookie' : 'cookies'} auto-protect a missed day while they last
          (~{cookieDaysLeft} {cookieDaysLeft === 1 ? 'day' : 'days'} left; they only break two misses in a row).
        {:else}
          Earn a cookie every {COOKIE_MILESTONE_ACTIVE_DAYS} active days (max 2). They last 7 days and
          patch single missed days automatically.
        {/if}
      </p>
    </section>

    <section class="card">
      <h2 class="pet-card__section-title">Growth</h2>
      {#if progress.goal && progress.nextStage}
        <div
          class="growth-track"
          role="progressbar"
          aria-label={`Progress to the ${STAGE_LABELS[progress.nextStage].toLowerCase()} stage`}
          aria-valuemin="0"
          aria-valuemax={progress.goal}
          aria-valuenow={progress.earned}
        >
          <div
            class="growth-track__fill"
            style={`width:${Math.min(100, Math.round((progress.earned / progress.goal) * 100))}%;background:#f25c1f`}
          ></div>
        </div>
        <p class="pet-card__hint">
          {progress.earned} / {progress.goal} to {STAGE_LABELS[progress.nextStage]}
        </p>
      {:else}
        <p class="pet-card__hint">Fully grown — keep the streak going!</p>
      {/if}
      <p class="pet-card__hint">{xp} XP earned ({XP_PER_COMPLETION} per habit finished).</p>
    </section>

    <section class="card">
      <h2 class="pet-card__section-title">Companion</h2>
      <p class="pet-card__hint">
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

  .pet-card__urgent {
    color: var(--color-danger);
    font-size: 0.875rem;
    font-weight: 700;
    margin: 0;
  }

  .pet-card__section-title {
    margin: 0 0 var(--space-2);
    font-size: 1.0625rem;
    font-weight: 800;
    text-align: left;
  }

  .pet-card__hint {
    color: var(--color-muted);
    font-size: 0.8125rem;
    margin-top: var(--space-1);
  }

  .streak-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-2);
  }

  .streak-stat {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: var(--space-2);
    border-radius: var(--radius-button);
    background: var(--color-background);
    border: 1px solid var(--color-border);
    text-align: center;
  }

  .streak-stat__value {
    font-weight: 800;
    font-size: 1.125rem;
    color: var(--color-text);
  }

  .streak-stat__label {
    font-size: 0.6875rem;
    font-weight: 700;
    color: var(--color-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .cookie-inventory {
    display: flex;
    gap: var(--space-2);
    justify-content: center;
  }

  .cookie-inventory__slot {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 12px;
    border: 1.5px dashed var(--color-border-strong);
    background: var(--color-background);
    opacity: 0.45;
  }

  .cookie-inventory__slot--filled {
    border-style: solid;
    border-color: rgba(242, 92, 31, 0.4);
    background: var(--color-primary-soft);
    opacity: 1;
  }

  .cookie-inventory__icon {
    width: 26px;
    height: 26px;
  }

  .growth-track {
    width: 100%;
    height: 10px;
    border-radius: var(--radius-pill);
    background: var(--color-border);
    overflow: hidden;
  }

  .growth-track__fill {
    height: 100%;
    border-radius: var(--radius-pill);
    transition: width 0.3s ease, background 0.3s ease;
  }

  .pet-card__switch {
    width: 100%;
    margin-top: var(--space-3);
  }
</style>
