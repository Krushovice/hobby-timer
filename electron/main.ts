import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, shell, Notification } from 'electron'
import path from 'path'
import { startWatcher, stopWatcher } from './watcher'
import { getSession, resetSession, markIgnoreUsed, THRESHOLDS, updateThresholds } from './timer'
import { startGameTimer, stopGameTimer, getGameSession, checkGameNotification } from './gameTimer'
import { handleStageChange, resetEscalation } from './escalation'
import { setBlock, isBlocked, blockRemainingMs } from './youtubeBlock'
import { getSetting, setSetting, getProfile, saveProfile, addHobby, saveQA, getSessions, getHobbies } from '../db/profile'

// Required for Windows toast notifications
app.setAppUserModelId('com.neuroguard.app')

const isDev = process.env.NODE_ENV === 'development'

let mainWindow: BrowserWindow | null = null
let overlayWindow: BrowserWindow | null = null
let tray: Tray | null = null
let prevSessionMs = 0
let lastBlockAlertMs = 0
const BLOCK_ALERT_COOLDOWN = 60_000

// Gemini suggestion request/response (main→renderer→main)
const pendingSuggestions = new Map<number, (text: string) => void>()
let suggestionReqId = 0
let lastSuggestionText = ''

function requestGeminiSuggestion(hobby: string): Promise<string> {
  return new Promise((resolve) => {
    const reqId = ++suggestionReqId
    pendingSuggestions.set(reqId, resolve)
    mainWindow?.webContents.send('get-gemini-suggestion', reqId, hobby)
    setTimeout(() => {
      if (pendingSuggestions.has(reqId)) {
        pendingSuggestions.delete(reqId)
        resolve(hobby) // fallback to raw hobby name
      }
    }, 10_000)
  })
}

ipcMain.on('gemini-suggestion-result', (_e, reqId: number, text: string) => {
  const cb = pendingSuggestions.get(reqId)
  if (cb) {
    pendingSuggestions.delete(reqId)
    lastSuggestionText = text
    cb(text)
  }
})

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 620,
    minWidth: 380,
    minHeight: 560,
    frame: false,
    transparent: true,
    resizable: true,
    skipTaskbar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'))
  }

  mainWindow.on('closed', () => { mainWindow = null })
}

function createOverlayWindow(initialStage: 2 | 3 = 2) {
  if (overlayWindow) return

  overlayWindow = new BrowserWindow({
    fullscreen: true,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  const hash = `#overlay/${initialStage}`
  const url = isDev
    ? `http://localhost:5173/${hash}`
    : `file://${path.join(__dirname, '../../dist/index.html')}${hash}`

  overlayWindow.loadURL(url)
  overlayWindow.setAlwaysOnTop(true, 'screen-saver')

  overlayWindow.on('closed', () => { overlayWindow = null })
}

function destroyOverlayWindow() {
  if (overlayWindow) {
    overlayWindow.close()
    overlayWindow = null
  }
}

function createTray() {
  const icon = nativeImage.createFromPath(
    path.join(__dirname, '../../assets/icons/tray.png')
  ).isEmpty()
    ? nativeImage.createEmpty()
    : nativeImage.createFromPath(path.join(__dirname, '../../assets/icons/tray.png'))

  tray = new Tray(icon)
  tray.setToolTip('NEURO-GUARD')

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Открыть', click: () => mainWindow?.show() },
    { type: 'separator' },
    { label: 'Сбросить таймер', click: () => { resetSession(); broadcastSession() } },
    { type: 'separator' },
    { label: 'Выход', click: () => app.quit() },
  ])

  tray.setContextMenu(contextMenu)
  tray.on('click', () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide()
    } else {
      mainWindow?.show()
    }
  })
}

function broadcastSession() {
  const session = getSession()
  mainWindow?.webContents.send('session-update', session)
  overlayWindow?.webContents.send('session-update', session)
}

// IPC handlers
ipcMain.handle('get-session', () => getSession())

ipcMain.handle('reset-session', () => {
  resetSession()
  resetEscalation()
  broadcastSession()
})

ipcMain.handle('show-overlay', (_e, stage: number) => {
  createOverlayWindow()
  overlayWindow?.webContents.send('set-stage', stage)
})

ipcMain.handle('hide-overlay', () => {
  destroyOverlayWindow()
})

ipcMain.handle('kill-chrome', async () => {
  const { exec } = await import('child_process')
  exec('taskkill /F /IM chrome.exe', (err) => {
    if (err) console.error('kill-chrome:', err.message)
  })
  destroyOverlayWindow()
  resetSession()
  resetEscalation()
  broadcastSession()
})

