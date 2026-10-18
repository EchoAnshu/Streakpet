<script lang="ts">
  import { untrack } from 'svelte'
  import type { Habit } from '../types/models'
  import {
    EVERY_DAY,
    HABIT_COLORS,
    HABIT_ICONS,
    NOTE_MAX_LENGTH,
    WEEKDAY_FULL_LABELS,
    normalizeScheduledDays,
    validateHabitInput,
    type HabitInput,
    type HabitInputErrors,
  } from '../domain/habits'

  interface Props {
    habit?: Habit | null
    defaultColor?: string
    onSave: (input: HabitInput) => Promise<void> | void
    onArchive?: (habit: Habit) => void
    onCancel: () => void
  }

  let {
    habit = null,
    defaultColor = HABIT_COLORS[0],
    onSave,
    onArchive,
    onCancel,
  }: Props = $props()

  const isEditing = untrack(() => habit !== null)
  const title = isEditing ? 'Edit habit' : 'New habit'

  const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]
  const DAY_LETTERS: Record<number, string> = {
    0: 'S',
    1: 'M',
    2: 'T',
    3: 'W',
    4: 'T',
    5: 'F',
    6: 'S',
  }

  function isEveryDay(days: number[]): boolean {
    return normalizeScheduledDays(days).length === 7
  }

  let name = $state(untrack(() => habit?.name ?? ''))
  let icon = $state(untrack(() => habit?.icon ?? HABIT_ICONS[1]))
  let color = $state(untrack(() => habit?.color ?? defaultColor))
  let note = $state(untrack(() => habit?.note ?? ''))
  let customDays = $state(untrack(() => (habit ? !isEveryDay(habit.scheduledDays) : false)))
  let daySelection = $state<number[]>(
    untrack(() => (habit ? [...habit.scheduledDays] : [...EVERY_DAY]))
  )
  let reminderTime = $state(untrack(() => habit?.reminder?.time ?? ''))
  let errors = $state<HabitInputErrors>({})
  let saving = $state(false)
  let saveError = $state<string | null>(null)
  let nameField = $state<HTMLInputElement>()

  $effect(() => {
    nameField?.focus()
  })

  function selectedDays(): number[] {
    return customDays ? normalizeScheduledDays(daySelection) : [...EVERY_DAY]
  }

  function toggleDay(day: number) {
    daySelection = daySelection.includes(day)
      ? daySelection.filter((value) => value !== day)
      : [...daySelection, day]
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') onCancel()
  }

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault()
    const input: HabitInput = {
      name,
      icon,
      color,
      note,
      scheduledDays: selectedDays(),
      reminder: reminderTime ? { time: reminderTime, days: selectedDays() } : undefined,
    }
    const validation = validateHabitInput(input)
    errors = validation
    if (Object.keys(validation).length > 0) return

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

<svelte:window onkeydown={handleKeydown} />

