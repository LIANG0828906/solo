import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import { v4 as uuidv4 } from 'uuid'
import type { ShipPart, StarmapCell } from './types.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth', authRoutes)

let db: any = null;

export function setDatabase(database: any) {
  db = database;
}

app.get('/api/ship', (req: Request, res: Response): void => {
  if (!db) {
    res.status(500).json({ success: false, error: 'Database not initialized' });
    return;
  }
  const ship = db.prepare('SELECT * FROM ships WHERE player_id = ?').get('default-player');
  if (!ship) {
    res.json({ success: true, data: { parts: [] } });
    return;
  }
  const parts = db.prepare('SELECT * FROM ship_parts WHERE ship_id = ?').all(ship.id) as ShipPart[];
  const partsWithConfig = parts.map(p => ({
    ...p,
    config: p.config ? JSON.parse(p.config as any) : undefined,
  }));
  res.json({ success: true, data: { id: ship.id, parts: partsWithConfig } });
});

app.post('/api/ship', (req: Request, res: Response): void => {
  if (!db) {
    res.status(500).json({ success: false, error: 'Database not initialized' });
    return;
  }
  const { parts } = req.body;
  let ship = db.prepare('SELECT * FROM ships WHERE player_id = ?').get('default-player');
  if (!ship) {
    const id = uuidv4();
    db.prepare('INSERT INTO ships (id, player_id, name) VALUES (?, ?, ?)').run(id, 'default-player', 'My Ship');
    ship = { id };
  }
  db.prepare('DELETE FROM ship_parts WHERE ship_id = ?').run(ship.id);
  const insertPart = db.prepare('INSERT INTO ship_parts (id, ship_id, type, variant, slot, config) VALUES (?, ?, ?, ?, ?, ?)');
  for (const part of parts) {
    const partId = part.id || uuidv4();
    insertPart.run(partId, ship.id, part.type, part.variant, part.slot, part.config ? JSON.stringify(part.config) : null);
  }
  res.json({ success: true, data: { id: ship.id, parts } });
});

app.get('/api/starmap', (req: Request, res: Response): void => {
  if (!db) {
    res.status(500).json({ success: false, error: 'Database not initialized' });
    return;
  }
  const cells = db.prepare('SELECT * FROM starmap_cells WHERE player_id = ?').all('default-player');
  if (cells.length === 0) {
    res.json({ success: true, data: { size: 0, cells: [] } });
    return;
  }
  const cellMap: Record<string, StarmapCell> = {};
  for (const c of cells) {
    cellMap[`${c.x},${c.y}`] = { type: c.type, explored: !!c.explored };
  }
  res.json({ success: true, data: { size: 10, cells: cellMap } });
});

app.get('/api/resources', (req: Request, res: Response): void => {
  if (!db) {
    res.status(500).json({ success: false, error: 'Database not initialized' });
    return;
  }
  const player = db.prepare('SELECT * FROM players WHERE id = ?').get('default-player');
  res.json({ success: true, data: { resources: player?.resources ?? 0 } });
});

app.use('/api/health', (req: Request, res: Response, next: NextFunction): void => {
  res.status(200).json({ success: true, message: 'ok' });
});

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({ success: false, error: 'Server internal error' });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'API not found' });
});

export default app;
