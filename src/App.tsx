import { useEffect } from 'react'
import { useAppStore } from './store/appStore'
import Dashboard from './components/Dashboard'
import Overlay from './components/Overlay'
import Onboarding from './components/Onboarding'
import Stats from './components/Stats'
import Profile from './components/Profile'
import type { SessionData } from './types'

export default function App() {
  const { view, setView, setSession, setProfile } = useAppStore()

  useEffect(() => {
    // Determine initial view from hash (overlay window uses #overlay)
    if (window.location.hash === '#overlay') {
      setView('overlay')
      return
    }

    // Check onboarding status, then load session + profile
    Promise.all([
      window.electronAPI?.getProfile(),
      window.electronAPI?.getSession(),
    ]).then(([profile, session]) => {
      if (session) setSession(session)
      if (profile) setProfile(profile)
      if (!profile || !profile.onboarding_done) setView('onboarding')
    })
  }, [])

  useEffect(() => {
    if (view === 'overlay') return

    const unsub = window.electronAPI?.onSessionUpdate((session: SessionData) => {
      setSession(session)
    })
    return () => unsub?.()
  }, [view])

  return (
    <>
      {/* Synthwave background layers */}
      <div className="sw-bg" />
      <div className="sw-sun" />
      <div className="sw-grid" />
      <div className="sw-scanlines" />

      {/* App content */}
      <div className="app-shell">
        {view === 'dashboard'  && <Dashboard onNavigate={setView} />}
        {view === 'overlay'    && <Overlay />}
        {view === 'onboarding' && <Onboarding onDone={() => setView('dashboard')} />}
        {view === 'stats'      && <Stats onBack={() => setView('dashboard')} />}
        {view === 'profile'    && <Profile onBack={() => setView('dashboard')} />}
      </div>
    </>
  )
}
