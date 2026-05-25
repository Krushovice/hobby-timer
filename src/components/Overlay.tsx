import { useEffect, useState } from 'react'

const COUNTDOWN_SEC = 90

type Stage = 2 | 3

export default function Overlay() {
  const [stage, setStage]       = useState<Stage>(2)
  const [seconds, setSeconds]   = useState(COUNTDOWN_SEC)
  const [dismissed, setDismissed] = useState(false)

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
    window.electronAPI?.hideOverlay()
  }

  function handleKillChrome() {
    if (!confirm('Закрыть Chrome принудительно?')) return
    window.electronAPI?.killChrome()
  }

  function handleBlockYoutube() {
    if (!confirm('Заблокировать youtube.com на 30 минут через hosts-файл?')) return
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
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '11px',
            letterSpacing: '0.25em',
            marginBottom: '16px',
            color: stage === 3 ? 'var(--accent-red)' : 'var(--sun-orange)',
            textShadow: stage === 3 ? 'var(--glow-red)' : '0 0 8px #ff6600',
          }}
        >
          {stage === 2 ? '⚠ НЕЙРОННАЯ ПЕРЕГРУЗКА' : '🔴 КРИТИЧЕСКИЙ УРОВЕНЬ'}
        </div>

        {/* Big text */}
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            fontSize: stage === 3 ? '22px' : '18px',
            lineHeight: 1.4,
            marginBottom: '20px',
            color: '#fff',
          }}
        >
          {stage === 2
            ? 'Ты провёл в Chrome\nбольше 45 минут'
            : 'Ты провёл в Chrome\nбольше часа. Хватит.'}
        </div>

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
