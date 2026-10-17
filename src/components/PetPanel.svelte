<script lang="ts">
  interface Props {
    xp?: number
    xpGoal?: number
  }

  let { xp = 0, xpGoal = 100 }: Props = $props()

  const stageLabel = 'Baby'

  let progressPercent = $derived(xpGoal > 0 ? Math.min(100, Math.round((xp / xpGoal) * 100)) : 0)
</script>

<section class="pet-panel card" aria-labelledby="pet-stage">
  <svg
    class="pet-panel__pet"
    viewBox="0 0 120 120"
    role="img"
    aria-label="Your pet as a baby"
    focusable="false"
  >
    <ellipse cx="31" cy="40" rx="11" ry="13" class="pet-ear" />
    <ellipse cx="89" cy="40" rx="11" ry="13" class="pet-ear" />
    <ellipse cx="60" cy="74" rx="36" ry="32" class="pet-body" />
    <circle cx="47" cy="68" r="5" class="pet-eye" />
    <circle cx="73" cy="68" r="5" class="pet-eye" />
    <path d="M50 82 Q60 90 70 82" class="pet-smile" />
    <circle cx="37" cy="80" r="4" class="pet-blush" />
    <circle cx="83" cy="80" r="4" class="pet-blush" />
  </svg>

  <div class="pet-panel__info">
    <h2 class="pet-panel__stage" id="pet-stage">{stageLabel} stage</h2>
    <p class="pet-panel__xp">{xp} / {xpGoal} XP</p>
    <div
      class="pet-panel__progress"
      role="progressbar"
      aria-label="Progress to the next stage"
      aria-valuemin="0"
      aria-valuemax={xpGoal}
      aria-valuenow={xp}
    >
      <div class="pet-panel__progress-fill" style={`width: ${progressPercent}%`}></div>
    </div>
    <p class="pet-panel__hint">
      Completing habits will earn XP. Pet progression arrives in a later update.
    </p>
  </div>
</section>

<style>
  .pet-panel {
    display: flex;
    align-items: center;
    gap: var(--space-4);
  }

  .pet-panel__pet {
    width: 96px;
    height: 96px;
    flex-shrink: 0;
  }

  .pet-body {
    fill: var(--color-primary);
  }

  .pet-ear {
    fill: var(--color-primary);
    opacity: 0.75;
  }

  .pet-eye {
    fill: var(--color-surface);
  }

  .pet-smile {
    stroke: var(--color-surface);
    stroke-width: 4;
    fill: none;
    stroke-linecap: round;
  }

  .pet-blush {
    fill: var(--color-accent);
    opacity: 0.6;
  }

  .pet-panel__info {
    flex: 1;
    min-width: 0;
  }

  .pet-panel__stage {
    margin: 0;
    font-size: 1.0625rem;
  }

  .pet-panel__xp {
    color: var(--color-muted);
    font-size: 0.875rem;
    margin-top: var(--space-1);
  }

  .pet-panel__progress {
    height: 8px;
    border-radius: 999px;
    background: var(--color-border);
    overflow: hidden;
    margin-top: var(--space-2);
  }

  .pet-panel__progress-fill {
    height: 100%;
    background: var(--color-primary);
    border-radius: 999px;
  }

  .pet-panel__hint {
    color: var(--color-muted);
    font-size: 0.8125rem;
    margin-top: var(--space-2);
  }

  @media (max-width: 400px) {
    .pet-panel__pet {
      width: 72px;
      height: 72px;
    }
  }
</style>
