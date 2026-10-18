<script lang="ts">
  import PetPanel from '../components/PetPanel.svelte'
  import * as petStore from '../stores/pet.svelte'

  let loadError = $derived(petStore.getLoadError())
  let loading = $derived(petStore.isLoading())
</script>

<div class="pet-view">
  {#if loading}
    <p class="pet-view__status">Loading your pet…</p>
  {:else if loadError}
    <div class="card pet-view__error" role="alert">
      <p>{loadError}</p>
      <button type="button" class="button button--primary" onclick={() => petStore.loadPet(true)}>
        Try again
      </button>
    </div>
  {:else}
    <PetPanel totalXp={petStore.getXp()} stage={petStore.getStage()} />
    <section class="card">
      <h2>Coming soon</h2>
      <p class="pet-view__note">
        Pixel art friends, adoption, feeding, and a hunger meter are on the way. Keep completing
        habits to collect treats.
      </p>
    </section>
  {/if}
</div>

<style>
  .pet-view {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .pet-view__status {
    color: var(--color-muted);
  }

  .pet-view__error {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-3);
  }

  .pet-view__note {
    color: var(--color-muted);
    font-size: 0.9375rem;
  }
</style>
