<script lang="ts">
  import AppHeader from './components/AppHeader.svelte'
  import AppNavigation, { type ViewId } from './components/AppNavigation.svelte'
  import HistoryView from './views/HistoryView.svelte'
  import PetView from './views/PetView.svelte'
  import SettingsView from './views/SettingsView.svelte'
  import TodayView from './views/TodayView.svelte'
  import { formatDisplayDate } from './domain/dates'
  import { loadCompletions } from './stores/completions.svelte'
  import { loadHabits } from './stores/habits.svelte'
  import { loadPet } from './stores/pet.svelte'

  const TITLES: Record<ViewId, string> = {
    today: 'Today',
    history: 'History',
    pet: 'My pet',
    settings: 'Settings',
  }

  let view = $state<ViewId>('today')
  let subtitle = $derived(view === 'today' ? formatDisplayDate(new Date()) : undefined)

  loadHabits()
  loadCompletions()
  loadPet()
</script>

<div class="app-shell">
  <AppHeader title={TITLES[view]} {subtitle} />
  <main class="app-main">
    {#if view === 'today'}
      <TodayView />
    {:else if view === 'history'}
      <HistoryView />
    {:else if view === 'pet'}
      <PetView />
    {:else}
      <SettingsView />
    {/if}
  </main>
  <AppNavigation current={view} onNavigate={(next) => (view = next)} />
</div>

<style>
  .app-shell {
    min-height: 100svh;
    max-width: var(--content-width);
    margin: 0 auto;
    padding: 0 var(--space-4);
    display: flex;
    flex-direction: column;
  }

  .app-main {
    flex: 1;
    padding: var(--space-3) 0 calc(110px + env(safe-area-inset-bottom));
  }
</style>
