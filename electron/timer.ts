export interface SessionData {
  elapsedMs: number
  isChrome: boolean
  isYoutube: boolean
  stage: number
  lastSite: string
  ignoreUsed: boolean
}

// Configurable thresholds (ms)
export const THRESHOLDS = {
  stage1: 30 * 60 * 1000,  // 30 min
  stage2: 45 * 60 * 1000,  // 45 min
  stage3: 60 * 60 * 1000,  // 60 min
  idleReset: 5 * 60 * 1000, // 5 min inactive resets counter
}

const POLL_MS = 5000

let session: SessionData = {
  elapsedMs: 0,
  isChrome: false,
  isYoutube: false,
  stage: 0,
  lastSite: '',
  ignoreUsed: false,
}

let inactiveMs = 0

export function tickSession(isChrome: boolean, isYoutube: boolean, site: string) {
  session.isChrome = isChrome
  session.isYoutube = isYoutube
  if (site) session.lastSite = site

  if (isChrome) {
    session.elapsedMs += POLL_MS
    inactiveMs = 0
  } else {
    inactiveMs += POLL_MS
    if (inactiveMs >= THRESHOLDS.idleReset) {
      resetSession()
      return
    }
  }

  session.stage = computeStage(session.elapsedMs)
}

function computeStage(ms: number): number {
  if (ms >= THRESHOLDS.stage3) return 3
  if (ms >= THRESHOLDS.stage2) return 2
  if (ms >= THRESHOLDS.stage1) return 1
  return 0
}

export function resetSession() {
  session = {
    elapsedMs: 0,
    isChrome: false,
    isYoutube: false,
    stage: 0,
    lastSite: session.lastSite,
    ignoreUsed: false,
  }
  inactiveMs = 0
}

export function markIgnoreUsed() {
  session.ignoreUsed = true
}

export function getSession(): SessionData {
  return { ...session }
}

export function updateThresholds(overrides: Partial<typeof THRESHOLDS>) {
  Object.assign(THRESHOLDS, overrides)
}
