import type { SessionData } from './timer'
import { markIgnoreUsed } from './timer'
import { getHobbySuggestion } from '../db/profile'

interface EscalationHandlers {
  onStage1: (suggestion: string) => void
  onStage2: () => void
  onStage3: () => void
}

let lastFiredStage = 0

export function handleStageChange(session: SessionData, handlers: EscalationHandlers) {
  const { stage } = session

  // Only fire each stage once per session
  if (stage <= lastFiredStage) return
  if (stage === 0) return

  lastFiredStage = stage

  if (stage === 1) {
    const suggestion = getHobbySuggestion()
    handlers.onStage1(suggestion)
  } else if (stage === 2) {
    handlers.onStage2()
  } else if (stage === 3) {
    handlers.onStage3()
  }
}

export function resetEscalation() {
  lastFiredStage = 0
}
