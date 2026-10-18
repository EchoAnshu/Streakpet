<script lang="ts">
  import type { Habit } from '../types/models'
  import EmptyState from '../components/EmptyState.svelte'
  import HabitDetail from '../components/HabitDetail.svelte'
  import HabitForm from '../components/HabitForm.svelte'
  import HabitItem from '../components/HabitItem.svelte'
  import PetCompanion from '../components/PetCompanion.svelte'
  import WeekPulse from '../components/WeekPulse.svelte'
  import { getLocalDateKey } from '../domain/dates'
  import { isScheduledForDate, defaultColorFor, type HabitInput } from '../domain/habits'
  import { calculateCurrentStreak } from '../domain/streaks'
  import * as completionsStore from '../stores/completions.svelte'
  import * as habitsStore from '../stores/habits.svelte'
  import * as petStore from '../stores/pet.svelte'

  interface Props {
    onOpenPet: () => void
  }

  let { onOpenPet }: Props = $props()

  const today = new Date()
  const todayKey = getLocalDateKey(today)

  let editing = $state<Habit | null | undefined>(undefined)
  let selectedId = $state<string | null>(null)
  let actionError = $state<string | null>(null)
  let togglingIds = $state<string[]>([])

  let active = $derived(habitsStore.activeHabits())
  let completions = $derived(completionsStore.getCompletions())
  let scheduledToday = $derived(active.filter((habit) => isScheduledForDate(habit, today)))
  let completedToday = $derived(
    completionsStore.completedCountFor(
      todayKey,
      scheduledToday.map((habit) => habit.id)
    )
  )
  let selectedHabit = $derived(
    selectedId === null ? null : (active.find((habit) => habit.id === selectedId) ?? null)
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
    petStore.loadPet(true)
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

  function openDetail(habit: Habit) {
    actionError = null
    selectedId = habit.id
  }

  function closeDetail() {
    selectedId = null
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
      editing = undefined
      selectedId = null
    } catch (error) {
      actionError = error instanceof Error ? error.message : 'Could not archive the habit.'
    }
  }

  async function toggleFor(habit: Habit, dateKey: string) {
    if (togglingIds.includes(habit.id)) return
    togglingIds = [...togglingIds, habit.id]
    actionError = null
    try {
      await completionsStore.toggleCompletion(habit, dateKey)
    } catch (error) {
      actionError = error instanceof Error ? error.message : 'Could not update the completion.'
    } finally {
      togglingIds = togglingIds.filter((id) => id !== habit.id)
    }
  }

  async function handleToggleComplete(habit: Habit) {
    await toggleFor(habit, todayKey)
  }
</script>

<div class="today-view">
  {#if loading}
    <p class="today-view__status">Loading your habits…</p>
  {:else if loadError}
    <div class="today-view__error card" role="alert">
      <p>{loadError}</p>
      <button type="button" class="button button--primary" onclick={retryLoad}>Try again</button>
    </div>
  {:else}
    <PetCompanion {onOpenPet} />
    <WeekPulse habits={active} {completions} {today} />

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
          {@const completed = completionsStore.isCompleted(habit.id, todayKey)}
          <HabitItem
            {habit}
            {completed}
            completionEnabled={!togglingIds.includes(habit.id)}
            streak={calculateCurrentStreak(habit, completions, today)}
            willCompleteDay={!completed && completedToday + 1 === scheduledToday.length}
            onToggleComplete={handleToggleComplete}
            onOpen={openDetail}
          />
        {/each}
      </ul>
      <button type="button" class="button button--primary today-view__add" onclick={startAdd}>
        + Add habit
      </button>
    {/if}

    {#if actionError}
      <p class="today-view__action-error" role="alert">{actionError}</p>
    {/if}

    {#if selectedHabit}
      {@const detailHabit = selectedHabit}
      <HabitDetail
        habit={detailHabit}
        {completions}
        {today}
        active={editing === undefined}
        onClose={closeDetail}
        onEdit={startEdit}
        onArchive={handleArchive}
        onToggleDay={(dateKey) => toggleFor(detailHabit, dateKey)}
      />
    {/if}

    {#if editing !== undefined}
      <HabitForm
        habit={editing}
        defaultColor={defaultColorFor(habitsStore.getHabits().length)}
        onSave={handleSave}
        onArchive={handleArchive}
        onCancel={closeForm}
      />
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
    gap: var(--space-3);
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
      align-self: center;
      min-width: 280px;
    }
  }
</style>
