<script lang="ts">
  import EmptyState from '../components/EmptyState.svelte'
  import { getLocalDateKey } from '../domain/dates'
  import { formatDayLabel, groupCompletionsByDate } from '../domain/history'
  import { calculateCurrentStreak, calculateLongestStreak } from '../domain/streaks'
  import * as completionsStore from '../stores/completions.svelte'
  import * as habitsStore from '../stores/habits.svelte'

  const today = new Date()
  const todayKey = getLocalDateKey(today)
  const PAGE_SIZE = 10

  let visibleGroupCount = $state(PAGE_SIZE)

  let habits = $derived(habitsStore.getHabits())
  let completions = $derived(completionsStore.getCompletions())
  let loadError = $derived(habitsStore.getLoadError() ?? completionsStore.getLoadError())
  let loading = $derived(habitsStore.isLoading() || completionsStore.isLoading())

  let days = $derived(groupCompletionsByDate(completions, habits))
  let visibleDays = $derived(days.slice(0, visibleGroupCount))

  let streakRows = $derived(
    [...habits]
      .sort((a, b) => Number(a.archived) - Number(b.archived) || a.createdAt - b.createdAt)
      .map((habit) => ({
        habit,
        current: habit.archived ? 0 : calculateCurrentStreak(habit, completions, today),
        longest: calculateLongestStreak(habit, completions, today),
      }))
  )

  function retryLoad() {
    habitsStore.loadHabits(true)
    completionsStore.loadCompletions(true)
  }

  function showEarlierDays() {
    visibleGroupCount += PAGE_SIZE
  }
</script>

<div class="history-view">
  {#if loading}
    <p class="history-view__status">Loading your history…</p>
  {:else if loadError}
    <div class="history-view__error card" role="alert">
      <p>{loadError}</p>
      <button type="button" class="button button--primary" onclick={retryLoad}>Try again</button>
    </div>
  {:else if days.length === 0}
    <EmptyState
      title="No history yet"
      message="Completed habits will appear here after you start tracking. Finish a habit on the Today screen to begin."
    />
  {:else}
    {#if streakRows.length > 0}
      <section class="card history-view__streaks" aria-labelledby="history-streaks">
        <h2 class="history-view__title" id="history-streaks">Streaks</h2>
        <ul class="history-view__streak-list">
          {#each streakRows as row (row.habit.id)}
            <li class="streak-row">
              <span class="streak-row__name">
                {row.habit.name}
                {#if row.habit.archived}
                  <span class="history-badge">Archived</span>
                {/if}
              </span>
              <span class="streak-row__values">
                {#if row.habit.archived}
                  <span>Longest {row.longest}</span>
                {:else}
                  <span>Current {row.current}</span>
                  <span>Longest {row.longest}</span>
                {/if}
              </span>
            </li>
          {/each}
        </ul>
      </section>
    {/if}

    <section aria-labelledby="history-activity">
      <h2 class="history-view__title" id="history-activity">Completion history</h2>
      <ul class="history-view__days">
        {#each visibleDays as day (day.dateKey)}
          <li class="card day-group">
            <div class="day-group__header">
              <h3 class="day-group__date">{formatDayLabel(day.dateKey, today)}</h3>
              <p class="day-group__count">
                {day.entries.length}
                {day.entries.length === 1 ? 'habit completed' : 'habits completed'}
              </p>
            </div>
            <ul class="day-group__list">
              {#each day.entries as entry (entry.id)}
                <li class="day-group__item">
                  <svg
                    class="day-group__check"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path d="M5 12.5 L10 17.5 L19 7.5" />
                  </svg>
                  <span class="day-group__name">{entry.name}</span>
                  {#if entry.archived}
                    <span class="history-badge">Archived</span>
                  {/if}
                </li>
              {/each}
            </ul>
          </li>
        {/each}
      </ul>

      {#if days.length > visibleGroupCount}
        <button type="button" class="button button--ghost history-view__more" onclick={showEarlierDays}>
          Show earlier days
        </button>
      {/if}
    </section>
  {/if}
</div>

<style>
  .history-view {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .history-view__status {
    color: var(--color-muted);
  }

  .history-view__error {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-3);
  }

  .history-view__title {
    font-size: 1.0625rem;
  }

  .history-view__streak-list {
    list-style: none;
    margin: var(--space-2) 0 0;
    padding: 0;
    display: flex;
    flex-direction: column;
  }

  .streak-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-2) 0;
    border-top: 1px solid var(--color-border);
  }

  .streak-row:first-child {
    border-top: none;
  }

  .streak-row__name {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-width: 0;
  }

  .streak-row__values {
    display: flex;
    gap: var(--space-3);
    color: var(--color-muted);
    font-size: 0.875rem;
    flex-shrink: 0;
  }

  .history-badge {
    display: inline-block;
    padding: 1px var(--space-2);
    border-radius: 999px;
    border: 1px solid var(--color-border);
    background: var(--color-background);
    color: var(--color-muted);
    font-size: 0.75rem;
    line-height: 1.4;
    flex-shrink: 0;
  }

  .history-view__days {
    list-style: none;
    margin: var(--space-2) 0 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .day-group__header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-3);
    flex-wrap: wrap;
  }

  .day-group__date {
    font-size: 0.9375rem;
    margin: 0;
  }

  .day-group__count {
    color: var(--color-muted);
    font-size: 0.8125rem;
  }

  .day-group__list {
    list-style: none;
    margin: var(--space-2) 0 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .day-group__item {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-1) 0;
  }

  .day-group__check {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    stroke: var(--color-success);
    stroke-width: 2.5;
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .day-group__name {
    min-width: 0;
  }

  .history-view__more {
    align-self: stretch;
    margin-top: var(--space-3);
  }

  @media (min-width: 768px) {
    .history-view__more {
      align-self: flex-start;
    }
  }
</style>
