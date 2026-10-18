<script lang="ts">
  import { untrack } from 'svelte'
  import type { Habit } from '../types/models'
  import {
    EVERY_DAY,
    HABIT_COLORS,
    HABIT_ICONS,
    NOTE_MAX_LENGTH,
    WEEKDAY_FULL_LABELS,
    WEEKDAY_LABELS,
    normalizeScheduledDays,
    validateHabitInput,
    type HabitInput,
    type HabitInputErrors,
  } from '../domain/habits'

  interface Props {
    habit?: Habit | null
    defaultColor?: string
    onSave: (input: HabitInput) => Promise<void> | void
    onCancel: () => void
  }

  let { habit = null, defaultColor = HABIT_COLORS[0], onSave, onCancel }: Props = $props()

  let name = $state(untrack(() => habit?.name ?? ''))
  let icon = $state(untrack(() => habit?.icon ?? ''))
  let color = $state(untrack(() => habit?.color ?? defaultColor))
  let note = $state(untrack(() => habit?.note ?? ''))
  let scheduledDays = $state<number[]>(
    untrack(() => (habit ? [...habit.scheduledDays] : [...EVERY_DAY]))
  )
  let reminderTime = $state(untrack(() => habit?.reminder?.time ?? ''))
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
    const input: HabitInput = {
      name,
      icon,
      color,
      note,
      scheduledDays,
      reminder: reminderTime ? { time: reminderTime, days: scheduledDays } : undefined,
    }
    const validation = validateHabitInput(input)
    errors = validation
    if (
      validation.name ||
      validation.icon ||
      validation.color ||
      validation.scheduledDays ||
      validation.reminder ||
      validation.note
    ) {
      return
    }

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

  <div class="habit-form__identity">
    <span class="habit-form__preview" style={`background: ${color}`}>
      {icon || '?'}
    </span>
    <div class="habit-form__identity-fields">
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
      />
      {#if errors.name}
        <p class="habit-form__error">{errors.name}</p>
      {/if}
    </div>
  </div>

  <fieldset class="habit-form__field habit-form__days-fieldset">
    <legend class="habit-form__label">Icon</legend>
    <div class="habit-form__icon-grid">
      {#each HABIT_ICONS as option (option)}
        <button
          type="button"
          class="habit-form__icon"
          class:habit-form__icon--active={icon === option}
          aria-pressed={icon === option}
          aria-label={`Use icon ${option}`}
          onclick={() => (icon = option)}
        >
          {option}
        </button>
      {/each}
    </div>
    <input
      class="habit-form__input"
      type="text"
      bind:value={icon}
      maxlength="8"
      placeholder="Or type any emoji"
      aria-label="Custom habit icon"
    />
    {#if errors.icon}
      <p class="habit-form__error">{errors.icon}</p>
    {/if}
  </fieldset>

  <fieldset class="habit-form__field habit-form__days-fieldset">
    <legend class="habit-form__label">Color</legend>
    <div class="habit-form__colors">
      {#each HABIT_COLORS as option (option)}
        <button
          type="button"
          class="habit-form__color"
          class:habit-form__color--active={color === option}
          style={`background: ${option}`}
          aria-pressed={color === option}
          aria-label={`Use color ${option}`}
          onclick={() => (color = option)}
        ></button>
      {/each}
    </div>
  </fieldset>

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

  <div class="habit-form__field">
    <label class="habit-form__label" for="habit-reminder">Reminder (optional)</label>
    <input
      id="habit-reminder"
      class="habit-form__input"
      type="time"
      bind:value={reminderTime}
    />
    <p class="habit-form__hint">Reminds you at this time on the scheduled days.</p>
    {#if errors.reminder}
      <p class="habit-form__error">{errors.reminder}</p>
    {/if}
  </div>

  <div class="habit-form__field">
    <label class="habit-form__label" for="habit-note">Note (optional)</label>
    <textarea
      id="habit-note"
      class="habit-form__input habit-form__textarea"
      bind:value={note}
      maxlength={NOTE_MAX_LENGTH}
      rows="2"
      placeholder="Why this habit matters, or how you do it"
    ></textarea>
    {#if errors.note}
      <p class="habit-form__error">{errors.note}</p>
    {/if}
  </div>

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

  .habit-form__identity {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
  }

  .habit-form__preview {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    flex-shrink: 0;
  }

  .habit-form__identity-fields {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
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

  .habit-form__textarea {
    resize: vertical;
  }

  .habit-form__input:focus-visible {
    border-color: var(--color-primary);
  }

  .habit-form__icon-grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: var(--space-1);
    margin-bottom: var(--space-2);
  }

  .habit-form__icon {
    aspect-ratio: 1;
    border-radius: var(--radius-button);
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    font-size: 1.25rem;
    cursor: pointer;
    padding: 0;
  }

  .habit-form__icon--active {
    border-color: var(--color-primary);
    background: var(--color-primary-soft);
  }

  .habit-form__colors {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin-top: var(--space-1);
  }

  .habit-form__color {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 3px solid transparent;
    cursor: pointer;
    padding: 0;
  }

  .habit-form__color--active {
    border-color: var(--color-text);
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

  .habit-form__hint {
    color: var(--color-muted);
    font-size: 0.8125rem;
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

  @media (max-width: 480px) {
    .habit-form__icon-grid {
      grid-template-columns: repeat(6, 1fr);
    }
  }
</style>