<div class="sheet" role="dialog" aria-modal="true" aria-label={title}>
  <button type="button" class="sheet__backdrop" aria-label="Close" tabindex="-1" onclick={onCancel}
  ></button>

  <div class="sheet__panel">
    <header class="sheet__header">
      <h2 class="sheet__title">{title}</h2>
      <button type="button" class="sheet__close" aria-label="Close" onclick={onCancel}>
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </header>

    <form class="sheet__form" novalidate onsubmit={handleSubmit}>
      <div class="sheet__identity">
        <span class="sheet__preview" aria-hidden="true" style={`background:${color}2e`}>
          {icon}
        </span>
        <p class="sheet__identity-hint">Pick an icon and color for your habit</p>
      </div>

      <div class="sheet__field">
        <p class="sheet__label">Icon</p>
        <div class="sheet__icon-grid">
          {#each HABIT_ICONS as option (option)}
            <button
              type="button"
              class="sheet__icon"
              class:sheet__icon--active={icon === option}
              aria-pressed={icon === option}
              aria-label={`Use icon ${option}`}
              onclick={() => (icon = option)}
            >
              {option}
            </button>
          {/each}
        </div>
        <input
          class="sheet__input sheet__input--center"
          type="text"
          bind:value={icon}
          maxlength="8"
          placeholder="Or type any emoji"
          aria-label="Custom habit icon"
        />
        {#if errors.icon}
          <p class="sheet__error">{errors.icon}</p>
        {/if}
      </div>

      <div class="sheet__field">
        <p class="sheet__label">Color</p>
        <div class="sheet__colors">
          {#each HABIT_COLORS as option (option)}
            <button
              type="button"
              class="sheet__color"
              style={color === option
                ? `background:${option};box-shadow:0 0 0 2px #ffffff,0 0 0 4.5px ${option}`
                : `background:${option}`}
              aria-pressed={color === option}
              aria-label={`Use color ${option}`}
              onclick={() => (color = option)}
            ></button>
          {/each}
        </div>
      </div>

      <div class="sheet__field">
        <label class="sheet__label" for="habit-name">Habit name</label>
        <input
          id="habit-name"
          class="sheet__input"
          type="text"
          bind:value={name}
          bind:this={nameField}
          maxlength="60"
          placeholder="Read for 20 minutes"
          aria-invalid={errors.name ? 'true' : undefined}
        />
        {#if errors.name}
          <p class="sheet__error">{errors.name}</p>
        {/if}
      </div>

      <div class="sheet__field">
        <p class="sheet__label">How often?</p>
        <div class="sheet__segments" role="group" aria-label="How often">
          <button
            type="button"
            class="sheet__segment"
            class:sheet__segment--active={!customDays}
            aria-pressed={!customDays}
            onclick={() => (customDays = false)}
          >
            Every day
          </button>
          <button
            type="button"
            class="sheet__segment"
            class:sheet__segment--active={customDays}
            aria-pressed={customDays}
            onclick={() => (customDays = true)}
          >
            Custom days
          </button>
        </div>
        {#if customDays}
          <div class="sheet__days">
            {#each DAY_ORDER as day (day)}
              <button
                type="button"
                class="sheet__day"
                class:sheet__day--active={daySelection.includes(day)}
                aria-pressed={daySelection.includes(day)}
                aria-label={WEEKDAY_FULL_LABELS[day]}
                style={daySelection.includes(day)
                  ? `background:${color};border-color:${color}`
                  : undefined}
                onclick={() => toggleDay(day)}
              >
                {DAY_LETTERS[day]}
              </button>
            {/each}
          </div>
        {/if}
        {#if errors.scheduledDays}
          <p class="sheet__error">{errors.scheduledDays}</p>
        {/if}
      </div>

      <div class="sheet__field">
        <label class="sheet__label" for="habit-reminder">Reminder (optional)</label>
        <input id="habit-reminder" class="sheet__input" type="time" bind:value={reminderTime} />
        <p class="sheet__hint">
          Reminders appear while the app is open on the scheduled days.
        </p>
        {#if errors.reminder}
          <p class="sheet__error">{errors.reminder}</p>
        {/if}
      </div>

      <div class="sheet__field">
        <label class="sheet__label" for="habit-note">Note (optional)</label>
        <textarea
          id="habit-note"
          class="sheet__input sheet__input--textarea"
          bind:value={note}
          maxlength={NOTE_MAX_LENGTH}
          rows="3"
          placeholder="Why this habit matters, or how you do it"
        ></textarea>
        {#if errors.note}
          <p class="sheet__error">{errors.note}</p>
        {/if}
      </div>

      {#if saveError}
        <p class="sheet__error" role="alert">{saveError}</p>
      {/if}

      <button type="submit" class="button button--primary sheet__submit" disabled={saving}>
        {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Create habit'}
      </button>

      <div class="sheet__footer">
        <button type="button" class="sheet__link" onclick={onCancel} disabled={saving}>
          Cancel
        </button>
        {#if isEditing && habit && onArchive}
          <button
            type="button"
            class="sheet__link sheet__link--danger"
            onclick={() => onArchive(habit)}
            disabled={saving}
          >
            Archive
          </button>
        {/if}
      </div>
    </form>
  </div>
</div>

<style>
  .sheet {
    position: fixed;
    inset: 0;
    z-index: 60;
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }

  .sheet__backdrop {
    position: absolute;
    inset: 0;
    border: none;
    padding: 0;
    background: rgba(24, 18, 12, 0.45);
    backdrop-filter: blur(2px);
    cursor: pointer;
  }

  .sheet__panel {
    position: relative;
    width: min(100%, 560px);
    max-height: 92svh;
    overflow-y: auto;
    background: var(--color-surface);
    border-radius: 28px 28px 0 0;
    box-shadow: 0 -12px 40px rgba(33, 29, 24, 0.18);
    padding: var(--space-4) var(--space-4) calc(var(--space-5) + env(safe-area-inset-bottom));
    animation: sheet-in 0.28s cubic-bezier(0.22, 1, 0.36, 1);
  }

  @keyframes sheet-in {
    from {
      transform: translateY(28px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .sheet__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    margin-bottom: var(--space-4);
  }

  .sheet__title {
    margin: 0;
    font-size: 1.375rem;
    font-weight: 800;
    letter-spacing: -0.02em;
  }

  .sheet__close {
    width: 40px;
    height: 40px;
    border: none;
    border-radius: 50%;
    background: transparent;
    color: var(--color-muted);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .sheet__close:hover {
    background: var(--color-background);
    color: var(--color-text);
  }

  .sheet__close svg {
    width: 22px;
    height: 22px;
    stroke: currentColor;
    stroke-width: 2.2;
    fill: none;
    stroke-linecap: round;
  }

  .sheet__form {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .sheet__identity {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-2);
  }

  .sheet__preview {
    width: 76px;
    height: 76px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 2.25rem;
  }

  .sheet__identity-hint {
    color: var(--color-muted);
    font-size: 0.8125rem;
  }

  .sheet__field {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .sheet__label {
    font-weight: 700;
    font-size: 0.9375rem;
    margin: 0;
  }

  .sheet__input {
    font: inherit;
    color: inherit;
    padding: 12px var(--space-4);
    border: 1.5px solid var(--color-border-strong);
    border-radius: var(--radius-button);
    background: var(--color-surface);
    min-height: 48px;
    width: 100%;
  }

  .sheet__input:focus-visible {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(242, 92, 31, 0.14);
  }

  .sheet__input--center {
    text-align: center;
  }

  .sheet__input--textarea {
    resize: vertical;
    min-height: 76px;
  }

  .sheet__icon-grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 6px;
  }

  .sheet__icon {
    aspect-ratio: 1;
    border-radius: 12px;
    border: 1.5px solid var(--color-border);
    background: var(--color-surface);
    font-size: 1.25rem;
    cursor: pointer;
    padding: 0;
  }

  .sheet__icon--active {
    border-color: var(--color-primary);
    background: var(--color-primary-soft);
  }

  .sheet__colors {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
    padding: 2px 0;
  }

  .sheet__color {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: none;
    cursor: pointer;
    padding: 0;
    box-shadow: 0 0 0 1px rgba(33, 29, 24, 0.08);
  }

  .sheet__segments {
    display: flex;
    border: 1.5px solid var(--color-border-strong);
    border-radius: var(--radius-pill);
    overflow: hidden;
  }

  .sheet__segment {
    flex: 1;
    min-height: 46px;
    border: none;
    background: var(--color-surface);
    font: inherit;
    font-weight: 600;
    color: var(--color-muted);
    cursor: pointer;
  }

  .sheet__segment + .sheet__segment {
    border-left: 1.5px solid var(--color-border-strong);
  }

  .sheet__segment--active {
    background: var(--color-primary-soft);
    color: var(--color-primary);
  }

  .sheet__days {
    display: flex;
    gap: 6px;
  }

  .sheet__day {
    flex: 1;
    aspect-ratio: 1;
    max-width: 52px;
    border-radius: 50%;
    border: 1.5px solid var(--color-border-strong);
    background: var(--color-surface);
    font: inherit;
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--color-muted);
    cursor: pointer;
    padding: 0;
  }

  .sheet__day--active {
    color: #ffffff;
  }

  .sheet__hint {
    color: var(--color-muted);
    font-size: 0.8125rem;
    margin: 0;
  }

  .sheet__error {
    color: var(--color-danger);
    font-size: 0.875rem;
    margin: 0;
  }

  .sheet__submit {
    width: 100%;
    min-height: 54px;
    font-size: 1.0625rem;
  }

  .sheet__footer {
    display: flex;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .sheet__link {
    border: none;
    background: transparent;
    font: inherit;
    font-weight: 600;
    color: var(--color-muted);
    cursor: pointer;
    padding: 6px 4px;
  }

  .sheet__link:hover {
    color: var(--color-text);
  }

  .sheet__link--danger {
    color: var(--color-danger);
  }

  @media (min-width: 640px) {
    .sheet {
      align-items: center;
    }

    .sheet__panel {
      border-radius: 28px;
      max-height: 88vh;
      padding: var(--space-5);
    }
  }
</style>
