<div class="settings-view">
  <section class="card">
    <h2>About</h2>
    <p>
      StreakPet is a lightweight, offline-first habit tracker with a virtual pet. This is an early
      development build.
    </p>
  </section>

  <section class="card">
    <h2>Your data</h2>
    <p>
      Your habits and completions are stored only in this browser using IndexedDB. No account,
      network connection, or tracking is required.
    </p>
    <p class="settings-view__note">
      Export, import, and theme settings will arrive in later updates.
    </p>
  </section>
</div>

<style>
  .settings-view {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .settings-view__note {
    color: var(--color-muted);
    font-size: 0.875rem;
    margin-top: var(--space-2);
  }
</style>
