export interface GameSession {
  running: boolean
  elapsedMs: number
}

const NOTIFY_INTERVAL_MS = 60 * 60 * 1000

let running = false
let startedAt: number | null = null
let notifiedCount = 0

export function startGameTimer(): void {
  running = true
  startedAt = Date.now()
  notifiedCount = 0
}

export function stopGameTimer(): void {
  running = false
  startedAt = null
  notifiedCount = 0
}

export function getGameSession(): GameSession {
  return {
    running,
    elapsedMs: running && startedAt ? Date.now() - startedAt : 0,
  }
}

export function checkGameNotification(): string | null {
  if (!running || !startedAt) return null
  const elapsed = Date.now() - startedAt
  const due = Math.floor(elapsed / NOTIFY_INTERVAL_MS)
  if (due <= notifiedCount) return null
  notifiedCount = due
  const h = Math.floor(elapsed / 3600000)
  const m = Math.floor((elapsed % 3600000) / 60000)
  const parts: string[] = []
  if (h > 0) parts.push(`${h}ч`)
  if (m > 0) parts.push(`${m}м`)
  return `${parts.join(' ')} в игре. Сделай перерыв, разомнись!`
}
