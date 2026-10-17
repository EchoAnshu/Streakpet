<script lang="ts">
  import type { Habit } from '../types/models'
  import { formatSchedule } from '../domain/habits'

  interface Props {
    habit: Habit
    completed: boolean
    completionEnabled: boolean
    onToggleComplete: (habit: Habit) => void
    onEdit: (habit: Habit) => void
    onArchive: (habit: Habit) => void
  }

  let { habit, completed, completionEnabled, onToggleComplete, onEdit, onArchive }: Props = $props()

  let scheduleLabel = $derived(formatSchedule(habit.scheduledDays))
</script>

<li class="habit-item" class:habit-item--completed={completed}>
  <button
    type="button"
    class="habit-item__check"
    aria-pressed={completed}
    aria-label={completed ? `Undo completion for ${habit.name}` : `Complete ${habit.name}`}
    disabled={!completionEnabled}
    title={completionEnabled ? undefined : 'Completion tracking arrives in the next update'}
    onclick={() => onToggleComplete(habit)}
  >
    {#if completed}
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M5 12.5 L10 17.5 L19 7.5" />
      </svg>
    {/if}
  </button>

  <div class="habit-item__body">
    <p class="habit-item__name">{habit.name}</p>
    {#if habit.description}
      <p class="habit-item__description">{habit.description}</p>
    {/if}
    <p class="habit-item__schedule">{scheduleLabel}</p>
  </div>

  <div class="habit-item__actions">
    <button
      type="button"
      class="button button--ghost button--small"
      aria-label={`Edit ${habit.name}`}
      onclick={() => onEdit(habit)}
    >
      Edit
    </button>
    <button
      type="button"
      class="button button--ghost button--small"
      aria-label={`Archive ${habit.name}`}
      onclick={() => onArchive(habit)}
    >
      Archive
    </button>
  </div>
</li>

<style>
  .habit-item {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-card);
    padding: var(--space-3) var(--space-4);
    box-shadow: var(--shadow-card);
  }

  .habit-item--completed {
    background: var(--color-primary-soft);
  }

  .habit-item__check {
    width: 44px;
    height: 44px;
    flex-shrink: 0;
    border-radius: 50%;
    border: 2px solid var(--color-border);
    background: var(--color-surface);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
  }

  .habit-item__check:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  .habit-item--completed .habit-item__check {
    background: var(--color-success);
    border-color: var(--color-success);
    opacity: 1;
  }

  .habit-item__check svg {
    width: 20px;
    height: 20px;
    stroke: var(--color-surface);
    stroke-width: 2.5;
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .habit-item__body {
    flex: 1;
    min-width: 0;
  }

  .habit-item__name {
    font-weight: 600;
  }

  .habit-item--completed .habit-item__name {
    text-decoration: line-through;
  }

  .habit-item__description {
    color: var(--color-muted);
    font-size: 0.875rem;
  }

  .habit-item__schedule {
    color: var(--color-muted);
    font-size: 0.8125rem;
    margin-top: var(--space-1);
  }

  .habit-item__actions {
    display: flex;
    gap: var(--space-1);
    flex-shrink: 0;
  }

  @media (max-width: 480px) {
    .habit-item {
      flex-wrap: wrap;
    }

    .habit-item__actions {
      width: 100%;
      justify-content: flex-end;
    }
  }
</style>
