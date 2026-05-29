# NEURO-GUARD — Чеклист реализации

## ✅ Завершено

### Фундамент
- [x] Scaffold: Electron 32 + React 18 + Vite + TypeScript + TailwindCSS v4
- [x] `db/schema.sql` — таблицы: sessions, profile, settings, hobbies, onboarding_qa
- [x] `db/profile.ts` — CRUD для всех таблиц (getSetting, saveProfile, addHobby, getSessions и др.)
- [x] Zustand store (`appStore.ts`) — session, profile, view, suggestion
- [x] Типы (`src/types/`) — SessionData, ProfileData, HobbyData, ElectronAPI

### Electron main process
- [x] `electron/timer.ts` — счётчик сессии, пороги 30/45/60 мин, computeStage, resetSession
- [x] `electron/watcher.ts` — polling active-win каждые 5s, Chrome/YouTube детект по title
- [x] `electron/escalation.ts` — handleStageChange (Stage 1/2/3, one-shot per session)
- [x] `electron/hosts.ts` — blockYoutube / unblockYoutube / scheduleUnblock через hosts-файл
- [x] `electron/main.ts` — BrowserWindow, overlayWindow, Tray, IPC-роутинг
- [x] `electron/preload.ts` — contextBridge с полным API

### IPC (все каналы)
- [x] get-session / reset-session
- [x] show-overlay / hide-overlay
- [x] kill-chrome
- [x] **block-youtube** (баг исправлен — handler добавлен)
- [x] open-external / send-notification
- [x] get-setting / set-setting
- [x] get-profile / save-profile
- [x] add-hobby / save-qa
- [x] get-sessions

### UI компоненты
- [x] `App.tsx` — роутинг view, проверка onboarding_done на старте
- [x] `Dashboard.tsx` — главный экран, таймер, статус Chrome/YT, кнопки навигации
- [x] `Overlay.tsx` — Stage 2/3, countdown 90s, кнопки Kill Chrome / Block YouTube
- [x] `Onboarding.tsx` — 4 шага: API key → загрузка вопросов → Q&A → анализ → результат
- [x] `Profile.tsx` — отображение типа профиля и summary
- [x] `Stats.tsx` — карточки итогов, bar-chart 7 дней (Chrome + YouTube), таблица сессий

### Хуки и стили
- [x] `useGemini.ts` — generateOnboardingQuestions, analyzeProfile, getSuggestion
- [x] `synthwave.css` — переменные темы, анимации, `.sw-input`, `.sw-spinner`
- [x] `assets/icons/tray.png` — 32×32 RGBA, щит + «N», synthwave цвета

---

## ❌ Осталось сделать

### Критично (без этого app не работает корректно)

- [x] **Session persistence** — `flushSession` в watcher.ts: детект сброса по `elapsedMs === 0`,
  `startSession()` при первом Chrome-тике, `endSession()` при сбросе и при `stopWatcher`.
  Локально накапливаются `sessionYoutubeMs` и `sessionMaxStage`.

- [x] **Profile в Zustand на старте** — App.tsx: `setProfile(profile)` после getProfile IPC.
  Profile.tsx теперь получает данные после перезапуска приложения.

- [x] **npm install + проверка сборки** — 524 пакетов, 2 TS-ошибки исправлены, сборка OK.

### Средний приоритет

- [x] **Gemini suggestion в Stage 1** — IPC request/response: main → renderer (get-gemini-suggestion)
  → getSuggestion() через Gemini API → renderer → main (gemini-suggestion-result) → Notification.
  Fallback 10s → raw hobby name. Бонус: resetEscalation() при reset/kill/block.

- [x] **Profile.tsx — хобби-список** — get-hobbies IPC + color-coded category badges.

- [x] **Settings UI** — Settings.tsx с +/- спиннерами для Stage 1/2/3 и idle-reset (минуты).
  get-thresholds / set-thresholds IPC, значения персистятся в SQLite.

### Низкий приоритет

- [x] **electron-builder config** — `appId`, `productName`, `win.target: nsis`, `directories.output`,
  `files`, `asarUnpack` (better-sqlite3, active-win). Иконка: нужен `assets/icons/icon.ico` (256x256),
  пока не указан — electron-builder использует дефолт.
  Баги исправлены: `main` → `dist-electron/electron/main.js`; `schema.sql` копируется в
  `dist-electron/db/` в build-скрипте.

- [x] **Запуск от админа** — `nsis.requestExecutionLevel: requireAdministrator` в `package.json`.
  Installer требует UAC при установке → процесс запускается с правами admin.

- [x] **Тестирование Stage flow** — ручной прогон: Stage 0→1→2→3→kill/block.

- [ ] **Production build + .exe** — `npm run dist` → installer для Windows.

---

## 🐛 Баги из тестирования (нужно исправить)

- [ ] **Stage 1 — OS-уведомление не всплывает на Windows.**
  Toast через `new Notification()` не появляется как системное уведомление.
  Карточка НЕЙРО-СОВЕТ в Dashboard заполняется корректно (это работает).
  Возможные причины: `appUserModelId` не задан, уведомления заблокированы в настройках Windows,
  или нужен `app.setAppUserModelId()` в main.ts.

- [x] **Stage 3 — блокировка YouTube** — заменена на watcher soft-block (без hosts).
  При активном блоке + YouTube открыт → Stage 3 оверлей всплывает повторно (cooldown 60s).

- [ ] **Читаемость UI — критично.**
  На мониторе 3440×1440 текст в Stats/Dashboard нечитаем. Проблемные зоны:
  - Шрифт навигации, меток, таблицы сессий — слишком мелкий (9-11px)
  - Фиолетовый/серый текст теряется на синтвейв-фоне
  - Нужно: увеличить базовый размер, поднять контраст меток, возможно сменить Orbitron
    на более читаемый шрифт для мелких размеров.

---

## Следующий шаг

Тестирование Stage 1 OS-уведомления (appUserModelId добавлен) + UI readability pass.
