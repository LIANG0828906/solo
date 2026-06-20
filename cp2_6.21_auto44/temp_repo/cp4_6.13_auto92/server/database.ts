import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'craft_workshop.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student',
    avatar TEXT,
    bio TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    sessions INTEGER NOT NULL,
    difficulty TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    capacity INTEGER NOT NULL,
    images TEXT NOT NULL DEFAULT '[]',
    schedule TEXT NOT NULL DEFAULT '[]',
    instructor_id TEXT NOT NULL,
    instructor_name TEXT NOT NULL,
    instructor_avatar TEXT,
    instructor_bio TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (instructor_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS enrollments (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    paid INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(course_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS materials (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    name TEXT NOT NULL,
    specs TEXT NOT NULL,
    target_quantity INTEGER NOT NULL,
    current_quantity INTEGER NOT NULL DEFAULT 0,
    deadline TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id)
  );

  CREATE TABLE IF NOT EXISTS material_supporters (
    id TEXT PRIMARY KEY,
    material_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (material_id) REFERENCES materials(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  role: 'student' | 'instructor';
  avatar?: string;
  bio?: string;
  created_at: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  sessions: number;
  difficulty: '初级' | '中级' | '高级';
  category: '编织' | '陶艺' | '木工' | '扎染';
  price: number;
  capacity: number;
  images: string;
  schedule: string;
  instructor_id: string;
  instructor_name: string;
  instructor_avatar?: string;
  instructor_bio?: string;
  created_at: string;
}

export interface Enrollment {
  id: string;
  course_id: string;
  user_id: string;
  user_name: string;
  paid: number;
  created_at: string;
}

export interface Material {
  id: string;
  course_id: string;
  name: string;
  specs: string;
  target_quantity: number;
  current_quantity: number;
  deadline: string;
  created_at: string;
}

export interface MaterialSupporter {
  id: string;
  material_id: string;
  user_id: string;
  user_name: string;
  quantity: number;
  created_at: string;
}

export const createUser = db.prepare(`
  INSERT INTO users (id, username, email, password, role, avatar, bio)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

export const findUserByEmail = db.prepare(`
  SELECT * FROM users WHERE email = ?
`);

export const findUserById = db.prepare(`
  SELECT id, username, email, role, avatar, bio, created_at FROM users WHERE id = ?
`);

export const createCourse = db.prepare(`
  INSERT INTO courses (id, title, description, sessions, difficulty, category, price, capacity, images, schedule, instructor_id, instructor_name, instructor_avatar, instructor_bio)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

export const updateCourse = db.prepare(`
  UPDATE courses SET title = ?, description = ?, sessions = ?, difficulty = ?, category = ?, price = ?, capacity = ?, images = ?, schedule = ?
  WHERE id = ? AND instructor_id = ?
`);

export const deleteCourse = db.prepare(`
  DELETE FROM courses WHERE id = ? AND instructor_id = ?
`);

export const getCourses = db.prepare(`
  SELECT * FROM courses ORDER BY created_at DESC
`);

export const getCourseById = db.prepare(`
  SELECT * FROM courses WHERE id = ?
`);

export const getCoursesByInstructor = db.prepare(`
  SELECT * FROM courses WHERE instructor_id = ? ORDER BY created_at DESC
`);

export const createEnrollment = db.prepare(`
  INSERT INTO enrollments (id, course_id, user_id, user_name, paid)
  VALUES (?, ?, ?, ?, ?)
`);

export const getEnrollmentsByCourse = db.prepare(`
  SELECT * FROM enrollments WHERE course_id = ? ORDER BY created_at DESC
`);

export const getEnrollmentsByUser = db.prepare(`
  SELECT e.*, c.title as course_title, c.price as course_price, c.instructor_name as instructor_name
  FROM enrollments e
  JOIN courses c ON e.course_id = c.id
  WHERE e.user_id = ? ORDER BY e.created_at DESC
`);

export const getEnrollmentCount = db.prepare(`
  SELECT COUNT(*) as count FROM enrollments WHERE course_id = ?
`);

export const createMaterial = db.prepare(`
  INSERT INTO materials (id, course_id, name, specs, target_quantity, deadline)
  VALUES (?, ?, ?, ?, ?, ?)
`);

export const getMaterialsByCourse = db.prepare(`
  SELECT * FROM materials WHERE course_id = ? ORDER BY created_at DESC
`);

export const getMaterialById = db.prepare(`
  SELECT * FROM materials WHERE id = ?
`);

export const createMaterialSupporter = db.prepare(`
  INSERT INTO material_supporters (id, material_id, user_id, user_name, quantity)
  VALUES (?, ?, ?, ?, ?)
`);

export const updateMaterialQuantity = db.prepare(`
  UPDATE materials SET current_quantity = current_quantity + ? WHERE id = ?
`);

export const getMaterialSupporters = db.prepare(`
  SELECT * FROM material_supporters WHERE material_id = ? ORDER BY created_at DESC
`);

export default db;
