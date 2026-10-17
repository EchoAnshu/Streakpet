<script lang="ts">
  import { formatDisplayDate } from '../domain/dates'

  const dateLabel = formatDisplayDate(new Date())
</script>

<header class="app-header">
  <div class="app-header__brand">
    <svg class="app-header__logo" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <ellipse cx="32" cy="40" rx="14" ry="12" />
      <circle cx="18" cy="26" r="6.5" />
      <circle cx="29" cy="19" r="6.5" />
      <circle cx="41" cy="20" r="6.5" />
      <circle cx="50" cy="28" r="6.5" />
    </svg>
    <div>
      <p class="app-header__name">StreakPet</p>
      <p class="app-header__date">{dateLabel}</p>
    </div>
  </div>
</header>

<style>
  .app-header {
    padding: var(--space-4) 0 var(--space-2);
  }

  .app-header__brand {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .app-header__logo {
    width: 30px;
    height: 30px;
    fill: var(--color-primary);
    flex-shrink: 0;
  }

  .app-header__name {
    font-weight: 700;
    font-size: 1.125rem;
    line-height: 1.2;
  }

  .app-header__date {
    color: var(--color-muted);
    font-size: 0.875rem;
  }
</style>
