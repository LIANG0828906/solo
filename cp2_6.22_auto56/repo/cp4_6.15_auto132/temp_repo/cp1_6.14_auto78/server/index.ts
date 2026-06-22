import express from 'express';
import cors from 'cors';
import { Low, JSONFile } from 'lowdb';
import path from 'path';
import fs from 'fs';
import booksRouter from './routes/books';
import recordsRouter from './routes/records';
import goalsRouter from './routes/goals';
import analyticsRouter from './routes/analytics';

interface Book {
  id: string;
  title: string;
  author: string;
  coverImage: string;
  totalPages: number;
  currentPage: number;
  createdAt: string;
}

interface ReadingRecord {
  id: string;
  bookId: string;
  date: string;
  startPage: number;
  endPage: number;
  duration: number;
  tags: string[];
  notes: string;
}

interface Goals {
  dailyMinutes: number;
  dailyPages: number;
}

interface Database {
  books: Book[];
  readingRecords: ReadingRecord[];
  goals: Goals;
}

declare global {
  namespace Express {
    interface Request {
      db: Low<Database>;
    }
  }
}

const app = express();
const PORT = 5000;

const defaultData: Database = {
  books: [],
  readingRecords: [],
  goals: {
    dailyMinutes: 30,
    dailyPages: 20
  }
};

async function main() {
  const cwd = process.cwd();
  let file: string;
  if (fs.existsSync(path.join(cwd, 'data', 'db.json'))) {
    file = path.join(cwd, 'data', 'db.json');
  } else {
    file = path.join(cwd, 'server', 'data', 'db.json');
  }
  const dataDir = path.dirname(file);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const adapter = new JSONFile<Database>(file);
  const db = new Low<Database>(adapter);
  await db.read();
  if (!db.data) {
    db.data = defaultData;
  } else {
    if (!db.data.books) db.data.books = [];
    if (!db.data.readingRecords) db.data.readingRecords = [];
    if (!db.data.goals) db.data.goals = defaultData.goals;
  }
  await db.write();

  app.use(cors());
  app.use(express.json());

  app.use((req, res, next) => {
    req.db = db;
    next();
  });

  app.use('/api/books', booksRouter);
  app.use('/api/records', recordsRouter);
  app.use('/api/goals', goalsRouter);
  app.use('/api/analytics', analyticsRouter);

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Reading Tracker Server is running' });
  });

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

main().catch(console.error);

export default app;
