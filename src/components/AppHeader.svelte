<script lang="ts">
  interface Props {
    title: string
    subtitle?: string
  }

  let { title, subtitle }: Props = $props()
</script>

<header class="app-header">
  <h1 class="app-header__title">{title}</h1>
  {#if subtitle}
    <p class="app-header__subtitle">{subtitle}</p>
  {/if}
</header>

<style>
  .app-header {
    padding: var(--space-5) 0 var(--space-2);
  }

  .app-header__title {
    margin: 0;
    font-size: clamp(1.9rem, 6vw, 2.4rem);
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1.05;
  }

  .app-header__subtitle {
    margin: var(--space-1) 0 0;
    color: var(--color-muted);
    font-size: 0.9375rem;
  }
</style>
