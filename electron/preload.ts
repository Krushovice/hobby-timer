import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowClose: () => ipcRenderer.invoke('window-close'),
  getLastSuggestion: () => ipcRenderer.invoke('get-last-suggestion'),

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
  getHobbies: () => ipcRenderer.invoke('get-hobbies'),
  getThresholds: () => ipcRenderer.invoke('get-thresholds'),
  setThresholds: (t: object) => ipcRenderer.invoke('set-thresholds', t),

  startGameTimer: () => ipcRenderer.invoke('start-game-timer'),
  stopGameTimer: () => ipcRenderer.invoke('stop-game-timer'),
  getGameSession: () => ipcRenderer.invoke('get-game-session'),
  onGameTimerUpdate: (cb: (session: { running: boolean; elapsedMs: number }) => void) => {
    ipcRenderer.on('game-timer-update', (_e, data) => cb(data))
    return () => ipcRenderer.removeAllListeners('game-timer-update')
  },

  onSessionUpdate: (cb: (session: SessionData) => void) => {
    ipcRenderer.on('session-update', (_e, data) => cb(data))
    return () => ipcRenderer.removeAllListeners('session-update')
  },
  onSetStage: (cb: (stage: number) => void) => {
    ipcRenderer.on('set-stage', (_e, stage) => cb(stage))
    return () => ipcRenderer.removeAllListeners('set-stage')
  },
  onGetGeminiSuggestion: (cb: (reqId: number, hobby: string) => void) => {
    ipcRenderer.on('get-gemini-suggestion', (_e, reqId, hobby) => cb(reqId, hobby))
    return () => ipcRenderer.removeAllListeners('get-gemini-suggestion')
  },
  sendGeminiSuggestion: (reqId: number, text: string) => {
    ipcRenderer.send('gemini-suggestion-result', reqId, text)
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
