<script lang="ts">
  import EmptyState from '../components/EmptyState.svelte'
</script>

<div class="history-view">
  <EmptyState
    title="No history yet"
    message="A detailed history view arrives in a later update. Your completed habits are already saved on this device."
  />
</div>

<style>
  .history-view {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }
</style>
