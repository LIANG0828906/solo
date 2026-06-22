import express, { Request, Response } from 'express';
import initSqlJs, { Database } from 'sql.js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(express.json({ limit: '10mb' }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

const dbPath = path.join(__dirname, '..', 'levels.db');

let db: Database;

function saveDbToFile(): void {
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  } catch (err) {
    console.error('Failed to save database to file:', err);
  }
}

function loadDbFromFile(): Buffer | null {
  try {
    if (fs.existsSync(dbPath)) {
      return fs.readFileSync(dbPath);
    }
  } catch (err) {
    console.error('Failed to load database from file:', err);
  }
  return null;
}

async function initDatabase(): Promise<void> {
  const SQL = await initSqlJs();

  const existingData = loadDbFromFile();
  if (existingData) {
    db = new SQL.Database(existingData);
    console.log('Loaded existing database from file');
  } else {
    db = new SQL.Database();
    console.log('Created new database');
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS levels (
      id TEXT PRIMARY KEY,
      level_number INTEGER NOT NULL,
      grid_matrix TEXT NOT NULL,
      score INTEGER NOT NULL,
      time_spent INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  saveDbToFile();
}

interface LevelData {
  level_number: number;
  grid_matrix: number[][];
  score: number;
  time_spent: number;
}

app.post('/api/levels', (req: Request, res: Response) => {
  try {
    const { level_number, grid_matrix, score, time_spent } = req.body as LevelData;

    if (typeof level_number !== 'number' || level_number < 1) {
      return res.status(400).json({ error: 'Invalid level_number' });
    }
    if (!Array.isArray(grid_matrix) || grid_matrix.length !== 30) {
      return res.status(400).json({ error: 'Invalid grid_matrix' });
    }
    if (typeof score !== 'number' || score < 0) {
      return res.status(400).json({ error: 'Invalid score' });
    }
    if (typeof time_spent !== 'number' || time_spent < 0) {
      return res.status(400).json({ error: 'Invalid time_spent' });
    }

    const id = uuidv4();
    db.run(
      'INSERT INTO levels (id, level_number, grid_matrix, score, time_spent) VALUES (?, ?, ?, ?, ?)',
      [id, level_number, JSON.stringify(grid_matrix), score, time_spent]
    );

    saveDbToFile();
    res.status(201).json({ id, success: true });
  } catch (error) {
    console.error('Error saving level:', error);
    res.status(500).json({ error: 'Failed to save level' });
  }
});

app.get('/api/levels', (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const stmt = db.prepare(
      'SELECT id, level_number, score, time_spent, created_at FROM levels ORDER BY created_at DESC LIMIT ? OFFSET ?'
    );
    stmt.bind([limit, offset]);

    const levels: any[] = [];
    while (stmt.step()) {
      levels.push(stmt.getAsObject());
    }
    stmt.free();

    const countStmt = db.prepare('SELECT COUNT(*) as total FROM levels');
    countStmt.step();
    const countResult = countStmt.getAsObject() as { total: number };
    countStmt.free();

    res.json({
      levels,
      pagination: {
        page,
        limit,
        total: countResult.total,
        pages: Math.ceil(countResult.total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching levels:', error);
    res.status(500).json({ error: 'Failed to fetch levels' });
  }
});

app.get('/api/stats', (_req: Request, res: Response) => {
  try {
    const stmt = db.prepare(`
      SELECT
        COUNT(*) as levels_completed,
        COALESCE(SUM(score), 0) as total_score,
        COALESCE(CAST(AVG(score) AS INTEGER), 0) as avg_score,
        COALESCE(CAST(AVG(time_spent) AS INTEGER), 0) as avg_time,
        COALESCE(MAX(level_number), 0) as highest_level
      FROM levels
    `);
    stmt.step();
    const stats = stmt.getAsObject();
    stmt.free();

    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Database: ${dbPath}`);
  });
}).catch((err) => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
