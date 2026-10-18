<script lang="ts">
  import type { Completion, Habit } from '../types/models'
  import { formatFrequency, formatReminder } from '../domain/habits'
  import { calculateCurrentStreak, calculateLongestStreak } from '../domain/streaks'
  import { playComplete, playUndo } from '../lib/sound'
  import ActivityHeatmap from './ActivityHeatmap.svelte'
  import HabitCalendar from './HabitCalendar.svelte'

  interface Props {
    habit: Habit
    completions: Completion[]
    today: Date
    active: boolean
    onClose: () => void
    onEdit: (habit: Habit) => void
    onArchive: (habit: Habit) => void
    onToggleDay: (dateKey: string) => void
  }

  let { habit, completions, today, active, onClose, onEdit, onArchive, onToggleDay }: Props =
    $props()

  let current = $derived(calculateCurrentStreak(habit, completions, today))
  let best = $derived(calculateLongestStreak(habit, completions, today))
  let completedDates = $derived(
    new Set(
      completions.filter((item) => item.habitId === habit.id).map((item) => item.date)
    )
  )
  let frequency = $derived(formatFrequency(habit.scheduledDays))
  let reminderLabel = $derived(habit.reminder ? formatReminder(habit.reminder) : null)
  let year = $derived(today.getFullYear())

  function handleDayToggle(dateKey: string) {
    if (completedDates.has(dateKey)) {
      playUndo()
    } else {
      playComplete()
    }
    onToggleDay(dateKey)
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && active) onClose()
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="detail" role="dialog" aria-modal="true" aria-label={`${habit.name} details`}>
  <header class="detail__topbar">
    <button type="button" class="detail__back" aria-label="Back" onclick={onClose}>
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M14.5 5.5 8 12l6.5 6.5" />
      </svg>
    </button>
  </header>

  <div class="detail__content">
    <div class="detail__hero">
      <span class="detail__icon" aria-hidden="true" style={`background:${habit.color}2e`}>
        {habit.icon}
      </span>
      <h1 class="detail__name">{habit.name}</h1>
      <p class="detail__frequency">{frequency}</p>
      <span class="detail__divider" aria-hidden="true" style={`background:${habit.color}`}></span>
    </div>

    <div class="detail__stats">
      <div class="detail__stat">
        <p class="detail__stat-number">
          {current}<span class="detail__stat-unit">{current === 1 ? 'day' : 'days'}</span>
        </p>
        <p class="detail__stat-label">Current streak</p>
      </div>
      <div class="detail__stat">
        <p class="detail__stat-number">
          {best}<span class="detail__stat-unit">{best === 1 ? 'day' : 'days'}</span>
        </p>
        <p class="detail__stat-label">Best streak</p>
      </div>
    </div>

    <section class="card">
      <HabitCalendar
        scheduledDays={habit.scheduledDays}
        {completedDates}
        color={habit.color}
        {today}
        onToggleDay={handleDayToggle}
      />
    </section>

    <section class="card">
      <h2 class="detail__section-title">{year} activity</h2>
      <ActivityHeatmap
        {year}
        color={habit.color}
        scheduledDays={habit.scheduledDays}
        {completedDates}
        {today}
      />
    </section>

    <section class="card">
      <h2 class="detail__section-title">Manage</h2>
      {#if reminderLabel}
        <p class="detail__meta">Reminder: {reminderLabel}</p>
      {/if}
      {#if habit.note}
        <p class="detail__note">{habit.note}</p>
      {/if}
      <div class="detail__actions">
        <button type="button" class="button button--ghost" onclick={() => onEdit(habit)}>
          Edit habit
        </button>
        <button type="button" class="button detail__archive" onclick={() => onArchive(habit)}>
          Archive
        </button>
      </div>
    </section>
  </div>
</div>

<style>
  .detail {
    position: fixed;
    inset: 0;
    z-index: 50;
    background: var(--color-background);
    overflow-y: auto;
    padding: 0 var(--space-4) calc(40px + env(safe-area-inset-bottom));
  }

  .detail__topbar {
    position: sticky;
    top: 0;
    z-index: 2;
    background: var(--color-background);
    padding: var(--space-3) 0 var(--space-2);
    max-width: var(--content-width);
    margin: 0 auto;
  }

  .detail__back {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: none;
    background: var(--color-surface);
    box-shadow: var(--shadow-card);
    color: var(--color-text);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .detail__back svg {
    width: 22px;
    height: 22px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2.2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .detail__content {
    max-width: var(--content-width);
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .detail__hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-2);
    text-align: center;
    padding-top: var(--space-2);
  }

  .detail__icon {
    width: 92px;
    height: 92px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 2.75rem;
  }

  .detail__name {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 800;
    letter-spacing: -0.02em;
  }

  .detail__frequency {
    color: var(--color-muted);
    font-size: 0.9375rem;
  }

  .detail__divider {
    width: 64px;
    height: 3px;
    border-radius: 999px;
    margin-top: var(--space-1);
  }

  .detail__stats {
    display: flex;
    justify-content: space-around;
    gap: var(--space-4);
    padding: var(--space-2) 0;
  }

  .detail__stat {
    text-align: center;
  }

  .detail__stat-number {
    font-size: 2.5rem;
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1.1;
  }

  .detail__stat-unit {
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--color-muted);
    margin-left: 6px;
  }

  .detail__stat-label {
    color: var(--color-muted);
    font-size: 0.875rem;
    margin-top: var(--space-1);
  }

  .detail__section-title {
    font-size: 1.0625rem;
    font-weight: 800;
    margin: 0 0 var(--space-3);
  }

  .detail__meta {
    color: var(--color-muted);
    font-size: 0.875rem;
    margin-bottom: var(--space-2);
  }

  .detail__note {
    font-size: 0.9375rem;
    margin-bottom: var(--space-3);
  }

  .detail__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin-top: var(--space-2);
  }

  .detail__archive {
    color: var(--color-danger);
    border-color: rgba(214, 69, 69, 0.35);
  }

  .detail__archive:hover {
    border-color: var(--color-danger);
  }
</style>
