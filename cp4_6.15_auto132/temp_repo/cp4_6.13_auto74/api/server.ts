import http from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import Database from 'better-sqlite3'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import app, { setDatabase } from './app.js'
import { runBattle } from './battleEngine.js'
import type { ShipData, StarmapCell } from './types.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = process.env.PORT || 3001;

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'game.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    resources INTEGER DEFAULT 100,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS ships (
    id TEXT PRIMARY KEY,
    player_id TEXT NOT NULL,
    name TEXT DEFAULT 'My Ship',
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS ship_parts (
    id TEXT PRIMARY KEY,
    ship_id TEXT NOT NULL,
    type TEXT NOT NULL,
    variant INTEGER DEFAULT 0,
    slot TEXT NOT NULL,
    config TEXT
  );
  CREATE TABLE IF NOT EXISTS battle_logs (
    id TEXT PRIMARY KEY,
    player_id TEXT NOT NULL,
    result TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS starmap_cells (
    id TEXT PRIMARY KEY,
    player_id TEXT NOT NULL,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    type TEXT NOT NULL DEFAULT 'empty',
    explored INTEGER DEFAULT 0
  );
`);

setDatabase(db);

const defaultPlayer = db.prepare('SELECT * FROM players WHERE id = ?').get('default-player');
if (!defaultPlayer) {
  db.prepare('INSERT INTO players (id, name, resources) VALUES (?, ?, ?)').run('default-player', 'Commander', 100);
}

const server = http.createServer(app);

const wss = new WebSocketServer({ server });

function getShipData(playerId: string): ShipData {
  const ship = db.prepare('SELECT * FROM ships WHERE player_id = ?').get(playerId) as any;
  if (!ship) return { parts: [] };
  const parts = db.prepare('SELECT * FROM ship_parts WHERE ship_id = ?').all(ship.id);
  return {
    parts: parts.map((p: any) => ({
      id: p.id,
      type: p.type,
      variant: p.variant,
      slot: p.slot,
      config: p.config ? JSON.parse(p.config) : undefined,
    })),
  };
}

function generateStarmap(playerId: string): void {
  db.prepare('DELETE FROM starmap_cells WHERE player_id = ?').run(playerId);
  const insert = db.prepare('INSERT INTO starmap_cells (id, player_id, x, y, type, explored) VALUES (?, ?, ?, ?, ?, ?)');
  const types: StarmapCell['type'][] = ['empty', 'asteroid', 'enemy', 'resource'];
  const size = 10;
  const insertMany = db.transaction(() => {
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const rand = Math.random();
        let cellType: StarmapCell['type'] = 'empty';
        if (rand > 0.85) cellType = 'enemy';
        else if (rand > 0.7) cellType = 'resource';
        else if (rand > 0.55) cellType = 'asteroid';
        const explored = x === 5 && y === 5 ? 1 : 0;
        insert.run(uuidv4(), playerId, x, y, cellType, explored);
      }
    }
  });
  insertMany();
}

function generateEnemyShip(): ShipData {
  const variant = Math.floor(Math.random() * 3);
  return {
    parts: [
      { id: uuidv4(), type: 'hull', variant, slot: 'hull' },
      { id: uuidv4(), type: 'engine', variant: Math.floor(Math.random() * 3), slot: 'engine' },
      { id: uuidv4(), type: 'shield', variant: Math.floor(Math.random() * 3), slot: 'shield' },
      {
        id: uuidv4(),
        type: 'weapon',
        variant: Math.floor(Math.random() * 3),
        slot: 'weapon-1',
        config: { fireRate: 2 + variant, damage: 5 + variant * 3, projectileColor: '#ff4444' },
      },
    ],
  };
}

wss.on('connection', (ws: WebSocket) => {
  console.log('WebSocket client connected');

  ws.on('message', async (raw: Buffer) => {
    let msg: any;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
      return;
    }

    switch (msg.type) {
      case 'ship:update': {
        const { parts } = msg;
        if (!parts) {
          ws.send(JSON.stringify({ type: 'error', message: 'Missing parts' }));
          return;
        }
        let ship = db.prepare('SELECT * FROM ships WHERE player_id = ?').get('default-player') as any;
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
        ws.send(JSON.stringify({ type: 'ship:updated', data: { id: ship.id, parts } }));
        break;
      }

      case 'starmap:generate': {
        generateStarmap('default-player');
        const cells = db.prepare('SELECT * FROM starmap_cells WHERE player_id = ?').all('default-player');
        const cellMap: Record<string, StarmapCell> = {};
        for (const c of cells as any[]) {
          cellMap[`${c.x},${c.y}`] = { type: c.type, explored: !!c.explored };
        }
        ws.send(JSON.stringify({ type: 'starmap:generated', data: { size: 10, cells: cellMap } }));
        break;
      }

      case 'starmap:move': {
        const { x, y } = msg;
        const cell = db.prepare('SELECT * FROM starmap_cells WHERE player_id = ? AND x = ? AND y = ?').get('default-player', x, y) as any;
        if (!cell) {
          ws.send(JSON.stringify({ type: 'error', message: 'Cell not found' }));
          return;
        }
        if (cell.explored) {
          ws.send(JSON.stringify({ type: 'starmap:moved', data: { x, y, type: cell.type, explored: true } }));
          return;
        }
        db.prepare('UPDATE starmap_cells SET explored = 1 WHERE id = ?').run(cell.id);
        ws.send(JSON.stringify({ type: 'starmap:moved', data: { x, y, type: cell.type, explored: true } }));
        if (cell.type === 'resource') {
          const gained = Math.floor(Math.random() * 30) + 10;
          db.prepare('UPDATE players SET resources = resources + ? WHERE id = ?').run(gained, 'default-player');
          ws.send(JSON.stringify({ type: 'resources:gained', data: { amount: gained } }));
        }
        break;
      }

      case 'battle:start': {
        const playerShip = getShipData('default-player');
        const enemyShip = generateEnemyShip();
        const result = runBattle(playerShip, enemyShip);
        db.prepare('INSERT INTO battle_logs (id, player_id, result) VALUES (?, ?, ?)').run(uuidv4(), 'default-player', JSON.stringify(result));
        if (result.resourcesGained > 0) {
          db.prepare('UPDATE players SET resources = resources + ? WHERE id = ?').run(result.resourcesGained, 'default-player');
        }
        for (const partId of result.partsLost) {
          db.prepare('DELETE FROM ship_parts WHERE id = ?').run(partId);
        }
        for (const action of result.log) {
          ws.send(JSON.stringify({ type: 'battle:round', data: action }));
          await new Promise(resolve => setTimeout(resolve, 800));
        }
        ws.send(JSON.stringify({ type: 'battle:end', data: result }));
        break;
      }

      case 'repair:part': {
        const { partId } = msg;
        const player = db.prepare('SELECT * FROM players WHERE id = ?').get('default-player') as any;
        const repairCost = 20;
        if (!player || player.resources < repairCost) {
          ws.send(JSON.stringify({ type: 'error', message: 'Not enough resources' }));
          return;
        }
        db.prepare('UPDATE players SET resources = resources - ? WHERE id = ?').run(repairCost, 'default-player');
        ws.send(JSON.stringify({ type: 'repair:completed', data: { partId, cost: repairCost } }));
        break;
      }

      default:
        ws.send(JSON.stringify({ type: 'error', message: `Unknown message type: ${msg.type}` }));
    }
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Server ready on port ${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received');
  server.close(() => {
    db.close();
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received');
  server.close(() => {
    db.close();
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
