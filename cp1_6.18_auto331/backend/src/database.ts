import initSqlJs, { Database } from 'sql.js';
import path from 'path';
import fs from 'fs';

let db: Database | null = null;

const dbDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dbDir, 'voitemap.db');

export async function initDatabase(): Promise<void> {
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const SQL = await initSqlJs();

  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      word TEXT NOT NULL,
      ipa TEXT NOT NULL,
      description TEXT,
      audio_path TEXT,
      audio_duration INTEGER DEFAULT 0,
      waveform_data TEXT,
      language_family TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  const userCount = db.exec('SELECT COUNT(*) as count FROM users')[0]?.values[0]?.[0] || 0;
  if (userCount === 0) {
    db.run('INSERT INTO users (username, password) VALUES (?, ?)', ['demo', 'demo123']);
  }

  const noteCount = db.exec('SELECT COUNT(*) as count FROM notes')[0]?.values[0]?.[0] || 0;
  if (noteCount === 0) {
    const demoNotes = [
      { user_id: 1, word: 'hello', ipa: '/həˈloʊ/', description: '英语常用问候语', audio_path: null, audio_duration: 800, language_family: '印欧语系' },
      { user_id: 1, word: 'bonjour', ipa: '/bɔ̃ʒuʁ/', description: '法语你好', audio_path: null, audio_duration: 700, language_family: '印欧语系' },
      { user_id: 1, word: '你好', ipa: '/ni³⁵ xau²¹⁴/', description: '中文问候语', audio_path: null, audio_duration: 600, language_family: '汉藏语系' },
      { user_id: 1, word: 'こんにちは', ipa: '/koɲɲit͡ɕiwa/', description: '日语你好', audio_path: null, audio_duration: 900, language_family: '日本-琉球语系' },
      { user_id: 1, word: '안녕하세요', ipa: '/annjʌŋhasejo/', description: '韩语你好', audio_path: null, audio_duration: 850, language_family: '朝鲜语系' },
      { user_id: 1, word: 'gracias', ipa: '/ˈɡɾaθjas/', description: '西班牙语谢谢', audio_path: null, audio_duration: 650, language_family: '印欧语系' },
      { user_id: 1, word: 'water', ipa: '/ˈwɔːtər/', description: '英语水', audio_path: null, audio_duration: 550, language_family: '印欧语系' },
      { user_id: 1, word: '水', ipa: '/ʂueɪ²¹⁴/', description: '中文水', audio_path: null, audio_duration: 450, language_family: '汉藏语系' },
      { user_id: 1, word: 'ciao', ipa: '/ˈtʃaʊ/', description: '意大利语你好/再见', audio_path: null, audio_duration: 500, language_family: '印欧语系' },
      { user_id: 1, word: 'مرحبا', ipa: '/marħaba/', description: '阿拉伯语你好', audio_path: null, audio_duration: 750, language_family: '亚非语系' },
    ];

    const stmt = db.prepare(
      'INSERT INTO notes (user_id, word, ipa, description, audio_path, audio_duration, waveform_data, language_family) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );

    demoNotes.forEach((note) => {
      const waveformData = generateDemoWaveform(note.audio_duration);
      stmt.run([
        note.user_id,
        note.word,
        note.ipa,
        note.description,
        note.audio_path,
        note.audio_duration,
        JSON.stringify(waveformData),
        note.language_family,
      ]);
    });

    stmt.free();
  }

  saveDatabase();
}

function generateDemoWaveform(durationMs: number): number[] {
  const samples = durationMs;
  const data: number[] = [];
  for (let i = 0; i < samples; i++) {
    const t = i / samples;
    const envelope = Math.sin(Math.PI * t);
    const wave = Math.sin(i * 0.05) * 0.3 + Math.sin(i * 0.12) * 0.2 + Math.sin(i * 0.08) * 0.15;
    const value = Math.abs(envelope * wave) + Math.random() * 0.1;
    data.push(Math.min(1, Math.max(0, value)));
  }
  return data;
}

function saveDatabase(): void {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

export interface User {
  id: number;
  username: string;
  password: string;
  created_at: string;
}

export interface Note {
  id: number;
  user_id: number;
  word: string;
  ipa: string;
  description: string;
  audio_path: string | null;
  audio_duration: number;
  waveform_data: string | null;
  language_family: string;
  created_at: string;
}

function rowToUser(row: any[]): User {
  return {
    id: row[0],
    username: row[1],
    password: row[2],
    created_at: row[3],
  };
}

function rowToNote(row: any[]): Note {
  return {
    id: row[0],
    user_id: row[1],
    word: row[2],
    ipa: row[3],
    description: row[4],
    audio_path: row[5],
    audio_duration: row[6],
    waveform_data: row[7],
    language_family: row[8],
    created_at: row[9],
  };
}

export const userQueries = {
  findByUsername: (username: string): User | undefined => {
    if (!db) return undefined;
    const result = db.exec('SELECT * FROM users WHERE username = ?', [username]);
    if (result.length === 0 || result[0].values.length === 0) return undefined;
    return rowToUser(result[0].values[0]);
  },

  findById: (id: number): User | undefined => {
    if (!db) return undefined;
    const result = db.exec('SELECT * FROM users WHERE id = ?', [id]);
    if (result.length === 0 || result[0].values.length === 0) return undefined;
    return rowToUser(result[0].values[0]);
  },

  create: (username: string, password: string): number => {
    if (!db) return 0;
    db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, password]);
    const result = db.exec('SELECT last_insert_rowid()');
    saveDatabase();
    return result[0].values[0][0] as number;
  },
};

