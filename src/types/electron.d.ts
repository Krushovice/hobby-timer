import type { SessionData } from './index'

interface ElectronAPI {
  getSession: () => Promise<SessionData>
  resetSession: () => Promise<void>
  showOverlay: (stage: number) => Promise<void>
  hideOverlay: () => Promise<void>
  killChrome: () => Promise<void>
  blockYoutube: (minutes: number) => Promise<void>
  openExternal: (url: string) => Promise<void>
  sendNotification: (title: string, body: string) => Promise<void>
  getSetting: (key: string) => Promise<string | null>
  setSetting: (key: string, value: string) => Promise<void>
  getProfile: () => Promise<{ type: string | null; summary: string | null; onboarding_done: number }>
  saveProfile: (type: string, summary: string) => Promise<void>
  addHobby: (name: string, category: string) => Promise<void>
  saveQA: (question: string, answer: string) => Promise<void>
  getSessions: (limit?: number) => Promise<Array<{
    id: number; started_at: number; ended_at: number | null
    duration_ms: number; max_stage: number; youtube_ms: number
  }>>
  onSessionUpdate: (cb: (session: SessionData) => void) => () => void
  onSetStage: (cb: (stage: number) => void) => () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
