import { useState, useRef } from 'react'
import { generateOnboardingQuestions, analyzeProfile } from '../hooks/useGemini'
import type { ProfileAnalysis } from '../hooks/useGemini'

type Step = 'key' | 'loading' | 'qa' | 'analyzing' | 'done'

const PROFILE_LABELS: Record<string, string> = {
  ESCAPIST: 'ЭСКАПИСТ',
  PROCRASTINATOR: 'ПРОКРАСТИНАТОР',
  'INFO-ADDICT': 'ИНФО-ЗАВИСИМЫЙ',
  'DOPAMINE-SEEKER': 'ОХОТНИК ЗА ДОФАМИНОМ',
}

const PROFILE_COLORS: Record<string, string> = {
  ESCAPIST: 'var(--accent-magenta)',
  PROCRASTINATOR: 'var(--accent-yellow)',
  'INFO-ADDICT': 'var(--accent-cyan)',
  'DOPAMINE-SEEKER': 'var(--accent-red)',
}

interface Props { onDone: () => void; onSkip?: () => void }

export default function Onboarding({ onDone, onSkip }: Props) {
  const [step, setStep] = useState<Step>('key')
  const [apiKey, setApiKey] = useState('')
  const [keyError, setKeyError] = useState('')
  const [error, setError] = useState('')
  const [questions, setQuestions] = useState<string[]>([])
  const [currentQ, setCurrentQ] = useState(0)
  const answersRef = useRef<string[]>([])
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [analysis, setAnalysis] = useState<ProfileAnalysis | null>(null)

  async function handleKeySubmit() {
    const key = apiKey.trim()
    if (!key) { setKeyError('Введите API ключ'); return }
    setKeyError('')
    setError('')
    setStep('loading')

    try {
      const qs = await generateOnboardingQuestions(key)
      answersRef.current = new Array(qs.length).fill('')
      setQuestions(qs)
      setCurrentQ(0)
      setStep('qa')
    } catch (e: any) {
      setError(e?.message ?? 'Ошибка Gemini API. Проверьте ключ.')
      setStep('key')
    }
  }

  async function handleAnswerNext() {
    const ans = currentAnswer.trim()
    if (!ans) return

    answersRef.current[currentQ] = ans
    setCurrentAnswer('')

    if (currentQ + 1 < questions.length) {
      setCurrentQ((q) => q + 1)
      return
    }

    setStep('analyzing')
    setError('')

    try {
      const qa = questions.map((q, i) => ({ question: q, answer: answersRef.current[i] }))
      for (const item of qa) {
        await window.electronAPI.saveQA(item.question, item.answer)
      }
      const result = await analyzeProfile(apiKey.trim(), qa)
      setAnalysis(result)
      setStep('done')
    } catch (e: any) {
      setError(e?.message ?? 'Ошибка анализа. Попробуйте ещё раз.')
      setCurrentQ(questions.length - 1)
      setCurrentAnswer(answersRef.current[questions.length - 1])
      setStep('qa')
    }
  }

  async function handleFinish() {
    if (!analysis) return
    await window.electronAPI.saveProfile(analysis.type, analysis.summary)
    for (const h of analysis.hobbies) {
      await window.electronAPI.addHobby(h.name, h.category)
    }
    await window.electronAPI.setSetting('gemini_api_key', apiKey.trim())
    onDone()
  }

  const accentColor = analysis ? (PROFILE_COLORS[analysis.type] ?? 'var(--accent-magenta)') : 'var(--accent-magenta)'

  return (
    <div style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '12px', letterSpacing: '0.25em', color: 'var(--accent-magenta)', textShadow: 'var(--glow-magenta)' }}>
          ИНИЦИАЛИЗАЦИЯ ПРОФИЛЯ
        </div>
        {onSkip && (
          <button
            className="sw-btn sw-btn-cyan no-drag"
            style={{ fontSize: '10px', padding: '5px 10px', opacity: 0.6 }}
            onClick={onSkip}
          >
            ← Назад
          </button>
        )}
      </div>

      {/* ── Step: API Key ── */}
      {step === 'key' && (
        <div className="sw-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', padding: '28px 24px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700, color: '#fff' }}>
            ВВЕДИ GEMINI API КЛЮЧ
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>
            Gemini 2.5 Flash — бесплатный tier.<br />
            Ключ хранится локально в SQLite.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input
              type="password"
              className="sw-input"
              placeholder="AIza..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleKeySubmit()}
              style={{ width: '100%', boxSizing: 'border-box' }}
              autoFocus
            />
            {keyError && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent-red)' }}>
                {keyError}
              </span>
            )}
            {error && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent-red)', wordBreak: 'break-all' }}>
                {error}
              </span>
            )}
          </div>

          <button
            className="sw-btn sw-btn-cyan no-drag"
            onClick={() => window.electronAPI.openExternal('https://aistudio.google.com/app/apikey')}
            style={{ fontSize: '11px', padding: '8px 12px' }}
          >
            Получить ключ бесплатно →
          </button>

          <button className="sw-btn sw-btn-magenta no-drag" onClick={handleKeySubmit}>
            НАЧАТЬ ОНБОРДИНГ
          </button>
        </div>
      )}

      {/* ── Step: Loading questions ── */}
      {step === 'loading' && (
        <div className="sw-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '13px', letterSpacing: '0.2em', color: 'var(--accent-cyan)', textShadow: 'var(--glow-cyan)' }}>
            ГЕНЕРАЦИЯ ВОПРОСОВ...
          </div>
          <div className="sw-spinner" />
        </div>
      )}

      {/* ── Step: Q&A ── */}
      {step === 'qa' && questions.length > 0 && (
        <div className="sw-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', padding: '28px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '10px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)' }}>
              ВОПРОС {currentQ + 1} ИЗ {questions.length}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>
              {Math.round(((currentQ) / questions.length) * 100)}%
            </div>
          </div>

          <div className="sw-progress-track" style={{ marginBottom: '4px' }}>
            <div
              className="sw-progress-fill"
              style={{ width: `${(currentQ / questions.length) * 100}%`, background: 'var(--accent-cyan)', boxShadow: 'var(--glow-cyan)' }}
            />
          </div>

          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: '#fff', lineHeight: 1.6, flex: 1 }}>
            {questions[currentQ]}
          </div>

          <textarea
            className="sw-input"
            rows={4}
            placeholder="Твой ответ..."
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) handleAnswerNext() }}
            style={{ width: '100%', boxSizing: 'border-box', resize: 'none' }}
            autoFocus
          />

          {error && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent-red)' }}>
              {error}
            </span>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            {currentQ > 0 && (
              <button
                className="sw-btn sw-btn-cyan no-drag"
                style={{ flex: '0 0 auto', fontSize: '11px', padding: '10px 14px' }}
                onClick={() => { setCurrentQ((q) => q - 1); setCurrentAnswer(answersRef.current[currentQ - 1]) }}
              >
                ←
              </button>
            )}
            <button
              className="sw-btn sw-btn-magenta no-drag"
              style={{ flex: 1 }}
              onClick={handleAnswerNext}
              disabled={!currentAnswer.trim()}
            >
              {currentQ + 1 === questions.length ? 'ЗАВЕРШИТЬ' : 'ДАЛЕЕ →'}
            </button>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
            Ctrl+Enter для отправки
          </div>
        </div>
      )}

      {/* ── Step: Analyzing ── */}
      {step === 'analyzing' && (
        <div className="sw-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '13px', letterSpacing: '0.2em', color: 'var(--accent-yellow)', textShadow: 'var(--glow-yellow)' }}>
            АНАЛИЗ ПРОФИЛЯ...
          </div>
          <div className="sw-spinner" />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
            Gemini обрабатывает твои ответы
          </div>
        </div>
      )}

      {/* ── Step: Done / Result ── */}
      {step === 'done' && analysis && (
        <div className="sw-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', padding: '28px 24px', overflowY: 'auto' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '10px', letterSpacing: '0.25em', color: 'rgba(255,255,255,0.4)', marginBottom: '10px' }}>
              ТВОй ПРОФИЛЬ
            </div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '24px',
              fontWeight: 900,
              color: accentColor,
              textShadow: `0 0 20px ${accentColor}`,
              letterSpacing: '0.05em',
              marginBottom: '16px',
            }}>
              {PROFILE_LABELS[analysis.type] ?? analysis.type}
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: 'rgba(255,255,255,0.7)',
              lineHeight: 1.7,
              marginBottom: '20px',
              borderLeft: `2px solid ${accentColor}`,
              paddingLeft: '12px',
              textAlign: 'left',
            }}>
              {analysis.summary}
            </div>
          </div>

          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '10px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)', marginBottom: '10px' }}>
              АЛЬТЕРНАТИВЫ YOUTUBE
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {analysis.hobbies.map((h, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  padding: '8px 12px',
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: '4px',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}>
                  <span style={{ color: accentColor, flexShrink: 0 }}>▸</span>
                  <span style={{ color: '#fff', flex: 1 }}>{h.name}</span>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px' }}>{h.category}</span>
                </div>
              ))}
            </div>
          </div>

          <button className="sw-btn sw-btn-magenta no-drag" onClick={handleFinish} style={{ marginTop: 'auto' }}>
            ЗАПУСТИТЬ NEURO-GUARD →
          </button>
        </div>
      )}
    </div>
  )
}
