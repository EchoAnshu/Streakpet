<script module lang="ts">
  export type ViewId = 'today' | 'history' | 'settings'
</script>

<script lang="ts">
  interface Props {
    current: ViewId
    onNavigate: (view: ViewId) => void
  }

  let { current, onNavigate }: Props = $props()

  const items: { id: ViewId; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'history', label: 'History' },
    { id: 'settings', label: 'Settings' },
  ]
</script>

<nav class="app-nav" aria-label="Main">
  {#each items as item (item.id)}
    <button
      type="button"
      class="app-nav__item"
      class:app-nav__item--active={current === item.id}
      aria-current={current === item.id ? 'page' : undefined}
      onclick={() => onNavigate(item.id)}
    >
      {item.label}
    </button>
  {/each}
</nav>

<style>
  .app-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    gap: var(--space-2);
    background: var(--color-surface);
    border-top: 1px solid var(--color-border);
    padding: var(--space-2) var(--space-3) calc(var(--space-2) + env(safe-area-inset-bottom));
    z-index: 10;
  }

  .app-nav__item {
    flex: 1;
    max-width: 160px;
    min-height: 44px;
    border: none;
    background: transparent;
    font: inherit;
    font-weight: 600;
    color: var(--color-muted);
    border-radius: var(--radius-button);
    cursor: pointer;
  }

  .app-nav__item--active {
    color: var(--color-primary);
    background: var(--color-primary-soft);
  }

  @media (min-width: 768px) {
    .app-nav {
      position: static;
      justify-content: flex-start;
      background: transparent;
      border-top: none;
      padding: var(--space-2) 0 0;
    }

    .app-nav__item {
      flex: 0 0 auto;
      max-width: none;
      padding: 0 var(--space-4);
    }
  }
</style>
