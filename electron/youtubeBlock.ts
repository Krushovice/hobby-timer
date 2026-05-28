let blockedUntil = 0
let blockTimer: ReturnType<typeof setTimeout> | null = null

export function setBlock(minutes: number): void {
  if (blockTimer) clearTimeout(blockTimer)
  blockedUntil = Date.now() + minutes * 60 * 1000
  blockTimer = setTimeout(() => {
    blockedUntil = 0
    blockTimer = null
  }, minutes * 60 * 1000)
}

export function isBlocked(): boolean {
  return Date.now() < blockedUntil
}

export function clearBlock(): void {
  if (blockTimer) {
    clearTimeout(blockTimer)
    blockTimer = null
  }
  blockedUntil = 0
}

export function blockRemainingMs(): number {
  return Math.max(0, blockedUntil - Date.now())
}
