<script lang="ts">
  import type { Habit } from '../types/models'
  import EmptyState from '../components/EmptyState.svelte'
  import HabitForm from '../components/HabitForm.svelte'
  import HabitItem from '../components/HabitItem.svelte'
  import PetPanel from '../components/PetPanel.svelte'
  import ProgressSummary from '../components/ProgressSummary.svelte'
  import { getLocalDateKey } from '../domain/dates'
  import { isScheduledForDate, type HabitInput } from '../domain/habits'
  import { calculateCurrentStreak } from '../domain/streaks'
  import { recalculateDailyBonus } from '../data/completionRepository'
  import * as completionsStore from '../stores/completions.svelte'
  import * as habitsStore from '../stores/habits.svelte'
  import * as petStore from '../stores/pet.svelte'

  const today = new Date()
  const todayKey = getLocalDateKey(today)

  let editing = $state<Habit | null | undefined>(undefined)
  let actionError = $state<string | null>(null)
  let togglingIds = $state<string[]>([])

  let active = $derived(habitsStore.activeHabits())
  let scheduledToday = $derived(active.filter((habit) => isScheduledForDate(habit, today)))
  let completedToday = $derived(
    completionsStore.completedCountFor(
      todayKey,
      scheduledToday.map((habit) => habit.id)
    )
  )
  let loadError = $derived(
    habitsStore.getLoadError() ?? completionsStore.getLoadError() ?? petStore.getLoadError()
  )
  let loading = $derived(
    habitsStore.isLoading() || completionsStore.isLoading() || petStore.isLoading()
  )

  function retryLoad() {
    habitsStore.loadHabits(true)
    completionsStore.loadCompletions(true)
    petStore.loadRewards(true)
  }

  function startAdd() {
    actionError = null
    editing = null
  }

  function startEdit(habit: Habit) {
    actionError = null
    editing = habit
  }

  function closeForm() {
    editing = undefined
  }

  async function handleSave(input: HabitInput) {
    if (editing) {
      await habitsStore.updateHabit(editing.id, input)
    } else {
      await habitsStore.createHabit(input)
    }
    editing = undefined
  }

  async function handleArchive(habit: Habit) {
    const confirmed = window.confirm(`Archive "${habit.name}"? Its completion history is kept.`)
    if (!confirmed) return
    actionError = null
    try {
      await habitsStore.archiveHabit(habit.id)
      if (isScheduledForDate(habit, today)) {
        petStore.setRewards(await recalculateDailyBonus(todayKey))
      }
    } catch (error) {
      actionError = error instanceof Error ? error.message : 'Could not archive the habit.'
    }
  }

  async function handleToggleComplete(habit: Habit) {
    if (togglingIds.includes(habit.id)) return
    togglingIds = [...togglingIds, habit.id]
    actionError = null
    try {
      await completionsStore.toggleCompletion(habit, todayKey)
    } catch (error) {
      actionError = error instanceof Error ? error.message : 'Could not update the completion.'
    } finally {
      togglingIds = togglingIds.filter((id) => id !== habit.id)
    }
  }
</script>

<div class="today-view">
  <PetPanel totalXp={petStore.getTotalXp()} stage={petStore.getStage()} />

  {#if loading}
    <p class="today-view__status">Loading your habits…</p>
  {:else if loadError}
    <div class="today-view__error card" role="alert">
      <p>{loadError}</p>
      <button type="button" class="button button--primary" onclick={retryLoad}>Try again</button>
    </div>
  {:else}
    <ProgressSummary completed={completedToday} total={scheduledToday.length} />

    {#if active.length === 0}
      <EmptyState
        title="No habits yet"
        message="Add your first habit to start building streaks."
        actionLabel="Add your first habit"
        onAction={startAdd}
      />
    {:else if scheduledToday.length === 0}
      <EmptyState
        title="Nothing scheduled today"
        message="No habits are due today. Add another habit or enjoy the day off."
        actionLabel="Add a habit"
        onAction={startAdd}
      />
    {:else}
      <ul class="today-view__list">
        {#each scheduledToday as habit (habit.id)}
          <HabitItem
            {habit}
            completed={completionsStore.isCompleted(habit.id, todayKey)}
            completionEnabled={!togglingIds.includes(habit.id)}
            streak={calculateCurrentStreak(habit, completionsStore.getCompletions(), today)}
            onToggleComplete={handleToggleComplete}
            onEdit={startEdit}
            onArchive={handleArchive}
          />
        {/each}
      </ul>
      <button type="button" class="button button--primary today-view__add" onclick={startAdd}>
        Add habit
      </button>
    {/if}

    {#if actionError}
      <p class="today-view__action-error" role="alert">{actionError}</p>
    {/if}

    {#if editing !== undefined}
      <HabitForm habit={editing} onSave={handleSave} onCancel={closeForm} />
    {/if}
  {/if}
</div>

<style>
  .today-view {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .today-view__status {
    color: var(--color-muted);
  }

  .today-view__error {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-3);
  }

  .today-view__list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .today-view__add {
    align-self: stretch;
  }

  .today-view__action-error {
    color: var(--color-danger);
    font-size: 0.875rem;
  }

  @media (min-width: 768px) {
    .today-view__add {
      align-self: flex-start;
    }
  }
</style>
