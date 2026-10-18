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
  const FALLBACK_COLOR = '#7d766e'

  let visibleGroupCount = $state(PAGE_SIZE)

  let habits = $derived(habitsStore.getHabits())
  let completions = $derived(completionsStore.getCompletions())
  let loadError = $derived(habitsStore.getLoadError() ?? completionsStore.getLoadError())
  let loading = $derived(habitsStore.isLoading() || completionsStore.isLoading())

  let habitById = $derived(new Map(habits.map((habit) => [habit.id, habit])))
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
      <section class="card" aria-labelledby="history-streaks">
        <h2 class="section-label" id="history-streaks">Streaks</h2>
        <ul class="streak-list">
          {#each streakRows as row (row.habit.id)}
            <li class="streak-row">
              <span
                class="streak-row__chip"
                style={`background: ${row.habit.color}2e`}
                aria-hidden="true">{row.habit.icon}</span
              >
              <span class="streak-row__name">
                {row.habit.name}
                {#if row.habit.archived}
                  <span class="history-badge">Archived</span>
                {/if}
              </span>
              <span class="streak-row__stats">
                {#if !row.habit.archived}
                  <span class="streak-stat">
                    <span class="streak-stat__value">{row.current}</span>
                    <span class="streak-stat__label">current</span>
                  </span>
                {/if}
                <span class="streak-stat">
                  <span class="streak-stat__value streak-stat__value--muted">{row.longest}</span>
                  <span class="streak-stat__label">best</span>
                </span>
              </span>
            </li>
          {/each}
        </ul>
      </section>
    {/if}

    <section class="history-view__activity" aria-labelledby="history-activity">
      <h2 class="section-label history-view__heading" id="history-activity">History</h2>
      <ul class="history-view__days">
        {#each visibleDays as day (day.dateKey)}
          <li class="card day-group">
            <div class="day-group__header">
              <h3 class="day-group__date">{formatDayLabel(day.dateKey, today)}</h3>
              <p class="day-group__count">
                {day.entries.length}
                {day.entries.length === 1 ? 'completion' : 'completions'}
              </p>
            </div>
            <ul class="day-group__list">
              {#each day.entries as entry (entry.id)}
                {@const habit = habitById.get(entry.habitId)}
                <li class="day-group__item">
                  <span
                    class="day-group__check"
                    style={`background: ${(habit?.color ?? FALLBACK_COLOR)}2e`}
                    aria-hidden="true"
                  >
                    <svg viewBox="0 0 24 24" focusable="false">
                      <path
                        d="M5 12.5 L10 17.5 L19 7.5"
                        stroke={habit?.color ?? FALLBACK_COLOR}
                      />
                    </svg>
                  </span>
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

  .history-view__activity {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .history-view__heading {
    margin-left: var(--space-1);
  }

  .streak-list {
    list-style: none;
    margin: var(--space-3) 0 0;
    padding: 0;
    display: flex;
    flex-direction: column;
  }

  .streak-row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-2) 0;
    border-top: 1px solid var(--color-border);
  }

  .streak-row:first-child {
    border-top: none;
    padding-top: 0;
  }

  .streak-row:last-child {
    padding-bottom: 0;
  }

  .streak-row__chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 12px;
    font-size: 1.125rem;
    line-height: 1;
    flex-shrink: 0;
  }

  .streak-row__name {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-width: 0;
    font-weight: 600;
  }

  .streak-row__stats {
    display: flex;
    gap: var(--space-4);
    margin-left: auto;
    flex-shrink: 0;
  }

  .streak-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 44px;
  }

  .streak-stat__value {
    font-size: 1.0625rem;
    font-weight: 800;
    color: var(--color-primary);
    font-variant-numeric: tabular-nums;
  }

  .streak-stat__value--muted {
    color: var(--color-muted);
  }

  .streak-stat__label {
    font-size: 0.6875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-muted);
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
    font-weight: 500;
  }

  .history-view__days {
    list-style: none;
    margin: 0;
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
    font-size: 1rem;
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
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 999px;
    flex-shrink: 0;
  }

  .day-group__check svg {
    width: 14px;
    height: 14px;
    fill: none;
    stroke-width: 3;
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
