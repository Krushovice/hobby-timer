import { tickSession, getSession } from './timer'
import { startSession, endSession } from '../db/profile'

type SessionCallback = (session: ReturnType<typeof getSession>) => void

let intervalId: ReturnType<typeof setInterval> | null = null
const POLL_MS = 5000

// DB session tracking
let currentDbSessionId: number | null = null
let prevElapsedMs = 0
let sessionYoutubeMs = 0
let sessionMaxStage = 0

function flushSession(elapsedMs: number) {
  if (currentDbSessionId === null) return
  endSession(currentDbSessionId, elapsedMs, sessionMaxStage, sessionYoutubeMs)
  currentDbSessionId = null
  sessionYoutubeMs = 0
  sessionMaxStage = 0
}

function isChrome(title: string, owner: string): boolean {
  return owner.toLowerCase().includes('chrome') ||
    owner.toLowerCase().includes('chromium')
}

function isYoutube(title: string): boolean {
  return title.toLowerCase().includes('youtube')
}

function extractSiteLabel(title: string): string {
  if (title.toLowerCase().includes('youtube')) return 'youtube.com'
  const match = title.match(/[-–—]\s*([A-Za-z0-9а-яА-ЯёЁ .]+)\s*[-–—]?\s*Google Chrome/i)
  return match ? match[1].trim() : 'chrome'
}

export function startWatcher(onTick: SessionCallback) {
  if (intervalId) return

  intervalId = setInterval(async () => {
    try {
      const { default: activeWin } = await import('active-win')
      const win = await activeWin()

      if (!win) {
        tickSession(false, false, '')
      } else {
        const owner = win.owner?.name ?? ''
        const title = win.title ?? ''
        const chrome = isChrome(title, owner)
        const youtube = chrome && isYoutube(title)
        const site = chrome ? extractSiteLabel(title) : ''
        tickSession(chrome, youtube, site)
      }
    } catch (err) {
      // active-win can fail on locked screen — treat as inactive
      tickSession(false, false, '')
    }

    const session = getSession()

    // Session reset detected: elapsedMs dropped back to 0
    if (prevElapsedMs > 0 && session.elapsedMs === 0) {
      flushSession(prevElapsedMs)
    }

    // Chrome became active → start DB session
    if (session.isChrome && currentDbSessionId === null) {
      currentDbSessionId = startSession()
    }

    // Accumulate youtube time and track max stage
    if (session.isChrome) {
      if (session.isYoutube) sessionYoutubeMs += POLL_MS
      sessionMaxStage = Math.max(sessionMaxStage, session.stage)
    }

    prevElapsedMs = session.elapsedMs
    onTick(session)
  }, POLL_MS)
}

export function stopWatcher() {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
  flushSession(prevElapsedMs)
}
