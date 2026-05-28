import { useEffect, useState } from 'react'

const COUNTDOWN_SEC = 90

type Stage = 2 | 3

const PROFILE_LABELS: Record<string, string> = {
  ESCAPIST: 'ЭСКАПИСТ',
  PROCRASTINATOR: 'ПРОКРАСТИНАТОР',
  'INFO-ADDICT': 'ИНФО-ЗАВИСИМЫЙ',
  'DOPAMINE-SEEKER': 'ОХОТНИК ЗА ДОФАМИНОМ',
}

const STAGE2_MESSAGES: Record<string, string> = {
  ESCAPIST: 'Ты снова прячешься в экране.\nПора вернуться к реальности.',
  PROCRASTINATOR: 'Снова откладываешь важное?\nChrome — не замена делу.',
  'INFO-ADDICT': 'Информация без действия — просто шум.\nВремя сделать паузу.',
  'DOPAMINE-SEEKER': 'Следующий ролик не даст тебе кайфа.\nЦикл нужно разорвать.',
}

const STAGE3_MESSAGES: Record<string, string> = {
  ESCAPIST: 'Ты провёл в экране больше часа.\nПобег из реальности не решает проблем.',
  PROCRASTINATOR: 'Час потрачен впустую.\nЗакрой Chrome и сделай один шаг.',
  'INFO-ADDICT': 'Час потребления без создания.\nВыключи. Сейчас.',
  'DOPAMINE-SEEKER': 'Ты ищешь кайф уже час.\nЕго здесь нет. Выходи.',
}

function getInitialStage(): Stage {
  const hash = window.location.hash
  return hash.endsWith('/3') ? 3 : 2
}

export default function Overlay() {
  const [stage, setStage]       = useState<Stage>(getInitialStage)
  const [seconds, setSeconds]   = useState(COUNTDOWN_SEC)
  const [dismissed, setDismissed] = useState(false)
  const [profileType, setProfileType] = useState<string | null>(null)
  const [lastSuggestion, setLastSuggestion] = useState<string | null>(null)

  useEffect(() => {
    window.electronAPI?.getProfile().then((p) => {
      if (p?.type) setProfileType(p.type)
    })
    window.electronAPI?.getLastSuggestion().then((s) => {
      if (s) setLastSuggestion(s)
    })
    // Restore ignore state from session so it persists across overlay recreations
    window.electronAPI?.getSession().then((s) => {
      if (s?.ignoreUsed) setDismissed(true)
    })
  }, [])

  // Listen for stage changes from main process
  useEffect(() => {
    const unsub = window.electronAPI?.onSetStage((s) => {
      if (s === 2 || s === 3) setStage(s)
    })
    return () => unsub?.()
  }, [])

  // Countdown timer (Stage 2 only)
  useEffect(() => {
    if (stage !== 2) return
    if (seconds <= 0) return

    const id = setInterval(() => setSeconds((p) => p - 1), 1000)
    return () => clearInterval(id)
  }, [stage, seconds])

  function handleIgnore() {
    setDismissed(true)
    window.electronAPI?.markIgnoreUsed()
    window.electronAPI?.hideOverlay()
  }

  function handleKillChrome() {
    if (!confirm('Закрыть Chrome принудительно?')) return
    window.electronAPI?.killChrome()
  }

  function handleBlockYoutube() {
    if (!confirm('Заблокировать YouTube на 30 минут? При попытке открыть — оверлей вернётся.')) return
    window.electronAPI?.blockYoutube(30)
    window.electronAPI?.hideOverlay()
  }

  const pct = Math.round(((COUNTDOWN_SEC - seconds) / COUNTDOWN_SEC) * 100)

  return (
    <div
      className={stage === 3 ? 'glitch' : ''}
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(10, 0, 20, 0.82)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
      }}
    >
      {/* Scanlines on overlay too */}
      <div className="sw-scanlines" />

      <div
        className="sw-panel"
        style={{
          maxWidth: 480,
          width: '90%',
          padding: '32px 28px',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
          borderColor: stage === 3 ? 'rgba(255,34,68,0.5)' : 'rgba(255,102,0,0.4)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '16px' }}>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '12px',
              letterSpacing: '0.25em',
              color: stage === 3 ? 'var(--accent-red)' : 'var(--sun-orange)',
              textShadow: stage === 3 ? 'var(--glow-red)' : '0 0 8px #ff6600',
            }}
          >
            {stage === 2 ? '⚠ НЕЙРОННАЯ ПЕРЕГРУЗКА' : '🔴 КРИТИЧЕСКИЙ УРОВЕНЬ'}
          </div>
          {profileType && (
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '9px',
              letterSpacing: '0.15em',
              color: 'rgba(255,255,255,0.5)',
              border: '1px solid rgba(255,255,255,0.2)',
              padding: '2px 7px',
              borderRadius: '2px',
            }}>
              {PROFILE_LABELS[profileType] ?? profileType}
            </div>
          )}
        </div>

        {/* Big text */}
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            fontSize: stage === 3 ? '20px' : '17px',
            lineHeight: 1.5,
            marginBottom: lastSuggestion ? '12px' : '20px',
            color: '#fff',
            whiteSpace: 'pre-line',
          }}
        >
          {stage === 2
            ? (profileType && STAGE2_MESSAGES[profileType]) ?? 'Ты провёл в Chrome\nбольше 45 минут'
            : (profileType && STAGE3_MESSAGES[profileType]) ?? 'Ты провёл в Chrome\nбольше часа. Хватит.'}
        </div>

        {/* Last Gemini suggestion */}
        {lastSuggestion && (
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            color: 'var(--accent-yellow)',
            textShadow: 'var(--glow-yellow)',
            marginBottom: '16px',
            padding: '8px 12px',
            background: 'rgba(255,204,0,0.08)',
            borderLeft: '2px solid var(--accent-yellow)',
            textAlign: 'left',
            lineHeight: 1.5,
          }}>
            {lastSuggestion}
          </div>
        )}

        {/* Countdown (Stage 2) */}
        {stage === 2 && (
          <div style={{ marginBottom: '20px' }}>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '52px',
                fontWeight: 900,
                color: seconds <= 10 ? 'var(--accent-red)' : 'var(--accent-yellow)',
                textShadow: seconds <= 10 ? 'var(--glow-red)' : 'var(--glow-yellow)',
                lineHeight: 1,
                marginBottom: '10px',
              }}
            >
              {String(seconds).padStart(2, '0')}
            </div>
            <div className="sw-progress-track">
              <div
                className="sw-progress-fill stage-2"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {stage === 2 && !dismissed && (
            <button className="sw-btn sw-btn-magenta no-drag" onClick={handleIgnore}>
              Игнорировать (1 раз за сессию)
            </button>
          )}

          {stage === 3 && (
            <>
              <button
                className="sw-btn sw-btn-red no-drag"
                style={{ fontSize: '12px', padding: '12px 18px' }}
                onClick={handleKillChrome}
              >
                ⚡ ЗАКРЫТЬ CHROME
              </button>
              <button
                className="sw-btn sw-btn-magenta no-drag"
                onClick={handleBlockYoutube}
              >
                🔒 Заблокировать YouTube на 30 мин
              </button>
            </>
          )}

          <button
            className="sw-btn sw-btn-cyan no-drag"
            style={{ marginTop: '4px' }}
            onClick={() => window.electronAPI?.resetSession().then(() => window.electronAPI?.hideOverlay())}
          >
            ✓ Взять паузу — сбросить таймер
          </button>
        </div>
      </div>
    </div>
  )
}
