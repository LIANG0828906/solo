import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import type {
  User,
  Club,
  ClubMember,
  Book,
  Stage,
  Note,
  NoteLike,
  Message,
} from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../../../database.db');

const db = new Database(dbPath);

function hashPassword(password: string): string {
  return Buffer.from(password).toString('base64');
}

function verifyPassword(password: string, hash: string): boolean {
  return Buffer.from(password).toString('base64') === hash;
}

function formatDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function initDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      username TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS clubs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      cover_image_url TEXT,
      creator_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (creator_id) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS club_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      club_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (club_id) REFERENCES clubs (id),
      FOREIGN KEY (user_id) REFERENCES users (id),
      UNIQUE (club_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      club_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      cover_image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (club_id) REFERENCES clubs (id)
    );

    CREATE TABLE IF NOT EXISTS stages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      start_page INTEGER NOT NULL,
      end_page INTEGER NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      FOREIGN KEY (book_id) REFERENCES books (id)
    );

    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stage_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      image_urls TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (stage_id) REFERENCES stages (id),
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS note_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      note_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (note_id) REFERENCES notes (id),
      FOREIGN KEY (user_id) REFERENCES users (id),
      UNIQUE (note_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stage_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      mentions TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (stage_id) REFERENCES stages (id),
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
    CREATE INDEX IF NOT EXISTS idx_clubs_creator_id ON clubs (creator_id);
    CREATE INDEX IF NOT EXISTS idx_club_members_club_id ON club_members (club_id);
    CREATE INDEX IF NOT EXISTS idx_club_members_user_id ON club_members (user_id);
    CREATE INDEX IF NOT EXISTS idx_books_club_id ON books (club_id);
    CREATE INDEX IF NOT EXISTS idx_stages_book_id ON stages (book_id);
    CREATE INDEX IF NOT EXISTS idx_notes_stage_id ON notes (stage_id);
    CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes (user_id);
    CREATE INDEX IF NOT EXISTS idx_note_likes_note_id ON note_likes (note_id);
    CREATE INDEX IF NOT EXISTS idx_note_likes_user_id ON note_likes (user_id);
    CREATE INDEX IF NOT EXISTS idx_messages_stage_id ON messages (stage_id);
    CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages (user_id);
  `);
}

function register(email: string, password: string, username: string): User | null {
  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existingUser) {
    return null;
  }
  const hashedPassword = hashPassword(password);
  const now = formatDate();
  const result = db.prepare(
    'INSERT INTO users (email, password, username, created_at) VALUES (?, ?, ?, ?)'
  ).run(email, hashedPassword, username, now);
  const id = result.lastInsertRowid as number;
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User;
}

function login(email: string, password: string): User | null {
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined;
  if (!user) {
    return null;
  }
  if (!verifyPassword(password, user.password)) {
    return null;
  }
  return user;
}

function getUserById(id: number): User | undefined {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined;
}

function getUserByEmail(email: string): User | undefined {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined;
}

function updateUser(id: number, updates: Partial<Pick<User, 'email' | 'username'>>): boolean {
  const fields = Object.keys(updates);
  if (fields.length === 0) return false;
  const setClause = fields.map(f => `${f} = ?`).join(', ');
  const values = [...Object.values(updates), id];
  const result = db.prepare(`UPDATE users SET ${setClause} WHERE id = ?`).run(...values);
  return result.changes > 0;
}

function deleteUser(id: number): boolean {
  const result = db.prepare('DELETE FROM users WHERE id = ?').run(id);
  return result.changes > 0;
}

function createClub(name: string, description: string, coverImageUrl: string | null, creatorId: number): Club {
  const now = formatDate();
  const result = db.prepare(
    'INSERT INTO clubs (name, description, cover_image_url, creator_id, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run(name, description, coverImageUrl, creatorId, now);
  const id = result.lastInsertRowid as number;
  addClubMember(id, creatorId);
  return db.prepare('SELECT * FROM clubs WHERE id = ?').get(id) as Club;
}

function getClubById(id: number): Club | undefined {
  return db.prepare('SELECT * FROM clubs WHERE id = ?').get(id) as Club | undefined;
}

function getClubsByUserId(userId: number): Club[] {
  return db.prepare(`
    SELECT c.* FROM clubs c
    INNER JOIN club_members cm ON c.id = cm.club_id
    WHERE cm.user_id = ?
    ORDER BY c.created_at DESC
  `).all(userId) as Club[];
}

function updateClub(id: number, updates: Partial<Pick<Club, 'name' | 'description' | 'cover_image_url'>>): boolean {
  const fields = Object.keys(updates);
  if (fields.length === 0) return false;
  const setClause = fields.map(f => `${f} = ?`).join(', ');
  const values = [...Object.values(updates), id];
  const result = db.prepare(`UPDATE clubs SET ${setClause} WHERE id = ?`).run(...values);
  return result.changes > 0;
}

function deleteClub(id: number): boolean {
  const result = db.prepare('DELETE FROM clubs WHERE id = ?').run(id);
  return result.changes > 0;
}

function addClubMember(clubId: number, userId: number): boolean {
  try {
    const now = formatDate();
    const result = db.prepare(
      'INSERT OR IGNORE INTO club_members (club_id, user_id, joined_at) VALUES (?, ?, ?)'
    ).run(clubId, userId, now);
    return result.changes > 0;
  } catch {
    return false;
  }
}

function removeClubMember(clubId: number, userId: number): boolean {
  const result = db.prepare('DELETE FROM club_members WHERE club_id = ? AND user_id = ?').run(clubId, userId);
  return result.changes > 0;
}

function getClubMembers(clubId: number): (User & { joined_at: string })[] {
  return db.prepare(`
    SELECT u.*, cm.joined_at
    FROM users u
    INNER JOIN club_members cm ON u.id = cm.user_id
    WHERE cm.club_id = ?
    ORDER BY cm.joined_at ASC
  `).all(clubId) as (User & { joined_at: string })[];
}

function isClubMember(clubId: number, userId: number): boolean {
  const result = db.prepare(
    'SELECT 1 FROM club_members WHERE club_id = ? AND user_id = ?'
  ).get(clubId, userId);
  return !!result;
}

function getClubMemberCount(clubId: number): number {
  const result = db.prepare(
    'SELECT COUNT(*) as count FROM club_members WHERE club_id = ?'
  ).get(clubId) as { count: number };
  return result.count;
}

function createBook(clubId: number, title: string, author: string, coverImageUrl: string | null): Book {
  const now = formatDate();
  const result = db.prepare(
    'INSERT INTO books (club_id, title, author, cover_image_url, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run(clubId, title, author, coverImageUrl, now);
  const id = result.lastInsertRowid as number;
  return db.prepare('SELECT * FROM books WHERE id = ?').get(id) as Book;
}

function getBookById(id: number): Book | undefined {
  return db.prepare('SELECT * FROM books WHERE id = ?').get(id) as Book | undefined;
}

function getBooksByClubId(clubId: number): Book[] {
  return db.prepare(
    'SELECT * FROM books WHERE club_id = ? ORDER BY created_at DESC'
  ).all(clubId) as Book[];
}

function updateBook(id: number, updates: Partial<Pick<Book, 'title' | 'author' | 'cover_image_url'>>): boolean {
  const fields = Object.keys(updates);
  if (fields.length === 0) return false;
  const setClause = fields.map(f => `${f} = ?`).join(', ');
  const values = [...Object.values(updates), id];
  const result = db.prepare(`UPDATE books SET ${setClause} WHERE id = ?`).run(...values);
  return result.changes > 0;
}

function deleteBook(id: number): boolean {
  const result = db.prepare('DELETE FROM books WHERE id = ?').run(id);
  return result.changes > 0;
}

function createStage(
  bookId: number,
  name: string,
  startPage: number,
  endPage: number,
  startDate: string,
  endDate: string
): Stage {
  const result = db.prepare(
    'INSERT INTO stages (book_id, name, start_page, end_page, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(bookId, name, startPage, endPage, startDate, endDate);
  const id = result.lastInsertRowid as number;
  return db.prepare('SELECT * FROM stages WHERE id = ?').get(id) as Stage;
}

function getStageById(id: number): Stage | undefined {
  return db.prepare('SELECT * FROM stages WHERE id = ?').get(id) as Stage | undefined;
}

function getStagesByBookId(bookId: number): Stage[] {
  return db.prepare(
    'SELECT * FROM stages WHERE book_id = ? ORDER BY start_date ASC'
  ).all(bookId) as Stage[];
}

function updateStage(
  id: number,
  updates: Partial<Pick<Stage, 'name' | 'start_page' | 'end_page' | 'start_date' | 'end_date'>>
): boolean {
  const fields = Object.keys(updates);
  if (fields.length === 0) return false;
  const setClause = fields.map(f => `${f} = ?`).join(', ');
  const values = [...Object.values(updates), id];
  const result = db.prepare(`UPDATE stages SET ${setClause} WHERE id = ?`).run(...values);
  return result.changes > 0;
}

function deleteStage(id: number): boolean {
  const result = db.prepare('DELETE FROM stages WHERE id = ?').run(id);
  return result.changes > 0;
}

function createNote(stageId: number, userId: number, text: string, imageUrls: string[]): Note {
  const imageUrlsStr = JSON.stringify(imageUrls);
  const now = formatDate();
  const result = db.prepare(
    'INSERT INTO notes (stage_id, user_id, text, image_urls, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run(stageId, userId, text, imageUrlsStr, now);
  const id = result.lastInsertRowid as number;
  return db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as Note;
}

function getNoteById(id: number): Note | undefined {
  return db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as Note | undefined;
}

function getNotesByStageId(stageId: number): (Note & { username: string; likes: number; is_liked: boolean })[] {
  return db.prepare(`
    SELECT 
      n.*,
      u.username,
      (SELECT COUNT(*) FROM note_likes nl WHERE nl.note_id = n.id) as likes,
      EXISTS (SELECT 1 FROM note_likes nl WHERE nl.note_id = n.id) as is_liked
    FROM notes n
    INNER JOIN users u ON n.user_id = u.id
    WHERE n.stage_id = ?
    ORDER BY n.created_at DESC
  `).all(stageId) as (Note & { username: string; likes: number; is_liked: boolean })[];
}

function getNotesByStageIdWithUser(stageId: number, currentUserId: number): (Note & { username: string; likes: number; isLikedByMe: boolean })[] {
  return db.prepare(`
    SELECT 
      n.*,
      u.username,
      (SELECT COUNT(*) FROM note_likes nl WHERE nl.note_id = n.id) as likes,
      EXISTS (SELECT 1 FROM note_likes nl WHERE nl.note_id = n.id AND nl.user_id = ?) as isLikedByMe
    FROM notes n
    INNER JOIN users u ON n.user_id = u.id
    WHERE n.stage_id = ?
    ORDER BY n.created_at DESC
  `).all(currentUserId, stageId) as (Note & { username: string; likes: number; isLikedByMe: boolean })[];
}

function updateNote(id: number, updates: Partial<Pick<Note, 'text' | 'image_urls'>>): boolean {
  const fields = Object.keys(updates);
  if (fields.length === 0) return false;
  const setClause = fields.map(f => `${f} = ?`).join(', ');
  const values = [...Object.values(updates), id];
  const result = db.prepare(`UPDATE notes SET ${setClause} WHERE id = ?`).run(...values);
  return result.changes > 0;
}

function deleteNote(id: number): boolean {
  const result = db.prepare('DELETE FROM notes WHERE id = ?').run(id);
  return result.changes > 0;
}

function likeNote(noteId: number, userId: number): boolean {
  try {
    const now = formatDate();
    const result = db.prepare(
      'INSERT OR IGNORE INTO note_likes (note_id, user_id, created_at) VALUES (?, ?, ?)'
    ).run(noteId, userId, now);
    return result.changes > 0;
  } catch {
    return false;
  }
}

function unlikeNote(noteId: number, userId: number): boolean {
  const result = db.prepare('DELETE FROM note_likes WHERE note_id = ? AND user_id = ?').run(noteId, userId);
  return result.changes > 0;
}

function getNoteLikeCount(noteId: number): number {
  const result = db.prepare(
    'SELECT COUNT(*) as count FROM note_likes WHERE note_id = ?'
  ).get(noteId) as { count: number };
  return result.count;
}

function hasUserLikedNote(noteId: number, userId: number): boolean {
  const result = db.prepare(
    'SELECT 1 FROM note_likes WHERE note_id = ? AND user_id = ?'
  ).get(noteId, userId);
  return !!result;
}

function createMessage(stageId: number, userId: number, content: string, mentions: number[]): Message {
  const mentionsStr = JSON.stringify(mentions);
  const now = formatDate();
  const result = db.prepare(
    'INSERT INTO messages (stage_id, user_id, content, mentions, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run(stageId, userId, content, mentionsStr, now);
  const id = result.lastInsertRowid as number;
  return db.prepare('SELECT * FROM messages WHERE id = ?').get(id) as Message;
}

function getMessageById(id: number): Message | undefined {
  return db.prepare('SELECT * FROM messages WHERE id = ?').get(id) as Message | undefined;
}

function getMessagesByStageId(stageId: number): (Message & { username: string })[] {
  return db.prepare(`
    SELECT m.*, u.username
    FROM messages m
    INNER JOIN users u ON m.user_id = u.id
    WHERE m.stage_id = ?
    ORDER BY m.created_at ASC
  `).all(stageId) as (Message & { username: string })[];
}

function updateMessage(id: number, updates: Partial<Pick<Message, 'content' | 'mentions'>>): boolean {
  const fields = Object.keys(updates);
  if (fields.length === 0) return false;
  const setClause = fields.map(f => `${f} = ?`).join(', ');
  const values = [...Object.values(updates), id];
  const result = db.prepare(`UPDATE messages SET ${setClause} WHERE id = ?`).run(...values);
  return result.changes > 0;
}

function deleteMessage(id: number): boolean {
  const result = db.prepare('DELETE FROM messages WHERE id = ?').run(id);
  return result.changes > 0;
}

initDatabase();

export {
  initDatabase,
  hashPassword,
  verifyPassword,
  formatDate,
  register,
  login,
  getUserById,
  getUserByEmail,
  updateUser,
  deleteUser,
  createClub,
  getClubById,
  getClubsByUserId,
  updateClub,
  deleteClub,
  addClubMember,
  removeClubMember,
  getClubMembers,
  isClubMember,
  getClubMemberCount,
  createBook,
  getBookById,
  getBooksByClubId,
  updateBook,
  deleteBook,
  createStage,
  getStageById,
  getStagesByBookId,
  updateStage,
  deleteStage,
  createNote,
  getNoteById,
  getNotesByStageId,
  getNotesByStageIdWithUser,
  updateNote,
  deleteNote,
  likeNote,
  unlikeNote,
  getNoteLikeCount,
  hasUserLikedNote,
  createMessage,
  getMessageById,
  getMessagesByStageId,
  updateMessage,
  deleteMessage,
};
