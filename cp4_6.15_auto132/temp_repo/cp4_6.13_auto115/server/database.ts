import Database from 'better-sqlite3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const db = new Database(path.join(__dirname, '..', 'survey.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS surveys (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    start_time TEXT,
    end_time TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    survey_id TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    required INTEGER DEFAULT 0,
    options TEXT,
    sort_order INTEGER NOT NULL,
    FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS responses (
    id TEXT PRIMARY KEY,
    survey_id TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS answers (
    id TEXT PRIMARY KEY,
    response_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    answer TEXT NOT NULL,
    FOREIGN KEY (response_id) REFERENCES responses(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
  );
`);

export interface Survey {
  id: string;
  title: string;
  description: string;
  start_time: string | null;
  end_time: string | null;
  created_at: string;
}

export interface Question {
  id: string;
  survey_id: string;
  type: 'single' | 'multiple' | 'text';
  title: string;
  required: number;
  options: string | null;
  sort_order: number;
}

export interface Response {
  id: string;
  survey_id: string;
  created_at: string;
}

export interface Answer {
  id: string;
  response_id: string;
  question_id: string;
  answer: string;
}

export interface SurveyWithQuestions extends Survey {
  questions: (Question & { options: string[] | null })[];
}

export function createSurvey(
  id: string,
  title: string,
  description: string,
  startTime: string | null,
  endTime: string | null,
  questions: { id: string; type: string; title: string; required: boolean; options: string[]; sortOrder: number }[]
): void {
  const insertSurvey = db.prepare(
    'INSERT INTO surveys (id, title, description, start_time, end_time) VALUES (?, ?, ?, ?, ?)'
  );
  const insertQuestion = db.prepare(
    'INSERT INTO questions (id, survey_id, type, title, required, options, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );

  const transaction = db.transaction(() => {
    insertSurvey.run(id, title, description, startTime, endTime);
    for (const q of questions) {
      insertQuestion.run(
        q.id,
        id,
        q.type,
        q.title,
        q.required ? 1 : 0,
        JSON.stringify(q.options),
        q.sortOrder
      );
    }
  });

  transaction();
}

export function updateSurvey(
  id: string,
  title: string,
  description: string,
  startTime: string | null,
  endTime: string | null,
  questions: { id: string; type: string; title: string; required: boolean; options: string[]; sortOrder: number }[]
): void {
  const updateSurvey = db.prepare(
    'UPDATE surveys SET title = ?, description = ?, start_time = ?, end_time = ? WHERE id = ?'
  );
  const deleteQuestions = db.prepare('DELETE FROM questions WHERE survey_id = ?');
  const insertQuestion = db.prepare(
    'INSERT INTO questions (id, survey_id, type, title, required, options, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );

  const transaction = db.transaction(() => {
    updateSurvey.run(title, description, startTime, endTime, id);
    deleteQuestions.run(id);
    for (const q of questions) {
      insertQuestion.run(
        q.id,
        id,
        q.type,
        q.title,
        q.required ? 1 : 0,
        JSON.stringify(q.options),
        q.sortOrder
      );
    }
  });

  transaction();
}

export function getSurvey(id: string): SurveyWithQuestions | null {
  const survey = db.prepare('SELECT * FROM surveys WHERE id = ?').get(id) as Survey | undefined;
  if (!survey) return null;

  const questions = db
    .prepare('SELECT * FROM questions WHERE survey_id = ? ORDER BY sort_order ASC')
    .all(id) as Question[];

  return {
    ...survey,
    questions: questions.map(q => ({
      ...q,
      options: q.options ? JSON.parse(q.options) : null
    }))
  };
}

export function getAllSurveys(): SurveyWithQuestions[] {
  const surveys = db.prepare('SELECT * FROM surveys ORDER BY created_at DESC').all() as Survey[];
  return surveys.map(s => {
    const questions = db
      .prepare('SELECT * FROM questions WHERE survey_id = ? ORDER BY sort_order ASC')
      .all(s.id) as Question[];
    return {
      ...s,
      questions: questions.map(q => ({
        ...q,
        options: q.options ? JSON.parse(q.options) : null
      }))
    };
  });
}

export function createResponse(
  id: string,
  surveyId: string,
  answers: { questionId: string; answer: string }[]
): void {
  const insertResponse = db.prepare('INSERT INTO responses (id, survey_id) VALUES (?, ?)');
  const insertAnswer = db.prepare(
    'INSERT INTO answers (id, response_id, question_id, answer) VALUES (?, ?, ?, ?)'
  );

  const transaction = db.transaction(() => {
    insertResponse.run(id, surveyId);
    for (const a of answers) {
      insertAnswer.run(uuidv4(), id, a.questionId, a.answer);
    }
  });

  transaction();
}

export function getResponsesWithAnswers(surveyId: string) {
  const responses = db.prepare('SELECT * FROM responses WHERE survey_id = ? ORDER BY created_at DESC').all(surveyId) as Response[];
  const answers = db.prepare('SELECT * FROM answers WHERE response_id IN (SELECT id FROM responses WHERE survey_id = ?)').all(surveyId) as Answer[];

  return { responses, answers };
}

export function getResponseCount(surveyId: string): number {
  const result = db.prepare('SELECT COUNT(*) as count FROM responses WHERE survey_id = ?').get(surveyId) as { count: number };
  return result.count;
}
