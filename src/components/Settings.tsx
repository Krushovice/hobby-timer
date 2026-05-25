import { useEffect, useState } from 'react'
import type { ThresholdsData } from '../types/electron'

const MS_PER_MIN = 60_000

interface Props { onBack: () => void }

export default function Settings({ onBack }: Props) {
  const [stage1, setStage1]   = useState(30)
  const [stage2, setStage2]   = useState(45)
  const [stage3, setStage3]   = useState(60)
  const [idle,   setIdle]     = useState(5)
  const [saved,  setSaved]    = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.electronAPI?.getThresholds().then((t: ThresholdsData) => {
      setStage1(Math.round(t.stage1    / MS_PER_MIN))
      setStage2(Math.round(t.stage2    / MS_PER_MIN))
      setStage3(Math.round(t.stage3    / MS_PER_MIN))
      setIdle(  Math.round(t.idleReset / MS_PER_MIN))
      setLoading(false)
    })
  }, [])

  function handleSave() {
    window.electronAPI?.setThresholds({
      stage1:    stage1 * MS_PER_MIN,
      stage2:    stage2 * MS_PER_MIN,
      stage3:    stage3 * MS_PER_MIN,
      idleReset: idle   * MS_PER_MIN,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button className="sw-btn sw-btn-cyan no-drag" onClick={onBack}>← Назад</button>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '12px', letterSpacing: '0.2em', color: 'var(--accent-cyan)' }}>
          НАСТРОЙКИ
        </span>
      </div>

      {loading ? (
        <div className="sw-spinner" />
      ) : (
        <div className="sw-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '9px', letterSpacing: '0.2em', color: 'var(--accent-yellow)', marginBottom: '4px' }}>
            ◈ ПОРОГИ ЭСКАЛАЦИИ (МИНУТЫ)
          </div>

          <ThresholdRow label="Stage 1 — уведомление" value={stage1} onChange={setStage1} color="var(--accent-yellow)" />
          <ThresholdRow label="Stage 2 — оверлей" value={stage2} onChange={setStage2} color="var(--accent-magenta)" />
          <ThresholdRow label="Stage 3 — блокировка" value={stage3} onChange={setStage3} color="#ff2244" />

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '14px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '9px', letterSpacing: '0.2em', color: 'var(--accent-cyan)', marginBottom: '12px' }}>
              ◈ СБРОС ТАЙМЕРА
            </div>
            <ThresholdRow label="Бездействие Chrome (сброс)" value={idle} onChange={setIdle} color="var(--accent-cyan)" />
          </div>

          <button
            className="sw-btn sw-btn-magenta no-drag"
            style={{ width: '100%', marginTop: '4px' }}
            onClick={handleSave}
          >
            {saved ? '✓ СОХРАНЕНО' : '◈ СОХРАНИТЬ'}
          </button>
        </div>
      )}
    </div>
  )
}

function ThresholdRow({
  label, value, onChange, color,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  color: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between' }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'rgba(255,255,255,0.7)', flex: 1 }}>
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          className="no-drag"
          onClick={() => onChange(Math.max(1, value - 1))}
          style={btnStyle}
        >−</button>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 900, color, textShadow: `0 0 8px ${color}`, minWidth: '30px', textAlign: 'center' }}>
          {value}
        </span>
        <button
          className="no-drag"
          onClick={() => onChange(value + 1)}
          style={btnStyle}
        >+</button>
      </div>
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  width: 24,
  height: 24,
  borderRadius: '3px',
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.15)',
  color: 'rgba(255,255,255,0.7)',
  fontSize: '14px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  fontFamily: 'var(--font-mono)',
}
