import { useEffect } from 'react'
import { useAppStore } from './store/appStore'
import Dashboard from './components/Dashboard'
import Overlay from './components/Overlay'
import Onboarding from './components/Onboarding'
import Stats from './components/Stats'
import Profile from './components/Profile'
import Settings from './components/Settings'
import { getSuggestion } from './hooks/useGemini'
import type { SessionData } from './types'

export default function App() {
  const { view, setView, setSession, setProfile, setSuggestion, profile } = useAppStore()

  useEffect(() => {
    if (window.location.hash.startsWith('#overlay')) {
      setView('overlay')
      return
    }

    Promise.all([
      window.electronAPI?.getProfile(),
      window.electronAPI?.getSession(),
    ]).then(([p, session]) => {
      if (session) setSession(session)
      if (p) setProfile(p)
      if (!p || !p.onboarding_done) setView('onboarding')
    })
  }, [])

  useEffect(() => {
    if (view === 'overlay') return
    const unsub = window.electronAPI?.onSessionUpdate((session: SessionData) => {
      setSession(session)
    })
    return () => unsub?.()
  }, [view])

  // Respond to main-process Gemini suggestion requests
  useEffect(() => {
    if (view === 'overlay') return
    const unsub = window.electronAPI?.onGetGeminiSuggestion(async (reqId, hobby) => {
      try {
        const apiKey = await window.electronAPI?.getSetting('gemini_api_key')
        if (apiKey && profile?.type && profile?.summary) {
          const text = await getSuggestion(apiKey, profile.type, profile.summary, hobby)
          setSuggestion(text)
          window.electronAPI?.sendGeminiSuggestion(reqId, text)
        } else {
          setSuggestion(hobby)
          window.electronAPI?.sendGeminiSuggestion(reqId, hobby)
        }
      } catch {
        setSuggestion(hobby)
        window.electronAPI?.sendGeminiSuggestion(reqId, hobby)
      }
    })
    return () => unsub?.()
  }, [view, profile])

  return (
    <>
      <div className="sw-bg" />
      <div className="sw-sun" />
      <div className="sw-grid" />
      <div className="sw-scanlines" />

      <div className="app-shell">
        {view === 'dashboard'  && <Dashboard onNavigate={setView} />}
        {view === 'overlay'    && <Overlay />}
        {view === 'onboarding' && <Onboarding onDone={() => setView('dashboard')} onSkip={() => setView('dashboard')} />}
        {view === 'stats'      && <Stats onBack={() => setView('dashboard')} />}
        {view === 'profile'    && <Profile onBack={() => setView('dashboard')} />}
        {view === 'settings'   && <Settings onBack={() => setView('dashboard')} />}
      </div>
    </>
  )
}
