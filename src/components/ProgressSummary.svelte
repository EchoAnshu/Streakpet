<script lang="ts">
  interface Props {
    completed: number
    total: number
  }

  let { completed, total }: Props = $props()

  let label = $derived(`${completed} of ${total} habits completed`)
  let percent = $derived(total > 0 ? Math.round((completed / total) * 100) : 0)
</script>

<section class="progress-summary" aria-label="Daily progress">
  <p class="progress-summary__label" aria-live="polite">{label}</p>
  {#if total > 0}
    <div
      class="progress-summary__bar"
      role="progressbar"
      aria-label="Habits completed today"
      aria-valuemin="0"
      aria-valuemax={total}
      aria-valuenow={completed}
    >
      <div class="progress-summary__fill" style={`width: ${percent}%`}></div>
    </div>
  {/if}
</section>

<style>
  .progress-summary__label {
    font-weight: 600;
  }

  .progress-summary__bar {
    height: 8px;
    border-radius: 999px;
    background: var(--color-border);
    overflow: hidden;
    margin-top: var(--space-2);
  }

  .progress-summary__fill {
    height: 100%;
    background: var(--color-success);
    border-radius: 999px;
  }
</style>
