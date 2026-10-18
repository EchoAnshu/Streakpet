<script lang="ts">
  import type { Habit } from '../types/models'
  import { formatFrequency } from '../domain/habits'
  import { burstConfetti } from '../lib/confetti'
  import { playCelebrate, playComplete, playUndo } from '../lib/sound'

  interface Props {
    habit: Habit
    completed: boolean
    completionEnabled: boolean
    streak: number
    willCompleteDay: boolean
    onToggleComplete: (habit: Habit) => void
    onEdit: (habit: Habit) => void
  }

  let {
    habit,
    completed,
    completionEnabled,
    streak,
    willCompleteDay,
    onToggleComplete,
    onEdit,
  }: Props = $props()

  let streakLabel = $derived(streak > 0 ? `${streak} day${streak === 1 ? '' : 's'}` : null)
  let frequencyLabel = $derived(formatFrequency(habit.scheduledDays))
  let metaText = $derived(completed ? (streakLabel ?? frequencyLabel) : frequencyLabel)
  let showEndsToday = $derived(!completed && streak > 0)

  function handleCheckClick(event: MouseEvent) {
    if (completed) {
      playUndo()
    } else {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
      const origin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
      if (willCompleteDay) {
        playCelebrate()
        burstConfetti(origin, [habit.color, '#f25c1f', '#f5a524'], 56)
      } else {
        playComplete()
        burstConfetti(origin, [habit.color, '#f25c1f'], 24)
      }
    }
    onToggleComplete(habit)
  }
</script>

<li
  class="habit-card"
  class:habit-card--completed={completed}
  style={`background:${completed ? `${habit.color}14` : 'var(--color-surface)'}; border-color:${
    completed ? `${habit.color}59` : 'var(--color-border)'
  }`}
>
  <button
    type="button"
    class="habit-card__main"
    aria-label={`Edit ${habit.name}`}
    onclick={() => onEdit(habit)}
  >
    <span class="habit-card__icon" aria-hidden="true" style={`background:${habit.color}2e`}>
      {habit.icon}
    </span>
    <span class="habit-card__text">
      <span class="habit-card__name">{habit.name}</span>
      <span class="habit-card__meta">
        {#if showEndsToday}
          {streakLabel}<span class="habit-card__ends"> · ends today!</span>
        {:else}
          {metaText}
        {/if}
      </span>
    </span>
  </button>

  <button
    type="button"
    class="habit-card__check"
    class:habit-card__check--done={completed}
    aria-pressed={completed}
    aria-label={completed ? `Undo completion for ${habit.name}` : `Complete ${habit.name}`}
    disabled={!completionEnabled}
    title={completionEnabled ? undefined : 'Saving…'}
    style={completed ? `background:${habit.color};border-color:${habit.color}` : undefined}
    onclick={handleCheckClick}
  >
    {#if completed}
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M5 12.5 10 17.5 19 7.5" />
      </svg>
    {/if}
  </button>
</li>

<style>
  .habit-card {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-card);
    box-shadow: var(--shadow-card);
    padding: 10px 14px 10px 10px;
    transition: background 0.2s ease, border-color 0.2s ease;
  }

  .habit-card__main {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: var(--space-3);
    border: none;
    background: transparent;
    font: inherit;
    color: inherit;
    text-align: left;
    padding: 6px 4px;
    border-radius: var(--radius-button);
    cursor: pointer;
  }

  .habit-card__icon {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 1.6rem;
    flex-shrink: 0;
  }

  .habit-card__text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .habit-card__name {
    font-weight: 700;
    font-size: 1.0625rem;
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .habit-card__meta {
    color: var(--color-muted);
    font-size: 0.9375rem;
  }

  .habit-card__ends {
    color: var(--color-primary);
    font-weight: 600;
  }

  .habit-card__check {
    width: 54px;
    height: 54px;
    flex-shrink: 0;
    border-radius: 50%;
    border: 1.5px solid var(--color-border-strong);
    background: transparent;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
    transition: border-color 0.15s ease, background 0.15s ease;
  }

  .habit-card__check:not(.habit-card__check--done):hover {
    border-color: var(--color-primary);
  }

  .habit-card__check:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .habit-card__check--done {
    animation: check-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .habit-card__check svg {
    width: 26px;
    height: 26px;
    stroke: #ffffff;
    stroke-width: 3;
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  @keyframes check-pop {
    0% {
      transform: scale(0.72);
    }
    60% {
      transform: scale(1.1);
    }
    100% {
      transform: scale(1);
    }
  }
</style>
