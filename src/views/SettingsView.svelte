<script lang="ts">
  import { exportBackup, importBackup } from '../data/backupRepository'
  import { parseBackup, type BackupData } from '../domain/backup'
  import { THEME_LABELS, THEME_PREFERENCES } from '../domain/theme'
  import { downloadBackupFile } from '../lib/backupFile'
  import { playComplete } from '../lib/sound'
  import * as settingsStore from '../stores/settings.svelte'

  let themePreference = $derived(settingsStore.getTheme())
  let permission = $state<NotificationPermission | 'unsupported'>(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
  )
  let fileInput: HTMLInputElement
  let pendingImport = $state<BackupData | null>(null)
  let statusMessage = $state('')
  let statusIsError = $state(false)

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

  function setStatus(message: string, isError = false) {
    statusMessage = message
    statusIsError = isError
  }

  async function handleExport() {
    try {
      const data = await exportBackup()
      downloadBackupFile(data)
      setStatus('Backup downloaded.')
    } catch {
      setStatus('Could not create a backup in this browser.', true)
    }
  }

  async function handleFileChange(event: Event) {
    const input = event.currentTarget as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (!file) return
    try {
      const text = await file.text()
      pendingImport = parseBackup(text)
      setStatus('')
    } catch (error) {
      pendingImport = null
      setStatus(error instanceof Error ? error.message : 'Could not read that file.', true)
    }
  }

  async function confirmImport() {
    if (!pendingImport) return
    try {
      await importBackup(pendingImport)
      location.reload()
    } catch {
      pendingImport = null
      setStatus('Import failed. Your existing data was not changed.', true)
    }
  }

  function cancelImport() {
    pendingImport = null
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
      Back up your data to a JSON file, or restore from a previous backup. Importing replaces all
      current data.
    </p>
    <div class="settings-view__actions">
      <button type="button" class="button button--ghost button--small" onclick={handleExport}>
        Export backup
      </button>
      <button
        type="button"
        class="button button--ghost button--small"
        onclick={() => fileInput.click()}
      >
        Import backup
      </button>
    </div>
    <input
      bind:this={fileInput}
      type="file"
      accept=".json,application/json"
      class="sr-only"
      tabindex="-1"
      aria-hidden="true"
      onchange={handleFileChange}
    />
    {#if pendingImport}
      <div class="settings-view__confirm" role="alertdialog" aria-label="Confirm import">
        <p>
          Replace all current data with this backup ({pendingImport.habits.length}
          {pendingImport.habits.length === 1 ? 'habit' : 'habits'},
          {pendingImport.completions.length}
          {pendingImport.completions.length === 1 ? 'completion' : 'completions'})? This cannot be
          undone.
        </p>
        <div class="settings-view__confirm-actions">
          <button type="button" class="button button--primary button--small" onclick={confirmImport}>
            Replace data
          </button>
          <button type="button" class="button button--ghost button--small" onclick={cancelImport}>
            Cancel
          </button>
        </div>
      </div>
    {/if}
    {#if statusMessage}
      <p
        class="settings-view__status"
        class:settings-view__status--error={statusIsError}
        aria-live="polite"
      >
        {statusMessage}
      </p>
    {/if}
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

  .settings-view__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
    margin-top: var(--space-3);
  }

  .settings-view__confirm {
    margin-top: var(--space-3);
    padding: var(--space-3) var(--space-4);
    border-radius: var(--radius-button);
    background: var(--color-primary-soft);
  }

  .settings-view__confirm-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin-top: var(--space-3);
  }

  .settings-view__status {
    margin-top: var(--space-3);
    font-size: 0.875rem;
    color: var(--color-muted);
  }

  .settings-view__status--error {
    color: var(--color-danger);
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
