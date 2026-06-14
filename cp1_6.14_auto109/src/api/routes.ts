import { Router } from 'express';
import { Low } from 'lowdb';
import { JSONFilePreset } from 'lowdb/node';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import type { ArtifactData, RestorationRecord } from '../types.js';
import { ALL_ARTIFACTS } from '../data/artifacts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface DBSchema {
  records: RestorationRecord[];
  artifacts: ArtifactData[];
}

const dbPath = path.join(__dirname, '..', '..', 'data', 'db.json');

const router = Router();
let db: Low<DBSchema> | null = null;

const getDB = async (): Promise<Low<DBSchema>> => {
  if (!db) {
    const defaultData: DBSchema = {
      records: [],
      artifacts: ALL_ARTIFACTS as unknown as ArtifactData[],
    };
    db = await JSONFilePreset<DBSchema>(dbPath, defaultData);
    await db.write();
  }
  return db;
};

router.post('/records', async (req, res) => {
  try {
    const database = await getDB();
    const body = req.body as Partial<RestorationRecord>;
    const record: RestorationRecord = {
      id: body.id ?? uuidv4(),
      artifactId: body.artifactId ?? '',
      artifactName: body.artifactName ?? '未知文物',
      site: body.site ?? 'desert',
      tool: body.tool ?? 'brush',
      integrity: typeof body.integrity === 'number' ? body.integrity : 80,
      stars: typeof body.stars === 'number' ? Math.max(1, Math.min(3, body.stars)) : 1,
      digTime: typeof body.digTime === 'number' ? body.digTime : 0,
      restorationAccuracy:
        typeof body.restorationAccuracy === 'number' ? body.restorationAccuracy : 85,
      createdAt: body.createdAt ?? new Date().toISOString(),
    };
    database.data.records.unshift(record);
    await database.write();
    res.json({ success: true, data: record });
  } catch (e) {
    console.error('保存记录错误', e);
    res.status(500).json({ success: false, message: '保存失败' });
  }
});

router.get('/records', async (_req, res) => {
  try {
    const database = await getDB();
    res.json({ success: true, data: database.data.records });
  } catch (e) {
    console.error('读取错误', e);
    res.status(500).json({ success: false, message: '读取失败' });
  }
});

router.delete('/records/:id', async (req, res) => {
  try {
    const database = await getDB();
    const id = req.params.id;
    const before = database.data.records.length;
    database.data.records = database.data.records.filter((r) => r.id !== id);
    await database.write();
    res.json({ success: true, data: { deleted: before - database.data.records.length } });
  } catch (e) {
    console.error('删除错误', e);
    res.status(500).json({ success: false, message: '删除失败' });
  }
});

router.get('/artifacts', async (_req, res) => {
  try {
    const database = await getDB();
    res.json({ success: true, data: database.data.artifacts });
  } catch (e) {
    res.status(500).json({ success: false, message: '读取失败' });
  }
});

router.get('/artifacts/random', async (req, res) => {
  try {
    const site = (req.query.site as string) ?? '';
    const database = await getDB();
    let list = database.data.artifacts;
    if (site) list = list.filter((a) => a.site === site);
    if (list.length === 0) list = database.data.artifacts;
    const one = list[Math.floor(Math.random() * list.length)];
    res.json({ success: true, data: one });
  } catch (e) {
    res.status(500).json({ success: false, message: '读取失败' });
  }
});

export default router;
