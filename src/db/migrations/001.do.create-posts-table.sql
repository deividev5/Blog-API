CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  titulo TEXT NOT NULL,
  content TEXT NOT NULL,
  published_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMP,
  rejected_at TIMESTAMP
);
