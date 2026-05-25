export interface SessionData {
  elapsedMs: number
  isChrome: boolean
  isYoutube: boolean
  stage: number
  lastSite: string
  ignoreUsed: boolean
}

export interface ProfileData {
  type: string | null
  summary: string | null
  onboarding_done: number
}

export interface HobbyData {
  id: number
  name: string
  category: string
}

export type ProfileType = 'ESCAPIST' | 'PROCRASTINATOR' | 'INFO-ADDICT' | 'DOPAMINE-SEEKER'
