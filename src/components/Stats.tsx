import { useEffect, useState } from 'react'

interface SessionRow {
  id: number
  started_at: number
  ended_at: number | null
  duration_ms: number
  max_stage: number
  youtube_ms: number
}

interface DayStat {
  label: string        // "Пн 19"
  totalMs: number
  youtubeMs: number
  maxStage: number
  count: number
}

const STAGE_COLORS = ['transparent', 'var(--accent-yellow)', 'var(--sun-orange)', 'var(--accent-red)']
const STAGE_LABELS = ['—', 'Stage 1', 'Stage 2', 'Stage 3']

function msToHM(ms: number): string {
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  if (h === 0) return `${m}м`
  return `${h}ч ${m}м`
}

function dayKey(ts: number): string {
  return new Date(ts).toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric' })
}

function buildDayStats(sessions: SessionRow[]): DayStat[] {
  const map = new Map<string, DayStat>()

  // Last 7 days keys in order
  const now = Date.now()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now - i * 86_400_000)
    const k = d.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric' })
    map.set(k, { label: k, totalMs: 0, youtubeMs: 0, maxStage: 0, count: 0 })
  }

  for (const s of sessions) {
    const k = dayKey(s.started_at)
    if (!map.has(k)) continue
    const day = map.get(k)!
    day.totalMs   += s.duration_ms
    day.youtubeMs += s.youtube_ms
    day.maxStage   = Math.max(day.maxStage, s.max_stage)
    day.count      += 1
  }

  return Array.from(map.values())
}

interface Props { onBack: () => void }

export default function Stats({ onBack }: Props) {
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    window.electronAPI.getSessions(30).then((rows) => {
      setSessions(rows)
      setLoading(false)
    })
  }, [])

  const days = buildDayStats(sessions)
  const maxMs = Math.max(...days.map((d) => d.totalMs), 1)

  const totalAll   = sessions.reduce((a, s) => a + s.duration_ms, 0)
  const youtubeAll = sessions.reduce((a, s) => a + s.youtube_ms, 0)
  const worstStage = sessions.reduce((a, s) => Math.max(a, s.max_stage), 0)

  return (
    <div style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button className="sw-btn sw-btn-cyan no-drag" onClick={onBack} style={{ fontSize: '11px', padding: '6px 12px' }}>
          ← Назад
        </button>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '11px', letterSpacing: '0.25em', color: 'var(--accent-cyan)', textShadow: 'var(--glow-cyan)' }}>
          СТАТИСТИКА
        </span>
      </div>

      {loading ? (
        <div className="sw-panel" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="sw-spinner" />
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <StatCard label="ВСЕГО В CHROME" value={msToHM(totalAll)} color="var(--accent-cyan)" />
            <StatCard label="YOUTUBE" value={msToHM(youtubeAll)} color="var(--accent-magenta)" />
            <StatCard
              label="ХУДШИЙ СТЕЙДЖ"
              value={worstStage > 0 ? `Stage ${worstStage}` : '—'}
              color={STAGE_COLORS[worstStage] || 'rgba(255,255,255,0.4)'}
            />
          </div>

          {/* Bar chart — 7 days */}
          <div className="sw-panel" style={{ padding: '16px 20px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '9px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.35)', marginBottom: '14px' }}>
              ПОСЛЕДНИЕ 7 ДНЕЙ — ВРЕМЯ В CHROME
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '80px' }}>
              {days.map((d) => {
                const pct = maxMs > 0 ? (d.totalMs / maxMs) * 100 : 0
                const ytPct = d.totalMs > 0 ? (d.youtubeMs / d.totalMs) * 100 : 0
                return (
                  <div key={d.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{ width: '100%', height: `${Math.max(pct, 2)}%`, position: 'relative', borderRadius: '2px 2px 0 0', background: 'rgba(0,255,255,0.18)', boxShadow: pct > 0 ? '0 0 6px rgba(0,255,255,0.3)' : 'none', overflow: 'hidden', minHeight: d.totalMs > 0 ? '3px' : '2px' }}>
                      {/* YouTube portion in magenta */}
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${ytPct}%`, background: 'rgba(255,0,255,0.5)', transition: 'height 0.3s' }} />
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 1.2 }}>
                      {d.label}
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
              <LegendDot color="rgba(0,255,255,0.5)" label="Chrome" />
              <LegendDot color="rgba(255,0,255,0.5)" label="YouTube" />
            </div>
          </div>

          {/* Session table */}
          <div className="sw-panel" style={{ padding: '16px 20px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '9px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.35)', marginBottom: '12px' }}>
              ПОСЛЕДНИЕ СЕССИИ
            </div>
            {sessions.length === 0 ? (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '20px 0' }}>
                Сессий пока нет
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {/* Table header */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 60px 70px', gap: '8px', fontFamily: 'var(--font-display)', fontSize: '8px', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', paddingBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span>ДАТА</span><span style={{ textAlign: 'right' }}>ХРОМ</span><span style={{ textAlign: 'right' }}>YT</span><span style={{ textAlign: 'center' }}>СТЕЙДЖ</span>
                </div>
                {sessions.slice(0, 15).map((s) => (
                  <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 60px 70px', gap: '8px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(255,255,255,0.7)', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>
                      {new Date(s.started_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span style={{ textAlign: 'right', color: 'var(--accent-cyan)' }}>{msToHM(s.duration_ms)}</span>
                    <span style={{ textAlign: 'right', color: 'var(--accent-magenta)' }}>{msToHM(s.youtube_ms)}</span>
                    <span style={{ textAlign: 'center', fontSize: '10px', color: STAGE_COLORS[s.max_stage] || 'rgba(255,255,255,0.3)' }}>
                      {STAGE_LABELS[s.max_stage] || '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="sw-panel" style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '8px', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.35)' }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color, textShadow: `0 0 10px ${color}` }}>
        {value}
      </div>
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: color }} />
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>{label}</span>
    </div>
  )
}
