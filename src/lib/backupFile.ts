import type { BackupData } from '../domain/backup'
import { serializeBackup } from '../domain/backup'
import { getLocalDateKey } from '../domain/dates'

export function downloadBackupFile(data: BackupData): void {
  const blob = new Blob([serializeBackup(data)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `streakpet-backup-${getLocalDateKey(new Date())}.json`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
