import db from './connection'

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS surveys (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      created_at DATETIME NOT NULL
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS dimensions (
      id TEXT PRIMARY KEY,
      survey_id TEXT NOT NULL,
      emoji TEXT NOT NULL,
      label TEXT NOT NULL,
      allow_text INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS feedbacks (
      id TEXT PRIMARY KEY,
      survey_id TEXT NOT NULL,
      text TEXT,
      created_at DATETIME NOT NULL,
      FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS ratings (
      id TEXT PRIMARY KEY,
      feedback_id TEXT NOT NULL,
      dimension_id TEXT NOT NULL,
      score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 5),
      FOREIGN KEY (feedback_id) REFERENCES feedbacks(id) ON DELETE CASCADE,
      FOREIGN KEY (dimension_id) REFERENCES dimensions(id) ON DELETE CASCADE
    )
  `)

  db.exec(`CREATE INDEX IF NOT EXISTS idx_dimensions_survey_id ON dimensions(survey_id)`)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_feedbacks_survey_id ON feedbacks(survey_id)`)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_ratings_feedback_id ON ratings(feedback_id)`)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_ratings_dimension_id ON ratings(dimension_id)`)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_surveys_code ON surveys(code)`)
}
