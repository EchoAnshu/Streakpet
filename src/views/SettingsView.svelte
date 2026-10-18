<script lang="ts">
  import { THEME_LABELS, THEME_PREFERENCES } from '../domain/theme'
  import { playComplete } from '../lib/sound'
  import * as settingsStore from '../stores/settings.svelte'

  let themePreference = $derived(settingsStore.getTheme())
  let permission = $state<NotificationPermission | 'unsupported'>(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
  )

  async function requestPermission() {
    if (typeof Notification === 'undefined') return
    permission = await Notification.requestPermission()
  }

  function handleMutedChange(event: Event) {
    const input = event.currentTarget as HTMLInputElement
    const nextMuted = !input.checked
    settingsStore.setMuted(nextMuted)
    if (!nextMuted) playComplete()
  }
</script>

<div class="settings-view">
  <section class="card">
    <h2>Appearance</h2>
    <p class="settings-view__note">Choose how StreakPet looks on this device.</p>
    <div class="settings-segments" role="group" aria-label="Theme">
      {#each THEME_PREFERENCES as option (option)}
        <button
          type="button"
          class="settings-segment"
          class:settings-segment--active={themePreference === option}
          aria-pressed={themePreference === option}
          onclick={() => settingsStore.setTheme(option)}
        >
          {THEME_LABELS[option]}
        </button>
      {/each}
    </div>
  </section>

  <section class="card">
    <h2>Sounds</h2>
    <label class="settings-toggle">
      <span>Sound effects</span>
      <input
        type="checkbox"
        checked={!settingsStore.getMuted()}
        onchange={handleMutedChange}
        aria-label="Sound effects"
      />
      <span class="settings-toggle__track" aria-hidden="true"></span>
    </label>
    <p class="settings-view__note">
      Little chimes play when you complete habits, feed your pet, and unlock new stages.
    </p>
  </section>

  <section class="card">
    <h2>Reminders</h2>
    {#if permission === 'unsupported'}
      <p class="settings-view__note">
        System notifications are not available in this browser. Habit reminders will still ring
        inside the app while it is open.
      </p>
    {:else if permission === 'granted'}
      <p class="settings-view__note">
        Notifications are enabled. Habit reminders appear while the app is open.
      </p>
    {:else if permission === 'denied'}
      <p class="settings-view__note">
        Notifications are blocked in your browser settings. In-app reminders still work while the
        app is open.
      </p>
    {:else}
      <p class="settings-view__note">
        Get a system notification when a habit reminder is due while the app is open.
      </p>
      <button type="button" class="button button--primary settings-view__button" onclick={requestPermission}>
        Enable notifications
      </button>
    {/if}
  </section>

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
      Export and import will arrive in later updates.
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

  .settings-view__button {
    margin-top: var(--space-3);
  }

  .settings-segments {
    display: flex;
    border: 1.5px solid var(--color-border-strong);
    border-radius: var(--radius-pill);
    overflow: hidden;
    margin-top: var(--space-3);
  }

  .settings-segment {
    flex: 1;
    min-height: 44px;
    border: none;
    background: var(--color-surface);
    font: inherit;
    font-weight: 600;
    color: var(--color-muted);
    cursor: pointer;
  }

  .settings-segment + .settings-segment {
    border-left: 1.5px solid var(--color-border-strong);
  }

  .settings-segment--active {
    background: var(--color-primary-soft);
    color: var(--color-primary);
  }

  .settings-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    margin-top: var(--space-2);
    position: relative;
    cursor: pointer;
    font-weight: 600;
  }

  .settings-toggle input {
    position: absolute;
    opacity: 0;
    width: 44px;
    height: 28px;
    right: 0;
    margin: 0;
    cursor: pointer;
  }

  .settings-toggle__track {
    width: 48px;
    height: 29px;
    border-radius: var(--radius-pill);
    background: var(--color-border-strong);
    position: relative;
    flex-shrink: 0;
    transition: background 0.15s ease;
  }

  .settings-toggle__track::after {
    content: '';
    position: absolute;
    top: 3px;
    left: 3px;
    width: 23px;
    height: 23px;
    border-radius: 50%;
    background: #ffffff;
    box-shadow: 0 1px 3px rgba(33, 29, 24, 0.25);
    transition: transform 0.18s ease;
  }

  .settings-toggle input:checked + .settings-toggle__track {
    background: var(--color-primary);
  }

  .settings-toggle input:checked + .settings-toggle__track::after {
    transform: translateX(19px);
  }

  .settings-toggle input:focus-visible + .settings-toggle__track {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
</style>
