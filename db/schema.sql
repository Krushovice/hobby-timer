CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS profile (
  id            INTEGER PRIMARY KEY CHECK (id = 1),
  type          TEXT,    -- ESCAPIST | PROCRASTINATOR | INFO-ADDICT | DOPAMINE-SEEKER
  summary       TEXT,    -- Gemini-generated description
  onboarding_done INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS hobbies (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  category    TEXT,      -- спорт | творчество | обучение | прогулка | другое
  last_shown  INTEGER    -- unix timestamp
);

CREATE TABLE IF NOT EXISTS sessions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at  INTEGER NOT NULL,
  ended_at    INTEGER,
  duration_ms INTEGER DEFAULT 0,
  max_stage   INTEGER DEFAULT 0,
  youtube_ms  INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS onboarding_qa (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  question TEXT NOT NULL,
  answer   TEXT NOT NULL
);
