import express, { Request, Response } from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

const dbPath = path.join(__dirname, '..', 'colorSchemes.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS color_schemes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    tags TEXT,
    colors TEXT NOT NULL,
    primaryColor TEXT NOT NULL,
    schemeType TEXT NOT NULL,
    isPublic INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

const insertStmt = db.prepare(`
  INSERT INTO color_schemes (id, name, tags, colors, primaryColor, schemeType, isPublic)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const selectAllPublicStmt = db.prepare(`
  SELECT * FROM color_schemes WHERE isPublic = 1 ORDER BY createdAt DESC
`);

const selectByIdStmt = db.prepare(`
  SELECT * FROM color_schemes WHERE id = ?
`);

const deleteStmt = db.prepare(`
  DELETE FROM color_schemes WHERE id = ?
`);

interface ColorSchemeRow {
  id: string;
  name: string;
  tags: string | null;
  colors: string;
  primaryColor: string;
  schemeType: string;
  isPublic: number;
  createdAt: string;
}

function rowToScheme(row: ColorSchemeRow) {
  return {
    id: row.id,
    name: row.name,
    tags: row.tags ? JSON.parse(row.tags) : [],
    colors: JSON.parse(row.colors),
    primaryColor: row.primaryColor,
    schemeType: row.schemeType,
    isPublic: row.isPublic === 1,
    createdAt: row.createdAt,
  };
}

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.get('/api/schemes', (_req: Request, res: Response) => {
  try {
    const rows = selectAllPublicStmt.all() as ColorSchemeRow[];
    const schemes = rows.map(rowToScheme);
    res.json(schemes);
  } catch (error) {
    console.error('Error fetching schemes:', error);
    res.status(500).json({ error: 'Failed to fetch schemes' });
  }
});

app.get('/api/schemes/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const row = selectByIdStmt.get(id) as ColorSchemeRow | undefined;
    if (!row) {
      res.status(404).json({ error: 'Scheme not found' });
      return;
    }
    res.json(rowToScheme(row));
  } catch (error) {
    console.error('Error fetching scheme:', error);
    res.status(500).json({ error: 'Failed to fetch scheme' });
  }
});

app.post('/api/schemes', (req: Request, res: Response) => {
  try {
    const { name, tags, colors, primaryColor, schemeType, isPublic } = req.body;

    if (!name || !colors || !primaryColor || !schemeType) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const id = uuidv4();
    const tagsStr = tags ? JSON.stringify(tags) : null;
    const colorsStr = JSON.stringify(colors);
    const isPublicInt = isPublic ? 1 : 0;

    insertStmt.run(id, name, tagsStr, colorsStr, primaryColor, schemeType, isPublicInt);

    const row = selectByIdStmt.get(id) as ColorSchemeRow;
    res.status(201).json(rowToScheme(row));
  } catch (error) {
    console.error('Error creating scheme:', error);
    res.status(500).json({ error: 'Failed to create scheme' });
  }
});

app.delete('/api/schemes/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = deleteStmt.run(id);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Scheme not found' });
      return;
    }
    res.json({ message: 'Scheme deleted successfully' });
  } catch (error) {
    console.error('Error deleting scheme:', error);
    res.status(500).json({ error: 'Failed to delete scheme' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
