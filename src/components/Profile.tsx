import { useEffect, useState } from 'react'
import { useAppStore } from '../store/appStore'
import type { HobbyData } from '../types'

const CATEGORY_COLORS: Record<string, string> = {
  'спорт':      'var(--accent-cyan)',
  'творчество': 'var(--accent-magenta)',
  'обучение':   'var(--accent-yellow)',
  'прогулка':   '#88ff88',
  'другое':     'rgba(255,255,255,0.4)',
}

interface Props { onBack: () => void }

export default function Profile({ onBack }: Props) {
  const { profile } = useAppStore()
  const [hobbies, setHobbies] = useState<HobbyData[]>([])

  useEffect(() => {
    window.electronAPI?.getHobbies().then(setHobbies)
  }, [])

  return (
    <div style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button className="sw-btn sw-btn-cyan no-drag" onClick={onBack}>← Назад</button>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '12px', letterSpacing: '0.2em', color: 'var(--accent-cyan)' }}>
          НЕЙРО-ПРОФИЛЬ
        </span>
      </div>

      <div className="sw-panel" style={{ padding: '20px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 900, color: 'var(--accent-magenta)', textShadow: 'var(--glow-magenta)', marginBottom: '10px' }}>
          {profile?.type ?? '???'}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
          {profile?.summary ?? 'Пройди онбординг для создания профиля'}
        </div>
      </div>

      {hobbies.length > 0 && (
        <div className="sw-panel" style={{ padding: '16px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '9px', letterSpacing: '0.2em', color: 'var(--accent-yellow)', marginBottom: '12px' }}>
            ◈ АЛЬТЕРНАТИВЫ YOUTUBE
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {hobbies.map((h) => (
              <div
                key={h.id}
                style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
              >
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9px',
                  padding: '2px 6px',
                  borderRadius: '2px',
                  border: `1px solid ${CATEGORY_COLORS[h.category] ?? CATEGORY_COLORS['другое']}`,
                  color: CATEGORY_COLORS[h.category] ?? CATEGORY_COLORS['другое'],
                  minWidth: '68px',
                  textAlign: 'center',
                }}>
                  {h.category}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'rgba(255,255,255,0.85)' }}>
                  {h.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
