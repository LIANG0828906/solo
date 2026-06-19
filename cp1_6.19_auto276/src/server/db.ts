import { Pool } from 'pg';

let pool: Pool | null = null;

export const initDB = () => {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/campus_books',
    });
    initTables();
  } catch (error) {
    console.warn('PostgreSQL connection failed, using in-memory data store');
  }
};

export const getPool = () => pool;

const initTables = async () => {
  if (!pool) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        username VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS books (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        author VARCHAR(255) NOT NULL,
        subject VARCHAR(100) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        cover_url VARCHAR(500),
        user_id INTEGER REFERENCES users(id),
        status VARCHAR(50) DEFAULT 'available',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS exchanges (
        id SERIAL PRIMARY KEY,
        book_id INTEGER REFERENCES books(id),
        requester_id INTEGER REFERENCES users(id),
        owner_id INTEGER REFERENCES users(id),
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS notes (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        subject VARCHAR(100) NOT NULL,
        target_amount DECIMAL(10,2) NOT NULL,
        current_amount DECIMAL(10,2) DEFAULT 0,
        creator_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS note_sections (
        id SERIAL PRIMARY KEY,
        note_id INTEGER REFERENCES notes(id) ON DELETE CASCADE,
        section_title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        position INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS note_pledges (
        id SERIAL PRIMARY KEY,
        note_id INTEGER REFERENCES notes(id),
        user_id INTEGER REFERENCES users(id),
        amount DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS note_ratings (
        id SERIAL PRIMARY KEY,
        note_id INTEGER REFERENCES notes(id),
        user_id INTEGER REFERENCES users(id),
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(note_id, user_id)
      );
    `);
    console.log('Database tables initialized');
  } catch (error) {
    console.error('Failed to initialize tables:', error);
  }
};
