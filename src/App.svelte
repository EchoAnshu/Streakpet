<script lang="ts">
  import AppHeader from './components/AppHeader.svelte'
  import AppNavigation, { type ViewId } from './components/AppNavigation.svelte'
  import HistoryView from './views/HistoryView.svelte'
  import SettingsView from './views/SettingsView.svelte'
  import TodayView from './views/TodayView.svelte'
  import { loadHabits } from './stores/habits.svelte'

  let view = $state<ViewId>('today')

  loadHabits()
</script>

<div class="app-shell">
  <AppHeader />
  <AppNavigation current={view} onNavigate={(next) => (view = next)} />
  <main class="app-main">
    {#if view === 'today'}
      <TodayView />
    {:else if view === 'history'}
      <HistoryView />
    {:else}
      <SettingsView />
    {/if}
  </main>
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
    padding: var(--space-4) 0 calc(96px + env(safe-area-inset-bottom));
  }

  @media (min-width: 768px) {
    .app-main {
      padding-bottom: var(--space-6);
    }
  }
</style>
