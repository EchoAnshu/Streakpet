<script lang="ts">
  import { untrack } from 'svelte'
  import type { Habit } from '../types/models'
  import {
    EVERY_DAY,
    WEEKDAY_FULL_LABELS,
    WEEKDAY_LABELS,
    normalizeScheduledDays,
    validateHabitInput,
    type HabitInput,
    type HabitInputErrors,
  } from '../domain/habits'

  interface Props {
    habit?: Habit | null
    onSave: (input: HabitInput) => Promise<void> | void
    onCancel: () => void
  }

  let { habit = null, onSave, onCancel }: Props = $props()

  let name = $state(untrack(() => habit?.name ?? ''))
  let description = $state(untrack(() => habit?.description ?? ''))
  let scheduledDays = $state<number[]>(
    untrack(() => (habit ? [...habit.scheduledDays] : [...EVERY_DAY]))
  )
  let errors = $state<HabitInputErrors>({})
  let saving = $state(false)
  let saveError = $state<string | null>(null)
  let nameField = $state<HTMLInputElement>()

  const isEditing = untrack(() => habit !== null)

  $effect(() => {
    nameField?.focus()
  })

  function toggleDay(day: number) {
    scheduledDays = scheduledDays.includes(day)
      ? scheduledDays.filter((value) => value !== day)
      : normalizeScheduledDays([...scheduledDays, day])
  }

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault()
    const input: HabitInput = { name, description, scheduledDays }
    const validation = validateHabitInput(input)
    errors = validation
    if (validation.name || validation.scheduledDays) return

    saving = true
    saveError = null
    try {
      await onSave(input)
    } catch (error) {
      saveError = error instanceof Error ? error.message : 'Could not save the habit.'
    } finally {
      saving = false
    }
  }
</script>

<form class="habit-form card" novalidate onsubmit={handleSubmit}>
  <h2 class="habit-form__heading">{isEditing ? 'Edit habit' : 'Add a habit'}</h2>

  <div class="habit-form__field">
    <label class="habit-form__label" for="habit-name">Name</label>
    <input
      id="habit-name"
      class="habit-form__input"
      type="text"
      bind:value={name}
      bind:this={nameField}
      maxlength="80"
      placeholder="Read for 20 minutes"
      aria-invalid={errors.name ? 'true' : undefined}
      aria-describedby={errors.name ? 'habit-name-error' : undefined}
    />
    {#if errors.name}
      <p class="habit-form__error" id="habit-name-error">{errors.name}</p>
    {/if}
  </div>

  <div class="habit-form__field">
    <label class="habit-form__label" for="habit-description">Description (optional)</label>
    <input
      id="habit-description"
      class="habit-form__input"
      type="text"
      bind:value={description}
      maxlength="120"
      placeholder="Walk after lunch"
    />
  </div>

  <fieldset class="habit-form__field habit-form__days-fieldset">
    <legend class="habit-form__label">Scheduled days</legend>
    <div class="habit-form__day-buttons">
      {#each WEEKDAY_LABELS as label, index (label)}
        <button
          type="button"
          class="habit-form__day"
          class:habit-form__day--active={scheduledDays.includes(index)}
          aria-pressed={scheduledDays.includes(index)}
          aria-label={WEEKDAY_FULL_LABELS[index]}
          onclick={() => toggleDay(index)}
        >
          {label}
        </button>
      {/each}
    </div>
    {#if errors.scheduledDays}
      <p class="habit-form__error">{errors.scheduledDays}</p>
    {/if}
  </fieldset>

  {#if saveError}
    <p class="habit-form__error" role="alert">{saveError}</p>
  {/if}

  <div class="habit-form__actions">
    <button type="button" class="button button--ghost" onclick={onCancel} disabled={saving}>
      Cancel
    </button>
    <button type="submit" class="button button--primary" disabled={saving}>
      {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Add habit'}
    </button>
  </div>
</form>

<style>
  .habit-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .habit-form__heading {
    margin: 0;
  }

  .habit-form__field {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .habit-form__days-fieldset {
    border: none;
    margin: 0;
    padding: 0;
  }

  .habit-form__label {
    font-weight: 600;
    font-size: 0.9375rem;
  }

  .habit-form__input {
    font: inherit;
    color: inherit;
    padding: 10px var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-button);
    background: var(--color-surface);
    min-height: 44px;
  }

  .habit-form__input:focus-visible {
    border-color: var(--color-primary);
  }

  .habit-form__day-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1);
    margin-top: var(--space-1);
  }

  .habit-form__day {
    min-width: 48px;
    min-height: 40px;
    border-radius: var(--radius-button);
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    font: inherit;
    font-size: 0.875rem;
    cursor: pointer;
    color: var(--color-muted);
  }

  .habit-form__day--active {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-surface);
    font-weight: 600;
  }

  .habit-form__error {
    color: var(--color-danger);
    font-size: 0.875rem;
  }

  .habit-form__actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-2);
  }
</style>
