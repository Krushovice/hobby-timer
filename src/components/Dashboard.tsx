import { useAppStore } from '../store/appStore'

const STAGE_LABELS = ['МОНИТОРИНГ', 'ПРЕДУПРЕЖДЕНИЕ', 'ТРЕВОГА', 'КРИТИЧНО']
const STAGE_BADGE  = ['stage-badge-0', 'stage-badge-1', 'stage-badge-2', 'stage-badge-3']
const THRESHOLD_MS = [30 * 60000, 45 * 60000, 60 * 60000]

function formatTime(ms: number): string {
  const total = Math.floor(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function progressPercent(elapsedMs: number, stage: number): number {
  const start = stage > 0 ? THRESHOLD_MS[stage - 1] : 0
  const end   = THRESHOLD_MS[stage] ?? THRESHOLD_MS[2]
  const capped = Math.min(elapsedMs, end)
  return Math.round(((capped - start) / (end - start)) * 100)
}

interface Props {
  onNavigate: (view: 'stats' | 'profile' | 'onboarding' | 'settings') => void
}

export default function Dashboard({ onNavigate }: Props) {
  const { session, suggestion } = useAppStore()
  const { elapsedMs, isChrome, isYoutube, stage, lastSite } = session

  const pct = progressPercent(elapsedMs, stage)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0' }}>
      {/* Title bar — drag region */}
      <div
        className="drag-region"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px 8px',
          borderBottom: '1px solid rgba(255,0,255,0.15)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '13px',
            fontWeight: 900,
            letterSpacing: '0.2em',
            color: 'var(--accent-magenta)',
            textShadow: 'var(--glow-magenta)',
          }}
        >
          ◈ NEURO-GUARD
        </span>
        <div className="no-drag" style={{ display: 'flex', gap: '6px' }}>
          <WinBtn onClick={() => {}} color="#ffcc00" title="Свернуть" symbol="─" />
          <WinBtn onClick={() => window.electronAPI?.killChrome()} color="#ff2244" title="Выход" symbol="×" />
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>

        {/* Timer block */}
        <div className="sw-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em' }}>
              CHROME АКТИВЕН
            </span>
            <span className={`stage-badge ${STAGE_BADGE[stage]}`}>
              {STAGE_LABELS[stage]}
            </span>
          </div>

          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '42px',
              fontWeight: 900,
              letterSpacing: '0.05em',
              lineHeight: 1,
              marginBottom: '12px',
            }}
            className={stage >= 3 ? 'text-red-neon' : stage >= 2 ? 'text-yellow' : stage >= 1 ? 'text-yellow' : 'text-cyan'}
          >
            {formatTime(elapsedMs)}
          </div>

          <div className="sw-progress-track">
            <div
              className={`sw-progress-fill stage-${stage}`}
              style={{ width: `${pct}%` }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
            {THRESHOLD_MS.map((_t, i) => (
              <span key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'rgba(255,255,255,0.3)' }}>
                {i === 0 ? '30м' : i === 1 ? '45м' : '60м'}
              </span>
            ))}
          </div>
        </div>

        {/* Status row */}
        <div className="sw-panel" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <StatusDot active={isChrome} color="var(--accent-cyan)" />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', flex: 1 }}>
            {isChrome
              ? isYoutube
                ? <><span className="text-red-neon">▶ YouTube</span></>
                : <><span className="text-cyan">● Chrome</span></>
              : <span style={{ color: 'rgba(255,255,255,0.3)' }}>● Неактивен</span>
            }
          </span>
          {lastSite && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>
              {lastSite}
            </span>
          )}
        </div>

        {/* Suggestion card */}
        {suggestion && (
          <div
            className="sw-panel"
            style={{
              padding: '12px 16px',
              borderColor: 'rgba(255, 204, 0, 0.3)',
            }}
          >
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '9px', letterSpacing: '0.15em', color: 'var(--accent-yellow)', marginBottom: '6px' }}>
              ◈ НЕЙРО-СОВЕТ
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>
              {suggestion}
            </div>
          </div>
        )}

        {/* Reset button */}
        <button
          className="sw-btn sw-btn-cyan no-drag"
          style={{ width: '100%' }}
          onClick={() => window.electronAPI?.resetSession()}
        >
          ↺ Сбросить таймер
        </button>
      </div>

      {/* Bottom nav */}
      <div
        className="no-drag"
        style={{
          display: 'flex',
          borderTop: '1px solid rgba(255,0,255,0.15)',
          padding: '8px 14px',
          gap: '8px',
        }}
      >
        <NavBtn label="ПРОФИЛЬ" onClick={() => onNavigate('profile')} />
        <NavBtn label="СТАТИСТИКА" onClick={() => onNavigate('stats')} />
        <NavBtn label="НАСТРОЙКИ" onClick={() => onNavigate('settings')} />
        <NavBtn label="ОНБОРДИНГ" onClick={() => onNavigate('onboarding')} />
      </div>
    </div>
  )
}

function WinBtn({ onClick, color, title, symbol }: { onClick: () => void; color: string; title: string; symbol: string }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        width: 14,
        height: 14,
        borderRadius: '50%',
        background: color,
        border: 'none',
        fontSize: '9px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'rgba(0,0,0,0.6)',
        fontWeight: 900,
        opacity: 0.7,
        transition: 'opacity 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
      onMouseLeave={e => (e.currentTarget.style.opacity = '0.7')}
    >
      {symbol}
    </button>
  )
}

function StatusDot({ active, color }: { active: boolean; color: string }) {
  return (
    <span
      style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: active ? color : 'rgba(255,255,255,0.15)',
        boxShadow: active ? `0 0 6px ${color}` : 'none',
        display: 'inline-block',
        flexShrink: 0,
        transition: 'background 0.3s',
      }}
    />
  )
}

function NavBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        fontFamily: 'var(--font-display)',
        fontSize: '8px',
        fontWeight: 700,
        letterSpacing: '0.12em',
        color: 'rgba(255,255,255,0.4)',
        background: 'transparent',
        border: '1px solid rgba(255,255,255,0.08)',
        padding: '6px 4px',
        borderRadius: '3px',
        transition: 'color 0.15s, border-color 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.color = 'var(--accent-cyan)'
        e.currentTarget.style.borderColor = 'rgba(0,255,255,0.4)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.color = 'rgba(255,255,255,0.4)'
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
      }}
    >
      {label}
    </button>
  )
}
