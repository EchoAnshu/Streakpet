<script module lang="ts">
  export type ViewId = 'today' | 'history' | 'pet' | 'settings'
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
    { id: 'pet', label: 'Pet' },
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
      aria-label={item.label}
      title={item.label}
      onclick={() => onNavigate(item.id)}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        {#if item.id === 'today'}
          <path d="M4 11.2 12 4l8 7.2" />
          <path d="M6.5 10v9.5h11V10" />
        {:else if item.id === 'history'}
          <circle cx="12" cy="12" r="8.2" />
          <path d="M12 7.8V12l2.8 2" />
        {:else if item.id === 'pet'}
          <circle cx="7.4" cy="9.4" r="1.7" />
          <circle cx="12" cy="7.2" r="1.7" />
          <circle cx="16.6" cy="9.4" r="1.7" />
          <path
            d="M12 11.8c-2.8 0-4.8 1.9-4.8 3.9 0 2 1.9 2.9 4.8 2.9s4.8-.9 4.8-2.9c0-2-2-3.9-4.8-3.9Z"
          />
        {:else}
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
          <circle cx="9" cy="7" r="2.1" />
          <circle cx="15" cy="12" r="2.1" />
          <circle cx="11" cy="17" r="2.1" />
        {/if}
      </svg>
    </button>
  {/each}
</nav>

<style>
  .app-nav {
    position: fixed;
    bottom: calc(14px + env(safe-area-inset-bottom));
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 2px;
    padding: 6px;
    border-radius: var(--radius-pill);
    background: var(--color-nav-bg);
    backdrop-filter: blur(14px);
    border: 1px solid rgba(33, 29, 24, 0.06);
    box-shadow: var(--shadow-float);
    z-index: 30;
  }

  .app-nav__item {
    width: 56px;
    height: 50px;
    border: none;
    border-radius: var(--radius-pill);
    background: transparent;
    color: #9a938a;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease;
  }

  .app-nav__item:hover {
    color: var(--color-primary);
  }

  .app-nav__item--active {
    background: var(--color-primary-soft);
    color: var(--color-primary);
  }

  .app-nav svg {
    width: 24px;
    height: 24px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.9;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
</style>
