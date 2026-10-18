<script lang="ts">
  import {
    TREATS_PER_COMPLETION,
    STAGE_LABELS,
    stageProgress,
    type PetStage,
  } from '../domain/pet'

  interface Props {
    totalXp: number
    stage: PetStage
  }

  let { totalXp, stage }: Props = $props()

  let progress = $derived(stageProgress(totalXp))
  let progressPercent = $derived(
    progress.goal ? Math.min(100, Math.round((progress.earned / progress.goal) * 100)) : 100
  )
</script>

<section class="pet-panel card" aria-labelledby="pet-stage">
  <svg
    class="pet-panel__pet pet-panel__pet--{stage}"
    viewBox="0 0 120 120"
    role="img"
    aria-label={`Your pet as a ${STAGE_LABELS[stage].toLowerCase()}`}
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
    <h2 class="pet-panel__stage" id="pet-stage">{STAGE_LABELS[stage]} stage</h2>
    <p class="pet-panel__xp">{totalXp} XP total</p>

    {#if progress.goal && progress.nextStage}
      <div
        class="pet-panel__progress"
        role="progressbar"
        aria-label={`Progress to the ${STAGE_LABELS[progress.nextStage].toLowerCase()} stage`}
        aria-valuemin="0"
        aria-valuemax={progress.goal}
        aria-valuenow={progress.earned}
      >
        <div class="pet-panel__progress-fill" style={`width: ${progressPercent}%`}></div>
      </div>
      <p class="pet-panel__progress-label">
        {progress.earned} / {progress.goal} XP to {STAGE_LABELS[progress.nextStage]}
      </p>
    {:else}
      <p class="pet-panel__progress-label">Fully grown</p>
    {/if}

    <p class="pet-panel__hint">
      Each habit completion earns {TREATS_PER_COMPLETION} treat. Feed your pet to help it grow and
      keep it happy.
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
    flex-shrink: 0;
    transition: width 0.3s ease, height 0.3s ease;
  }

  .pet-panel__pet--baby {
    width: 76px;
    height: 76px;
  }

  .pet-panel__pet--teen {
    width: 96px;
    height: 96px;
  }

  .pet-panel__pet--adult {
    width: 116px;
    height: 116px;
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
    transition: width 0.3s ease;
  }

  .pet-panel__progress-label {
    color: var(--color-muted);
    font-size: 0.8125rem;
    margin-top: var(--space-1);
  }

  .pet-panel__hint {
    color: var(--color-muted);
    font-size: 0.8125rem;
    margin-top: var(--space-2);
  }
</style>
