<script lang="ts">
  interface Props {
    title: string
    message: string
    actionLabel?: string
    onAction?: () => void
  }

  let { title, message, actionLabel, onAction }: Props = $props()
</script>

<div class="empty-state card">
  <p class="empty-state__title">{title}</p>
  <p class="empty-state__message">{message}</p>
  {#if actionLabel && onAction}
    <button type="button" class="button button--primary" onclick={onAction}>{actionLabel}</button>
  {/if}
</div>

<style>
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-3);
    text-align: center;
    padding: var(--space-6) var(--space-4);
  }

  .empty-state__title {
    font-weight: 800;
    font-size: 1.125rem;
  }

  .empty-state__message {
    color: var(--color-muted);
    font-size: 0.9375rem;
    max-width: 42ch;
  }
</style>
