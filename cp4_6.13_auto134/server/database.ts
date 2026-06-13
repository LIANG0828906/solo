import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, '..', 'quiz.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    teacher_nickname TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id TEXT NOT NULL,
    question_number INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option TEXT NOT NULL,
    is_active INTEGER DEFAULT 0,
    is_ended INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id)
  );

  CREATE TABLE IF NOT EXISTS answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id TEXT NOT NULL,
    question_id INTEGER NOT NULL,
    student_nickname TEXT NOT NULL,
    selected_option TEXT NOT NULL,
    is_correct INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(id)
  );
`);

export type Question = {
  id: number;
  roomId: string;
  questionNumber: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  isActive: number;
  isEnded: number;
};

export type Answer = {
  id: number;
  roomId: string;
  questionId: number;
  studentNickname: string;
  selectedOption: string;
  isCorrect: number;
};

export type OptionStats = {
  option: string;
  count: number;
};

export type QuestionStats = {
  questionId: number;
  totalParticipants: number;
  correctCount: number;
  correctRate: number;
  options: OptionStats[];
};

export function createRoom(roomId: string, code: string, teacherNickname: string): void {
  const stmt = db.prepare('INSERT INTO rooms (id, code, teacher_nickname) VALUES (?, ?, ?)');
  stmt.run(roomId, code, teacherNickname);
}

export function getRoomByCode(code: string): { id: string; code: string; teacher_nickname: string } | undefined {
  const stmt = db.prepare('SELECT id, code, teacher_nickname FROM rooms WHERE code = ?');
  return stmt.get(code) as { id: string; code: string; teacher_nickname: string } | undefined;
}

export function addQuestion(
  roomId: string,
  questionNumber: number,
  questionText: string,
  optionA: string,
  optionB: string,
  optionC: string,
  optionD: string,
  correctOption: string
): number {
  const stmt = db.prepare(`
    INSERT INTO questions (room_id, question_number, question_text, option_a, option_b, option_c, option_d, correct_option)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(roomId, questionNumber, questionText, optionA, optionB, optionC, optionD, correctOption);
  return Number(result.lastInsertRowid);
}

export function activateQuestion(questionId: number): void {
  const stmt = db.prepare('UPDATE questions SET is_active = 1 WHERE id = ?');
  stmt.run(questionId);
}

export function endQuestion(questionId: number): void {
  const stmt = db.prepare('UPDATE questions SET is_active = 0, is_ended = 1 WHERE id = ?');
  stmt.run(questionId);
}

export function deactivateAllRoomQuestions(roomId: string): void {
  const stmt = db.prepare('UPDATE questions SET is_active = 0 WHERE room_id = ? AND is_active = 1');
  stmt.run(roomId);
}

export function getQuestionById(questionId: number): Question | undefined {
  const stmt = db.prepare('SELECT * FROM questions WHERE id = ?');
  const row = stmt.get(questionId) as any;
  if (!row) return undefined;
  return {
    id: row.id,
    roomId: row.room_id,
    questionNumber: row.question_number,
    questionText: row.question_text,
    optionA: row.option_a,
    optionB: row.option_b,
    optionC: row.option_c,
    optionD: row.option_d,
    correctOption: row.correct_option,
    isActive: row.is_active,
    isEnded: row.is_ended,
  };
}

export function getActiveQuestion(roomId: string): Question | undefined {
  const stmt = db.prepare('SELECT * FROM questions WHERE room_id = ? AND is_active = 1 LIMIT 1');
  const row = stmt.get(roomId) as any;
  if (!row) return undefined;
  return {
    id: row.id,
    roomId: row.room_id,
    questionNumber: row.question_number,
    questionText: row.question_text,
    optionA: row.option_a,
    optionB: row.option_b,
    optionC: row.option_c,
    optionD: row.option_d,
    correctOption: row.correct_option,
    isActive: row.is_active,
    isEnded: row.is_ended,
  };
}

export function getRoomQuestions(roomId: string): Question[] {
  const stmt = db.prepare('SELECT * FROM questions WHERE room_id = ? ORDER BY question_number ASC');
  const rows = stmt.all(roomId) as any[];
  return rows.map(row => ({
    id: row.id,
    roomId: row.room_id,
    questionNumber: row.question_number,
    questionText: row.question_text,
    optionA: row.option_a,
    optionB: row.option_b,
    optionC: row.option_c,
    optionD: row.option_d,
    correctOption: row.correct_option,
    isActive: row.is_active,
    isEnded: row.is_ended,
  }));
}

export function submitAnswer(
  roomId: string,
  questionId: number,
  studentNickname: string,
  selectedOption: string,
  correctOption: string
): { isDuplicate: boolean } {
  const checkStmt = db.prepare(
    'SELECT id FROM answers WHERE room_id = ? AND question_id = ? AND student_nickname = ?'
  );
  const existing = checkStmt.get(roomId, questionId, studentNickname);
  if (existing) return { isDuplicate: true };

  const isCorrect = selectedOption === correctOption ? 1 : 0;
  const stmt = db.prepare(`
    INSERT INTO answers (room_id, question_id, student_nickname, selected_option, is_correct)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(roomId, questionId, studentNickname, selectedOption, isCorrect);
  return { isDuplicate: false };
}

export function getQuestionStats(questionId: number): QuestionStats {
  const question = getQuestionById(questionId);
  if (!question) {
    return { questionId, totalParticipants: 0, correctCount: 0, correctRate: 0, options: [] };
  }

  const totalStmt = db.prepare('SELECT COUNT(*) as cnt FROM answers WHERE question_id = ?');
  const totalResult = totalStmt.get(questionId) as { cnt: number };
  const totalParticipants = totalResult.cnt;

  const correctStmt = db.prepare('SELECT COUNT(*) as cnt FROM answers WHERE question_id = ? AND is_correct = 1');
  const correctResult = correctStmt.get(questionId) as { cnt: number };
  const correctCount = correctResult.cnt;

  const correctRate = totalParticipants > 0 ? Math.round((correctCount / totalParticipants) * 100) : 0;

  const optionLabels = ['A', 'B', 'C', 'D'];
  const optionKeys = ['optionA', 'optionB', 'optionC', 'optionD'] as const;
  const options: OptionStats[] = [];

  for (let i = 0; i < 4; i++) {
    const optStmt = db.prepare('SELECT COUNT(*) as cnt FROM answers WHERE question_id = ? AND selected_option = ?');
    const optResult = optStmt.get(questionId, optionLabels[i]) as { cnt: number };
    options.push({
      option: optionLabels[i],
      count: optResult.cnt,
    });
  }

  return { questionId, totalParticipants, correctCount, correctRate, options };
}

export function hasStudentAnswered(questionId: number, studentNickname: string): boolean {
  const stmt = db.prepare(
    'SELECT id FROM answers WHERE question_id = ? AND student_nickname = ?'
  );
  return !!stmt.get(questionId, studentNickname);
}

export function getStudentAnswer(questionId: number, studentNickname: string): Answer | undefined {
  const stmt = db.prepare('SELECT * FROM answers WHERE question_id = ? AND student_nickname = ?');
  const row = stmt.get(questionId, studentNickname) as any;
  if (!row) return undefined;
  return {
    id: row.id,
    roomId: row.room_id,
    questionId: row.question_id,
    studentNickname: row.student_nickname,
    selectedOption: row.selected_option,
    isCorrect: row.is_correct,
  };
}
