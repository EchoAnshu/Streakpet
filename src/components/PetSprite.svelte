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

<style>
  .pet-sprite {
    display: block;
    transform-origin: 50% 100%;
  }

  .pet-sprite--idle {
    animation: pet-idle 3.4s ease-in-out infinite;
  }

  .pet-sprite--mood-happy {
    animation: pet-happy 2.4s ease-in-out infinite;
  }

  .pet-sprite--mood-content {
    animation: pet-idle 3.4s ease-in-out infinite;
  }

  .pet-sprite--mood-hungry {
    animation: pet-hungry 4.2s ease-in-out infinite;
  }

  .pet-sprite--mood-sad {
    animation: pet-sad 5.2s ease-in-out infinite;
  }

  @keyframes pet-happy {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-5px);
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
      transform: translateY(2px) rotate(-1.4deg);
    }
    50% {
      transform: translateY(4px) rotate(1.4deg);
    }
  }

  @keyframes pet-sad {
    0%,
    100% {
      transform: translateY(5px) scaleY(0.97);
    }
    50% {
      transform: translateY(6px) scaleY(0.95);
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
