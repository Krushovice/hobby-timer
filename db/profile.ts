import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { app } from 'electron'

const DB_PATH = path.join(app.getPath('userData'), 'neuro-guard.db')
const SCHEMA = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8')

let db: Database.Database

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH)
    db.exec(SCHEMA)
    db.pragma('journal_mode = WAL')
  }
  return db
}

// Settings
export function getSetting(key: string): string | null {
  const row = getDb().prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined
  return row?.value ?? null
}

export function setSetting(key: string, value: string): void {
  getDb().prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value)
}

// Profile
export interface ProfileRow {
  type: string | null
  summary: string | null
  onboarding_done: number
}

export function getProfile(): ProfileRow {
  const row = getDb()
    .prepare('SELECT type, summary, onboarding_done FROM profile WHERE id = 1')
    .get() as ProfileRow | undefined
  return row ?? { type: null, summary: null, onboarding_done: 0 }
}

export function saveProfile(type: string, summary: string): void {
  getDb()
    .prepare('INSERT OR REPLACE INTO profile (id, type, summary, onboarding_done) VALUES (1, ?, ?, 1)')
    .run(type, summary)
}

// Hobbies
export interface HobbyRow {
  id: number
  name: string
  category: string
}

export function getHobbies(): HobbyRow[] {
  return getDb().prepare('SELECT id, name, category FROM hobbies ORDER BY last_shown ASC').all() as HobbyRow[]
}

export function addHobby(name: string, category = 'другое'): void {
  getDb().prepare('INSERT INTO hobbies (name, category) VALUES (?, ?)').run(name, category)
}

export function getHobbySuggestion(): string {
  const hobbies = getHobbies()
  if (!hobbies.length) return 'Встань, разомнись, выпей воды'

  // Pick least-recently shown
  const hobby = hobbies[0]
  getDb()
    .prepare('UPDATE hobbies SET last_shown = ? WHERE id = ?')
    .run(Date.now(), hobby.id)

  return hobby.name
}

// Sessions
export function startSession(): number {
  const result = getDb()
    .prepare('INSERT INTO sessions (started_at, duration_ms, max_stage, youtube_ms) VALUES (?, 0, 0, 0)')
    .run(Date.now())
  return Number(result.lastInsertRowid)
}

export function endSession(id: number, durationMs: number, maxStage: number, youtubeMs: number): void {
  getDb()
    .prepare('UPDATE sessions SET ended_at = ?, duration_ms = ?, max_stage = ?, youtube_ms = ? WHERE id = ?')
    .run(Date.now(), durationMs, maxStage, youtubeMs, id)
}

export interface SessionRow {
  id: number
  started_at: number
  ended_at: number | null
  duration_ms: number
  max_stage: number
  youtube_ms: number
}

export function getSessions(limit = 30): SessionRow[] {
  return getDb()
    .prepare('SELECT * FROM sessions WHERE ended_at IS NOT NULL ORDER BY started_at DESC LIMIT ?')
    .all(limit) as SessionRow[]
}

// Onboarding Q&A
export function saveQA(question: string, answer: string): void {
  getDb().prepare('INSERT INTO onboarding_qa (question, answer) VALUES (?, ?)').run(question, answer)
}

export function getAllQA(): { question: string; answer: string }[] {
  return getDb().prepare('SELECT question, answer FROM onboarding_qa').all() as { question: string; answer: string }[]
}
