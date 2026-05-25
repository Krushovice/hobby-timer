import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  getSession: () => ipcRenderer.invoke('get-session'),
  resetSession: () => ipcRenderer.invoke('reset-session'),
  showOverlay: (stage: number) => ipcRenderer.invoke('show-overlay', stage),
  hideOverlay: () => ipcRenderer.invoke('hide-overlay'),
  killChrome: () => ipcRenderer.invoke('kill-chrome'),
  blockYoutube: (minutes: number) => ipcRenderer.invoke('block-youtube', minutes),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  sendNotification: (title: string, body: string) => ipcRenderer.invoke('send-notification', title, body),

  getSetting: (key: string) => ipcRenderer.invoke('get-setting', key),
  setSetting: (key: string, value: string) => ipcRenderer.invoke('set-setting', key, value),
  getProfile: () => ipcRenderer.invoke('get-profile'),
  saveProfile: (type: string, summary: string) => ipcRenderer.invoke('save-profile', type, summary),
  addHobby: (name: string, category: string) => ipcRenderer.invoke('add-hobby', name, category),
  saveQA: (question: string, answer: string) => ipcRenderer.invoke('save-qa', question, answer),
  getSessions: (limit?: number) => ipcRenderer.invoke('get-sessions', limit),

  onSessionUpdate: (cb: (session: SessionData) => void) => {
    ipcRenderer.on('session-update', (_e, data) => cb(data))
    return () => ipcRenderer.removeAllListeners('session-update')
  },
  onSetStage: (cb: (stage: number) => void) => {
    ipcRenderer.on('set-stage', (_e, stage) => cb(stage))
    return () => ipcRenderer.removeAllListeners('set-stage')
  },
})

export interface SessionData {
  elapsedMs: number
  isChrome: boolean
  isYoutube: boolean
  stage: number
  lastUrl: string
  ignoreUsed: boolean
}