export const noteQueries = {
  findAllByUserId: (userId: number): Note[] => {
    if (!db) return [];
    const result = db.exec(
      'SELECT * FROM notes WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    if (result.length === 0) return [];
    return result[0].values.map(rowToNote);
  },

  findById: (id: number): Note | undefined => {
    if (!db) return undefined;
    const result = db.exec('SELECT * FROM notes WHERE id = ?', [id]);
    if (result.length === 0 || result[0].values.length === 0) return undefined;
    return rowToNote(result[0].values[0]);
  },

  create: (note: Omit<Note, 'id' | 'created_at'>): number => {
    if (!db) return 0;
    const stmt = db.prepare(
      'INSERT INTO notes (user_id, word, ipa, description, audio_path, audio_duration, waveform_data, language_family) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    stmt.run([
      note.user_id,
      note.word,
      note.ipa,
      note.description,
      note.audio_path,
      note.audio_duration,
      note.waveform_data,
      note.language_family,
    ]);
    stmt.free();
    const result = db.exec('SELECT last_insert_rowid()');
    saveDatabase();
    return result[0].values[0][0] as number;
  },

  update: (id: number, note: Partial<Note>): boolean => {
    if (!db) return false;
    const fields = Object.keys(note).filter((k) => k !== 'id' && k !== 'user_id');
    if (fields.length === 0) return false;

    const setClause = fields.map((f) => `${f} = ?`).join(', ');
    const values = fields.map((f) => (note as any)[f]);
    values.push(id);

    db.run(`UPDATE notes SET ${setClause} WHERE id = ?`, values);
    saveDatabase();
    return true;
  },

  remove: (id: number): boolean => {
    if (!db) return false;
    db.run('DELETE FROM notes WHERE id = ?', [id]);
    saveDatabase();
    return true;
  },

  getStatsByFamily: (userId: number): { language_family: string; count: number }[] => {
    if (!db) return [];
    const result = db.exec(
      'SELECT language_family, COUNT(*) as count FROM notes WHERE user_id = ? GROUP BY language_family',
      [userId]
    );
    if (result.length === 0) return [];
    return result[0].values.map((row) => ({
      language_family: row[0] as string,
      count: row[1] as number,
    }));
  },
};

export default db;
