<script lang="ts">
  import type { Completion, Habit } from '../types/models'
  import { getLocalDateKey } from '../domain/dates'

  interface Props {
    habits: Habit[]
    completions: Completion[]
    today: Date
  }

  let { habits, completions, today }: Props = $props()

  const LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  const MAX_BARS = 6

  interface Bar {
    color: string
    filled: boolean
  }

  interface Column {
    key: string
    letter: string
    bars: Bar[]
    placeholder: boolean
    isToday: boolean
    label: string
  }

  let todayKey = $derived(getLocalDateKey(today))
  let completedKeys = $derived(new Set(completions.map((item) => `${item.habitId}:${item.date}`)))

  let columns = $derived.by<Column[]>(() => {
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const offset = (start.getDay() + 6) % 7
    start.setDate(start.getDate() - offset)

    const result: Column[] = []
    for (let index = 0; index < 7; index += 1) {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index)
      const key = getLocalDateKey(date)
      const future = key > todayKey
      const scheduled = habits
        .filter((habit) => habit.scheduledDays.includes(date.getDay()))
        .slice(0, MAX_BARS)
      const bars: Bar[] = scheduled.map((habit) => ({
        color: habit.color,
        filled: completedKeys.has(`${habit.id}:${key}`),
      }))
      const doneCount = bars.filter((bar) => bar.filled).length
      const weekday = date.toLocaleDateString(undefined, { weekday: 'long' })
      result.push({
        key,
        letter: LETTERS[index],
        bars,
        placeholder: future || bars.length === 0,
        isToday: key === todayKey,
        label: future
          ? weekday
          : `${weekday}: ${doneCount} of ${bars.length} completed`,
      })
    }
    return result
  })
</script>

<section class="week-pulse card" aria-label="This week">
  {#each columns as column (column.key)}
    <div class="week-pulse__column" title={column.label}>
      <div class="week-pulse__bars" aria-hidden="true">
        {#if column.placeholder}
          <span class="week-pulse__bar week-pulse__bar--empty"></span>
        {:else}
          {#each column.bars as bar, barIndex (barIndex)}
            <span
              class="week-pulse__bar"
              style={`background:${bar.filled ? bar.color : `${bar.color}26`}`}
            ></span>
          {/each}
        {/if}
      </div>
      <span class="week-pulse__letter" class:week-pulse__letter--today={column.isToday}>
        {column.letter}
      </span>
    </div>
  {/each}
</section>

<style>
  .week-pulse {
    display: flex;
    gap: 8px;
    padding: var(--space-4) var(--space-3) var(--space-2);
  }

  .week-pulse__column {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-2);
  }

  .week-pulse__bars {
    min-height: 86px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 5px;
  }

  .week-pulse__bar {
    height: 11px;
    border-radius: 6px;
    background: var(--color-border);
  }

  .week-pulse__bar--empty {
    background: var(--color-border);
  }

  .week-pulse__letter {
    text-align: center;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-muted);
  }

  .week-pulse__letter--today {
    color: var(--color-primary);
  }
</style>
