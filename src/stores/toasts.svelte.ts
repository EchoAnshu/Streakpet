export interface Toast {
  id: string
  title: string
  body: string
}

const DISMISS_AFTER_MS = 7000

let toasts = $state<Toast[]>([])

export function getToasts(): Toast[] {
  return toasts
}

export function pushToast(title: string, body: string): void {
  const id = crypto.randomUUID()
  toasts = [...toasts, { id, title, body }]
  window.setTimeout(() => dismissToast(id), DISMISS_AFTER_MS)
}

export function dismissToast(id: string): void {
  toasts = toasts.filter((toast) => toast.id !== id)
}
