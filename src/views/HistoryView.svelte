<script lang="ts">
  import EmptyState from '../components/EmptyState.svelte'
</script>

<div class="history-view">
  <EmptyState
    title="No history yet"
    message="Once you complete habits, your progress will appear here."
  />
</div>

<style>
  .history-view {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }
</style>
