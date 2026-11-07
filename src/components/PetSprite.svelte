<script lang="ts">
  import type { PetMood, PetSpecies, PetStage } from '../domain/pet'
  import {
    PET_SPRITES,
    SPRITE_SIZE,
    STAGE_ACCENT_COLORS,
    STAGE_OVERLAYS,
    spriteColorFor,
  } from '../domain/petSprites'

  interface Props {
    species: PetSpecies
    size?: number
    label?: string
    bounce?: boolean
    idle?: boolean
    mood?: PetMood
    stage?: PetStage
  }

  let { species, size = 128, label, bounce = false, idle = false, mood, stage }: Props = $props()

  let rows = $derived(PET_SPRITES[species])
  let overlay = $derived(
    stage === 'teen' || stage === 'adult'
      ? { rows: STAGE_OVERLAYS[stage], color: STAGE_ACCENT_COLORS[stage] }
      : null,
  )
</script>

<span class="pet-sprite-wrap" style={`width:${size}px;height:${size}px;`}>
  <svg
    class="pet-sprite"
    class:pet-sprite--idle={idle && !mood}
    class:pet-sprite--mood-happy={idle && mood === 'happy'}
    class:pet-sprite--mood-content={idle && mood === 'content'}
    class:pet-sprite--mood-hungry={idle && mood === 'hungry'}
    class:pet-sprite--mood-sad={idle && mood === 'sad'}
    class:pet-sprite--bounce={bounce}
    viewBox={`0 0 ${SPRITE_SIZE} ${SPRITE_SIZE}`}
    width={size}
    height={size}
    role={label ? 'img' : 'presentation'}
    aria-label={label}
    aria-hidden={label ? undefined : 'true'}
    shape-rendering="crispEdges"
  >
    {#each rows as row, y (y)}
      {#each [...row] as char, x (x)}
        {@const color = spriteColorFor(char, species)}
        {#if color}
          <rect {x} {y} width="1" height="1" fill={color}></rect>
        {/if}
      {/each}
    {/each}
    {#if overlay}
      {#each overlay.rows as row, y (y)}
        {#each [...row] as char, x (x)}
          {#if char === '1'}
            <rect {x} {y} width="1" height="1" fill={overlay.color}></rect>
          {/if}
        {/each}
      {/each}
    {/if}
  </svg>
  {#if idle && (mood === 'hungry' || mood === 'sad')}
    <span
      class="pet-bubble pet-bubble--{mood}"
      style={`font-size:${Math.round(size * 0.26)}px;`}
      aria-hidden="true"
    >
      {mood === 'hungry' ? '🥺' : '😢'}
    </span>
  {/if}
</span>

<style>
  .pet-sprite-wrap {
    position: relative;
    display: inline-block;
    line-height: 0;
  }

  .pet-bubble {
    position: absolute;
    top: -16%;
    right: -6%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 50%;
    height: 50%;
    border-radius: 50%;
    background: var(--color-surface);
    border: 1.5px solid var(--color-border-strong);
    box-shadow: 0 2px 7px rgba(33, 29, 24, 0.18);
    line-height: 1;
    opacity: 0;
    transform: scale(0.6) translateY(4px);
    animation: pet-bubble-pop 0.35s ease-out forwards, pet-bubble-float 2.6s ease-in-out 0.35s infinite;
    z-index: 2;
  }

  .pet-bubble::after {
    content: '';
    position: absolute;
    left: 18%;
    top: 72%;
    width: 22%;
    height: 22%;
    border-radius: 0 0 100% 0;
    background: var(--color-surface);
    transform: rotate(6deg);
  }

  .pet-bubble--sad {
    animation: pet-bubble-pop 0.35s ease-out forwards, pet-bubble-float-slow 3.4s ease-in-out 0.35s infinite;
  }

  .pet-sprite {
    display: block;
    transform-origin: 50% 100%;
    transition: filter 0.4s ease;
  }

  .pet-sprite--idle {
    animation: pet-idle 3.4s ease-in-out infinite;
  }

  .pet-sprite--mood-happy {
    animation: pet-happy 2.2s ease-in-out infinite;
  }

  .pet-sprite--mood-content {
    animation: pet-idle 3.4s ease-in-out infinite;
  }

  .pet-sprite--mood-hungry {
    filter: sepia(0.55) hue-rotate(35deg) saturate(1.15) brightness(0.97);
    animation: pet-hungry 3.2s ease-in-out infinite;
  }

  .pet-sprite--mood-sad {
    filter: grayscale(0.75) brightness(0.9);
    animation: pet-sad 4.6s ease-in-out infinite;
  }

  @keyframes pet-happy {
    0%,
    100% {
      transform: translateY(0) scale(1);
    }
    50% {
      transform: translateY(-7px) scale(1.03);
    }
  }

  @keyframes pet-idle {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-3px);
    }
  }

  @keyframes pet-hungry {
    0%,
    100% {
      transform: translateY(4px) rotate(-4.5deg);
    }
    50% {
      transform: translateY(7px) rotate(4.5deg);
    }
  }

  @keyframes pet-sad {
    0%,
    100% {
      transform: translateY(8px) scaleY(0.93);
    }
    50% {
      transform: translateY(10px) scaleY(0.91);
    }
  }

  @keyframes pet-bubble-pop {
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  @keyframes pet-bubble-float {
    0%,
    100% {
      transform: scale(1) translateY(0);
    }
    25% {
      transform: scale(1) translateY(-4px);
    }
    50% {
      transform: scale(1) translateY(0);
    }
    75% {
      transform: scale(1) translateY(-2px);
    }
  }

  @keyframes pet-bubble-float-slow {
    0%,
    100% {
      transform: scale(1) translateY(0);
    }
    40% {
      transform: scale(1) translateY(-5px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .pet-bubble {
      animation: pet-bubble-pop 0.35s ease-out forwards;
    }
  }

  .pet-sprite--bounce {
    animation: pet-bounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  @keyframes pet-bounce {
    0% {
      transform: translateY(0) scale(1);
    }
    40% {
      transform: translateY(-9px) scale(1.06);
    }
    70% {
      transform: translateY(2px) scale(0.98);
    }
    100% {
      transform: translateY(0) scale(1);
    }
  }
</style>
