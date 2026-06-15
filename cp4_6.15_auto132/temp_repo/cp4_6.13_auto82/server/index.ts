import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import {
  initDb,
  db,
  rowToActivity,
  rowToStall,
  rowToItem,
  type Activity,
  type Stall,
  type Item,
  type StallType,
  type ItemStatus,
  type ActivityRow,
  type StallRow,
  type ItemRow,
} from './db.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

initDb();

function computeGrid(totalStalls: number): { columns: number; rows: number } {
  const columns = Math.ceil(Math.sqrt(totalStalls));
  const rows = Math.ceil(totalStalls / columns);
  return { columns, rows };
}

interface CreateActivityBody {
  name: string;
  date: string;
  totalStalls: number;
}

app.post('/api/activities', (req, res) => {
  try {
    const { name, date, totalStalls } = req.body as CreateActivityBody;
    if (!name || !date || !totalStalls || totalStalls <= 0) {
      return res.status(400).json({ error: '缺少必要参数或参数无效' });
    }
    const { columns, rows } = computeGrid(totalStalls);
    const activityId = uuidv4();
    const createdAt = new Date().toISOString();

    const insertActivity = db.prepare(`
      INSERT INTO activities (id, name, date, total_stalls, grid_columns, grid_rows, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertActivity.run(activityId, name, date, totalStalls, columns, rows, createdAt);

    const insertStall = db.prepare(`
      INSERT INTO stalls (id, activity_id, stall_number, grid_x, grid_y, owner_name, type, assigned)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `);

    const transaction = db.transaction(() => {
      let stallNum = 1;
      for (let y = 0; y < rows && stallNum <= totalStalls; y++) {
        for (let x = 0; x < columns && stallNum <= totalStalls; x++) {
          insertStall.run(uuidv4(), activityId, stallNum, x, y, null, null);
          stallNum++;
        }
      }
    });
    transaction();

    const activityRow = db.prepare('SELECT * FROM activities WHERE id = ?').get(activityId) as ActivityRow;
    const stallRows = db.prepare('SELECT * FROM stalls WHERE activity_id = ? ORDER BY stall_number').all(activityId) as StallRow[];

    res.status(201).json({
      activity: rowToActivity(activityRow),
      stalls: stallRows.map(rowToStall),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '创建活动失败' });
  }
});

app.get('/api/activities/:id', (req, res) => {
  try {
    const { id } = req.params;
    const activityRow = db.prepare('SELECT * FROM activities WHERE id = ?').get(id) as ActivityRow | undefined;
    if (!activityRow) {
      return res.status(404).json({ error: '活动不存在' });
    }
    const stallRows = db.prepare('SELECT * FROM stalls WHERE activity_id = ? ORDER BY stall_number').all(id) as StallRow[];
    const stalls = stallRows.map(rowToStall);

    const stallIds = stalls.map(s => s.id);
    let itemsByStall: Record<string, Item[]> = {};
    if (stallIds.length > 0) {
      const placeholders = stallIds.map(() => '?').join(',');
      const itemRows = db.prepare(`SELECT * FROM items WHERE stall_id IN (${placeholders})`).all(...stallIds) as ItemRow[];
      for (const row of itemRows) {
        const item = rowToItem(row);
        if (!itemsByStall[item.stallId]) itemsByStall[item.stallId] = [];
        itemsByStall[item.stallId].push(item);
      }
    }

    const stallsWithItemCount = stalls.map(stall => ({
      ...stall,
      itemCount: itemsByStall[stall.id]?.length || 0,
    }));

    res.json({
      activity: rowToActivity(activityRow),
      stalls: stallsWithItemCount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取活动详情失败' });
  }
});

interface AssignStallBody {
  ownerName: string;
  type: StallType;
}

app.put('/api/activities/:id/stalls/:stallId', (req, res) => {
  try {
    const { id, stallId } = req.params;
    const { ownerName, type } = req.body as AssignStallBody;

    const activityRow = db.prepare('SELECT * FROM activities WHERE id = ?').get(id) as ActivityRow | undefined;
    if (!activityRow) return res.status(404).json({ error: '活动不存在' });

    const stallRow = db.prepare('SELECT * FROM stalls WHERE id = ? AND activity_id = ?').get(stallId, id) as StallRow | undefined;
    if (!stallRow) return res.status(404).json({ error: '摊位不存在' });

    if (ownerName && type) {
      db.prepare('UPDATE stalls SET owner_name = ?, type = ?, assigned = 1 WHERE id = ?').run(ownerName, type, stallId);
    } else {
      db.prepare('UPDATE stalls SET owner_name = NULL, type = NULL, assigned = 0 WHERE id = ?').run(stallId);
    }

    const updatedRow = db.prepare('SELECT * FROM stalls WHERE id = ?').get(stallId) as StallRow;
    res.json(rowToStall(updatedRow));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '更新摊位失败' });
  }
});

app.get('/api/activities/:id/stalls', (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query as { type?: string };

    const activityRow = db.prepare('SELECT * FROM activities WHERE id = ?').get(id) as ActivityRow | undefined;
    if (!activityRow) return res.status(404).json({ error: '活动不存在' });

    let rows: StallRow[];
    if (type) {
      rows = db.prepare('SELECT * FROM stalls WHERE activity_id = ? AND type = ? ORDER BY stall_number').all(id, type) as StallRow[];
    } else {
      rows = db.prepare('SELECT * FROM stalls WHERE activity_id = ? ORDER BY stall_number').all(id) as StallRow[];
    }
    res.json(rows.map(rowToStall));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取摊位列表失败' });
  }
});

interface AddItemBody {
  name: string;
  price: number;
}

app.post('/api/activities/:id/stalls/:stallId/items', (req, res) => {
  try {
    const { id, stallId } = req.params;
    const { name, price } = req.body as AddItemBody;
    if (!name || price === undefined || price < 0) {
      return res.status(400).json({ error: '商品名称和有效价格必填' });
    }

    const activityRow = db.prepare('SELECT * FROM activities WHERE id = ?').get(id) as ActivityRow | undefined;
    if (!activityRow) return res.status(404).json({ error: '活动不存在' });

    const stallRow = db.prepare('SELECT * FROM stalls WHERE id = ? AND activity_id = ?').get(stallId, id) as StallRow | undefined;
    if (!stallRow) return res.status(404).json({ error: '摊位不存在' });

    const itemId = uuidv4();
    db.prepare('INSERT INTO items (id, stall_id, name, price, status) VALUES (?, ?, ?, ?, ?)').run(itemId, stallId, name, price, 'on_sale');
    const row = db.prepare('SELECT * FROM items WHERE id = ?').get(itemId) as ItemRow;
    res.status(201).json(rowToItem(row));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '添加商品失败' });
  }
});

app.get('/api/activities/:id/stalls/:stallId/items', (req, res) => {
  try {
    const { id, stallId } = req.params;

    const activityRow = db.prepare('SELECT * FROM activities WHERE id = ?').get(id) as ActivityRow | undefined;
    if (!activityRow) return res.status(404).json({ error: '活动不存在' });

    const stallRow = db.prepare('SELECT * FROM stalls WHERE id = ? AND activity_id = ?').get(stallId, id) as StallRow | undefined;
    if (!stallRow) return res.status(404).json({ error: '摊位不存在' });

    const rows = db.prepare('SELECT * FROM items WHERE stall_id = ?').all(stallId) as ItemRow[];
    res.json(rows.map(rowToItem));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取商品列表失败' });
  }
});

interface UpdateItemStatusBody {
  status: ItemStatus;
}

app.put('/api/items/:itemId/status', (req, res) => {
  try {
    const { itemId } = req.params;
    const { status } = req.body as UpdateItemStatusBody;
    if (status !== 'on_sale' && status !== 'sold') {
      return res.status(400).json({ error: '无效的商品状态' });
    }
    const row = db.prepare('SELECT * FROM items WHERE id = ?').get(itemId) as ItemRow | undefined;
    if (!row) return res.status(404).json({ error: '商品不存在' });

    db.prepare('UPDATE items SET status = ? WHERE id = ?').run(status, itemId);
    const updatedRow = db.prepare('SELECT * FROM items WHERE id = ?').get(itemId) as ItemRow;
    res.json(rowToItem(updatedRow));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '更新商品状态失败' });
  }
});

app.get('/api/activities/:id/search', (req, res) => {
  try {
    const { id } = req.params;
    const { q } = req.query as { q?: string };
    if (!q || q.length < 3) {
      return res.json({ results: [] });
    }

    const activityRow = db.prepare('SELECT * FROM activities WHERE id = ?').get(id) as ActivityRow | undefined;
    if (!activityRow) return res.status(404).json({ error: '活动不存在' });

    const keyword = `%${q}%`;
    const stallRows = db.prepare(`
      SELECT * FROM stalls
      WHERE activity_id = ? AND (owner_name LIKE ? OR CAST(stall_number AS TEXT) LIKE ?)
    `).all(id, keyword, keyword) as StallRow[];

    const itemRows = db.prepare(`
      SELECT items.*, stalls.activity_id, stalls.stall_number, stalls.owner_name, stalls.type, stalls.grid_x, stalls.grid_y
      FROM items
      JOIN stalls ON items.stall_id = stalls.id
      WHERE stalls.activity_id = ? AND items.name LIKE ?
    `).all(id, keyword) as Array<ItemRow & { activity_id: string; stall_number: number; owner_name: string | null; type: StallType | null; grid_x: number; grid_y: number }>;

    const stallResults = stallRows.map(row => ({
      type: 'stall' as const,
      stallId: row.id,
      stallNumber: row.stall_number,
      ownerName: row.owner_name,
      stallType: row.type,
      gridX: row.grid_x,
      gridY: row.grid_y,
      matchedItem: null as string | null,
    }));

    const itemResults = itemRows.map(row => ({
      type: 'item' as const,
      stallId: row.stall_id,
      stallNumber: row.stall_number,
      ownerName: row.owner_name,
      stallType: row.type,
      gridX: row.grid_x,
      gridY: row.grid_y,
      matchedItem: row.name,
    }));

    const seen = new Set<string>();
    const merged: Array<typeof stallResults[number] | typeof itemResults[number]> = [];
    for (const r of [...stallResults, ...itemResults]) {
      const key = r.stallId + '|' + (r.matchedItem || '');
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(r);
      }
    }

    res.json({ results: merged.slice(0, 20) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '搜索失败' });
  }
});

app.get('/api/activities', (_req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM activities ORDER BY created_at DESC LIMIT 20').all() as ActivityRow[];
    res.json(rows.map(rowToActivity));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取活动列表失败' });
  }
});

app.listen(PORT, () => {
  console.log(`Flea Market API server running on http://localhost:${PORT}`);
});
