<script lang="ts">
  import type { PetSpecies } from '../domain/pet'
  import { PET_SPRITES, spriteColorFor } from '../domain/petSprites'

  interface Props {
    species: PetSpecies
    size?: number
    label?: string
    bounce?: boolean
  }

  let { species, size = 128, label, bounce = false }: Props = $props()

  let rows = $derived(PET_SPRITES[species])
</script>

<svg
  class="pet-sprite"
  class:pet-sprite--bounce={bounce}
  viewBox="0 0 12 12"
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
</svg>

<style>
  .pet-sprite {
    display: block;
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
