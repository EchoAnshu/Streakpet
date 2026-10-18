<script lang="ts">
  import * as toastsStore from '../stores/toasts.svelte'

  let toasts = $derived(toastsStore.getToasts())
</script>

{#if toasts.length > 0}
  <div class="toasts" role="status" aria-live="polite">
    {#each toasts as toast (toast.id)}
      <div class="toast">
        <div class="toast__text">
          <p class="toast__title">{toast.title}</p>
          <p class="toast__body">{toast.body}</p>
        </div>
        <button
          type="button"
          class="toast__close"
          aria-label="Dismiss"
          onclick={() => toastsStore.dismissToast(toast.id)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M7 7l10 10M17 7L7 17" />
          </svg>
        </button>
      </div>
    {/each}
  </div>
{/if}

<style>
  .toasts {
    position: fixed;
    top: calc(10px + env(safe-area-inset-top));
    left: 50%;
    transform: translateX(-50%);
    width: min(100% - 24px, 420px);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    z-index: 80;
    pointer-events: none;
  }

  .toast {
    pointer-events: auto;
    display: flex;
    align-items: flex-start;
    gap: var(--space-2);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-card);
    box-shadow: var(--shadow-float);
    padding: var(--space-3) var(--space-3) var(--space-3) var(--space-4);
    animation: toast-in 0.25s cubic-bezier(0.22, 1, 0.36, 1);
  }

  @keyframes toast-in {
    from {
      transform: translateY(-12px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .toast__text {
    flex: 1;
    min-width: 0;
  }

  .toast__title {
    font-weight: 700;
    font-size: 0.9375rem;
  }

  .toast__body {
    color: var(--color-muted);
    font-size: 0.875rem;
    margin-top: 2px;
  }

  .toast__close {
    width: 32px;
    height: 32px;
    flex-shrink: 0;
    border: none;
    border-radius: 50%;
    background: transparent;
    color: var(--color-muted);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .toast__close:hover {
    background: var(--color-background);
    color: var(--color-text);
  }

  .toast__close svg {
    width: 16px;
    height: 16px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2.2;
    stroke-linecap: round;
  }
</style>