ipcMain.handle('block-youtube', (_e, minutes: number) => {
  setBlock(minutes)
  destroyOverlayWindow()
  resetSession()
  resetEscalation()
  broadcastSession()
})

ipcMain.handle('get-block-remaining', () => blockRemainingMs())

ipcMain.handle('mark-ignore-used', () => markIgnoreUsed())

ipcMain.handle('window-minimize', () => mainWindow?.minimize())
ipcMain.handle('window-close', () => mainWindow?.hide())
ipcMain.handle('get-last-suggestion', () => lastSuggestionText)

ipcMain.handle('get-setting', (_e, key: string) => getSetting(key))
ipcMain.handle('set-setting', (_e, key: string, value: string) => setSetting(key, value))
ipcMain.handle('get-profile', () => getProfile())
ipcMain.handle('save-profile', (_e, type: string, summary: string) => saveProfile(type, summary))
ipcMain.handle('add-hobby', (_e, name: string, category: string) => addHobby(name, category))
ipcMain.handle('save-qa', (_e, question: string, answer: string) => saveQA(question, answer))
ipcMain.handle('get-sessions', (_e, limit?: number) => getSessions(limit))
ipcMain.handle('get-hobbies', () => getHobbies())
ipcMain.handle('start-game-timer', () => startGameTimer())
ipcMain.handle('stop-game-timer', () => stopGameTimer())
ipcMain.handle('get-game-session', () => getGameSession())

ipcMain.handle('get-thresholds', () => ({ ...THRESHOLDS }))
ipcMain.handle('set-thresholds', (_e, t: Partial<typeof THRESHOLDS>) => {
  updateThresholds(t)
  if (t.stage1)    setSetting('threshold_stage1',  String(t.stage1))
  if (t.stage2)    setSetting('threshold_stage2',  String(t.stage2))
  if (t.stage3)    setSetting('threshold_stage3',  String(t.stage3))
  if (t.idleReset) setSetting('threshold_idle',    String(t.idleReset))
})

ipcMain.handle('open-external', (_e, url: string) => {
  shell.openExternal(url)
})

ipcMain.handle('send-notification', (_e, title: string, body: string) => {
  new Notification({ title, body, silent: false }).show()
})

app.whenReady().then(() => {
  // Restore persisted thresholds
  const saved = {
    stage1:    getSetting('threshold_stage1'),
    stage2:    getSetting('threshold_stage2'),
    stage3:    getSetting('threshold_stage3'),
    idleReset: getSetting('threshold_idle'),
  }
  updateThresholds({
    ...(saved.stage1    && { stage1:    parseInt(saved.stage1) }),
    ...(saved.stage2    && { stage2:    parseInt(saved.stage2) }),
    ...(saved.stage3    && { stage3:    parseInt(saved.stage3) }),
    ...(saved.idleReset && { idleReset: parseInt(saved.idleReset) }),
  })

  createMainWindow()
  createTray()

  setInterval(() => {
    mainWindow?.webContents.send('game-timer-update', getGameSession())
    const msg = checkGameNotification()
    if (msg) {
      new Notification({ title: '🎮 ИГРОВОЙ ПЕРЕГРЕВ', body: msg }).show()
    }
  }, 5000)

  startWatcher((session) => {
    mainWindow?.webContents.send('session-update', session)

    // Reset escalation when idle timer auto-resets the session
    if (prevSessionMs > 0 && session.elapsedMs === 0) {
      resetEscalation()
    }
    prevSessionMs = session.elapsedMs

    // Soft-block: YouTube detected during block period → re-show Stage 3 overlay
    if (session.isYoutube && isBlocked()) {
      const now = Date.now()
      if (now - lastBlockAlertMs > BLOCK_ALERT_COOLDOWN) {
        lastBlockAlertMs = now
        if (!overlayWindow) createOverlayWindow(3)
        else overlayWindow.focus()
      }
    }

    handleStageChange(session, {
      onStage1: async (hobby) => {
        const text = await requestGeminiSuggestion(hobby)
        new Notification({
          title: '⚠ НЕЙРО-ПЕРЕГРУЗКА',
          body: text,
        }).show()
      },
      onStage2: () => {
        createOverlayWindow(2)
      },
      onStage3: () => {
        if (overlayWindow) {
          overlayWindow.webContents.send('set-stage', 3)
        } else {
          createOverlayWindow(3)
        }
      },
    })
  })
})

app.on('window-all-closed', () => {
  // Keep running in tray on Windows
})

app.on('before-quit', () => {
  stopWatcher()
})
