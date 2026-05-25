import { create } from 'zustand'
import type { SessionData, ProfileData } from '../types'

export interface AppState {
  session: SessionData
  profile: ProfileData | null
  suggestion: string
  view: 'dashboard' | 'overlay' | 'onboarding' | 'stats' | 'profile'

  setSession: (s: SessionData) => void
  setProfile: (p: ProfileData) => void
  setSuggestion: (s: string) => void
  setView: (v: AppState['view']) => void
}

const defaultSession: SessionData = {
  elapsedMs: 0,
  isChrome: false,
  isYoutube: false,
  stage: 0,
  lastSite: '',
  ignoreUsed: false,
}

export const useAppStore = create<AppState>((set) => ({
  session: defaultSession,
  profile: null,
  suggestion: '',
  view: 'dashboard',

  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setSuggestion: (suggestion) => set({ suggestion }),
  setView: (view) => set({ view }),
}))
