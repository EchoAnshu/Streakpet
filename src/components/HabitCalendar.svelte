<script lang="ts">
  import { untrack } from 'svelte'
  import { buildMonthGrid } from '../domain/calendar'
  import { getLocalDateKey } from '../domain/dates'

  interface Props {
    scheduledDays: number[]
    completedDates: Set<string>
    color: string
    today: Date
    onToggleDay: (dateKey: string) => void
  }

  let { scheduledDays, completedDates, color, today, onToggleDay }: Props = $props()

  const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  let cursor = $state(untrack(() => new Date(today.getFullYear(), today.getMonth(), 1)))
  let todayKey = $derived(getLocalDateKey(today))
  let cells = $derived(buildMonthGrid(cursor.getFullYear(), cursor.getMonth()))
  let label = $derived(cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }))
  let canGoNext = $derived(
    cursor.getFullYear() < today.getFullYear() ||
      (cursor.getFullYear() === today.getFullYear() && cursor.getMonth() < today.getMonth())
  )

  function shiftMonth(delta: number) {
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1)
  }

  function cellState(key: string, date: Date): 'done' | 'due' | 'off' | 'future' {
    if (key > todayKey) return 'future'
    if (!scheduledDays.includes(date.getDay())) return 'off'
    return completedDates.has(key) ? 'done' : 'due'
  }
</script>

<div class="calendar">
  <header class="calendar__header">
    <button
      type="button"
      class="calendar__nav"
      aria-label="Previous month"
      onclick={() => shiftMonth(-1)}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M14.5 5.5 8 12l6.5 6.5" />
      </svg>
    </button>
    <p class="calendar__label">{label}</p>
    <button
      type="button"
      class="calendar__nav"
      aria-label="Next month"
      disabled={!canGoNext}
      onclick={() => shiftMonth(1)}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M9.5 5.5 16 12l-6.5 6.5" />
      </svg>
    </button>
  </header>

  <div class="calendar__weekdays" aria-hidden="true">
    {#each DAY_LETTERS as letter, index (index)}
      <span>{letter}</span>
    {/each}
  </div>

  <div class="calendar__grid">
    {#each cells as cell (cell.key)}
      {@const state = cellState(cell.key, cell.date)}
      <button
        type="button"
        class="calendar__cell"
        class:calendar__cell--outside={!cell.inMonth}
        class:calendar__cell--done={state === 'done'}
        class:calendar__cell--today={cell.key === todayKey}
        style={state === 'done' ? `background:${color};border-color:${color};color:#ffffff` : undefined}
        disabled={!cell.inMonth || state === 'future' || state === 'off'}
        aria-pressed={state === 'done'}
        aria-label={cell.date.toLocaleDateString(undefined, {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })}
        onclick={() => onToggleDay(cell.key)}
      >
        {cell.date.getDate()}
      </button>
    {/each}
  </div>
</div>

<style>
  .calendar {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .calendar__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
  }

  .calendar__label {
    font-weight: 700;
    font-size: 1rem;
  }

  .calendar__nav {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: none;
    background: transparent;
    color: var(--color-muted);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .calendar__nav:hover:not(:disabled) {
    background: var(--color-background);
    color: var(--color-text);
  }

  .calendar__nav:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .calendar__nav svg {
    width: 20px;
    height: 20px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2.2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .calendar__weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
    color: var(--color-muted);
    font-size: 0.75rem;
    text-align: center;
  }

  .calendar__grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
  }

  .calendar__cell {
    width: 100%;
    max-width: 46px;
    aspect-ratio: 1;
    justify-self: center;
    border-radius: 50%;
    border: 1.5px solid transparent;
    background: transparent;
    font: inherit;
    font-size: 0.9375rem;
    color: var(--color-text);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
    transition: background 0.12s ease;
  }

  .calendar__cell:disabled {
    cursor: default;
  }

  .calendar__cell--outside {
    visibility: hidden;
  }

  .calendar__cell:not(:disabled):not(.calendar__cell--done):hover {
    background: var(--color-primary-soft);
  }

  .calendar__cell--done {
    font-weight: 700;
  }

  .calendar__cell--today {
    border-color: var(--color-primary);
  }

  .calendar__cell--done.calendar__cell--today {
    border-color: #ffffff;
  }
</style>
