<script lang="ts">
  import { buildActivityMonthLabels, buildActivityWeeks } from '../domain/calendar'
  import { getLocalDateKey } from '../domain/dates'

  interface Props {
    year: number
    color: string
    scheduledDays: number[]
    completedDates: Set<string>
    today: Date
  }

  let { year, color, scheduledDays, completedDates, today }: Props = $props()

  let todayKey = $derived(getLocalDateKey(today))
  let weeks = $derived(buildActivityWeeks(year))
  let labels = $derived(buildActivityMonthLabels(weeks))

  function isFilled(key: string, weekday: number): boolean {
    if (key > todayKey) return false
    if (!scheduledDays.includes(weekday)) return false
    return completedDates.has(key)
  }
</script>

<div class="heatmap" role="img" aria-label={`Activity in ${year}`}>
  <div class="heatmap__months" aria-hidden="true">
    {#each labels as item, index (index)}
      <span class="heatmap__month" style={`flex-grow:${item.span}`}>{item.label}</span>
    {/each}
  </div>

  <div class="heatmap__scroll">
    <div class="heatmap__grid">
      {#each weeks as week (week.key)}
        {#each week.cells as cell (cell.key)}
          <span
            class="heatmap__cell"
            style={isFilled(cell.key, cell.date.getDay()) ? `background:${color}` : undefined}
          ></span>
        {/each}
      {/each}
    </div>
  </div>

  <div class="heatmap__legend" aria-hidden="true">
    <span>Less</span>
    <span class="heatmap__swatch"></span>
    <span class="heatmap__swatch" style={`background:${color}`}></span>
    <span>More</span>
  </div>
</div>

<style>
  .heatmap {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .heatmap__months {
    display: flex;
    font-size: 0.6875rem;
    color: var(--color-muted);
    padding-left: 1px;
  }

  .heatmap__month {
    min-width: 0;
    white-space: nowrap;
    overflow: visible;
  }

  .heatmap__scroll {
    overflow-x: auto;
    padding-bottom: var(--space-1);
    -webkit-overflow-scrolling: touch;
  }

  .heatmap__grid {
    display: grid;
    grid-auto-flow: column;
    grid-template-rows: repeat(7, 12px);
    gap: 3px;
    width: max-content;
  }

  .heatmap__cell {
    width: 12px;
    height: 12px;
    border-radius: 3.5px;
    background: var(--color-heat-empty);
  }

  .heatmap__legend {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 5px;
    font-size: 0.6875rem;
    color: var(--color-muted);
  }

  .heatmap__swatch {
    width: 12px;
    height: 12px;
    border-radius: 3.5px;
    background: var(--color-heat-empty);
  }
</style>
