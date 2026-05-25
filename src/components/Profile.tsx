import { useAppStore } from '../store/appStore'

interface Props { onBack: () => void }

export default function Profile({ onBack }: Props) {
  const { profile } = useAppStore()

  return (
    <div style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
    </div>
  )
}
