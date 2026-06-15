import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import db from '../db.js';
import { Batch, determineRoastLevel } from '../models.js';
import { authenticateToken } from './auth.js';

const router = Router();

interface AuthRequest extends Request {
  userId?: string;
}

function parseBatch(row: any): Batch {
  return {
    id: row.id,
    origin: row.origin,
    variety: row.variety,
    processingMethod: row.processingMethod,
    roastProfile: JSON.parse(row.roastProfile),
    greenScore: row.greenScore,
    flavorNotes: JSON.parse(row.flavorNotes),
    roastDate: row.roastDate,
    createdAt: row.createdAt,
    flavorProfile: JSON.parse(row.flavorProfile),
    roastLevel: row.roastLevel,
    userId: row.userId,
  };
}

router.get('/batches', authenticateToken, (req: AuthRequest, res: Response) => {
  const { search, roastLevel } = req.query;
  const userId = req.userId;

  let query = 'SELECT * FROM batches WHERE userId = ?';
  const params: any[] = [userId];

  if (search) {
    query += ' AND (origin LIKE ? OR variety LIKE ? OR processingMethod LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  if (roastLevel) {
    query += ' AND roastLevel = ?';
    params.push(roastLevel);
  }

  query += ' ORDER BY createdAt DESC';

  const rows = db.prepare(query).all(...params);
  const batches = rows.map(parseBatch);

  res.json(batches);
});

router.get('/batch/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.userId;

  const row: any = db.prepare('SELECT * FROM batches WHERE id = ? AND userId = ?').get(id, userId);
  if (!row) {
    return res.status(404).json({ error: '批次不存在' });
  }

  res.json(parseBatch(row));
});

router.get('/batch/public/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  const row: any = db.prepare('SELECT * FROM batches WHERE id = ?').get(id);
  if (!row) {
    return res.status(404).json({ error: '批次不存在' });
  }

  const batch = parseBatch(row);
  const { userId, ...publicBatch } = batch;
  res.json(publicBatch);
});

router.post('/batch', authenticateToken, (req: AuthRequest, res: Response) => {
  const {
    origin,
    variety,
    processingMethod,
    roastProfile,
    greenScore,
    flavorNotes,
    roastDate,
    flavorProfile,
  } = req.body;

  const userId = req.userId;

  if (!origin || !variety || !processingMethod || !roastProfile || !roastDate) {
    return res.status(400).json({ error: '请填写所有必填字段' });
  }

  const id = uuidv4();
  const createdAt = new Date().toISOString();
  const roastLevel = determineRoastLevel(roastProfile);

  const defaultFlavorProfile = flavorProfile || {
    acidity: 3,
    sweetness: 3,
    bitterness: 2,
    body: 3,
    aftertaste: 3,
  };

  db.prepare(`
    INSERT INTO batches (
      id, userId, origin, variety, processingMethod,
      roastProfile, greenScore, flavorNotes, roastDate,
      createdAt, flavorProfile, roastLevel
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    userId,
    origin,
    variety,
    processingMethod,
    JSON.stringify(roastProfile),
    greenScore || 0,
    JSON.stringify(flavorNotes || []),
    roastDate,
    createdAt,
    JSON.stringify(defaultFlavorProfile),
    roastLevel
  );

  const batch: Batch = {
    id,
    origin,
    variety,
    processingMethod,
    roastProfile,
    greenScore: greenScore || 0,
    flavorNotes: flavorNotes || [],
    roastDate,
    createdAt,
    flavorProfile: defaultFlavorProfile,
    roastLevel,
    userId: userId!,
  };

  res.status(201).json(batch);
});

router.put('/batch/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.userId;
  const {
    origin,
    variety,
    processingMethod,
    roastProfile,
    greenScore,
    flavorNotes,
    roastDate,
    flavorProfile,
  } = req.body;

  const existing: any = db.prepare('SELECT id FROM batches WHERE id = ? AND userId = ?').get(id, userId);
  if (!existing) {
    return res.status(404).json({ error: '批次不存在' });
  }

  const roastLevel = roastProfile ? determineRoastLevel(roastProfile) : undefined;

  const updates: string[] = [];
  const params: any[] = [];

  if (origin !== undefined) { updates.push('origin = ?'); params.push(origin); }
  if (variety !== undefined) { updates.push('variety = ?'); params.push(variety); }
  if (processingMethod !== undefined) { updates.push('processingMethod = ?'); params.push(processingMethod); }
  if (roastProfile !== undefined) { updates.push('roastProfile = ?'); params.push(JSON.stringify(roastProfile)); }
  if (greenScore !== undefined) { updates.push('greenScore = ?'); params.push(greenScore); }
  if (flavorNotes !== undefined) { updates.push('flavorNotes = ?'); params.push(JSON.stringify(flavorNotes)); }
  if (roastDate !== undefined) { updates.push('roastDate = ?'); params.push(roastDate); }
  if (flavorProfile !== undefined) { updates.push('flavorProfile = ?'); params.push(JSON.stringify(flavorProfile)); }
  if (roastLevel !== undefined) { updates.push('roastLevel = ?'); params.push(roastLevel); }

  if (updates.length > 0) {
    params.push(id, userId!);
    db.prepare(`UPDATE batches SET ${updates.join(', ')} WHERE id = ? AND userId = ?`).run(...params);
  }

  const updated: any = db.prepare('SELECT * FROM batches WHERE id = ?').get(id);
  res.json(parseBatch(updated));
});

router.delete('/batch/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.userId;

  const result: any = db.prepare('DELETE FROM batches WHERE id = ? AND userId = ?').run(id, userId);
  if (result.changes === 0) {
    return res.status(404).json({ error: '批次不存在' });
  }

  res.json({ success: true });
});

router.get('/batch/:id/qrcode', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.userId;

  const row: any = db.prepare('SELECT id FROM batches WHERE id = ? AND userId = ?').get(id, userId);
  if (!row) {
    return res.status(404).json({ error: '批次不存在' });
  }

  const publicUrl = `${req.protocol}://${req.get('host')}/public/batch/${id}`;

  try {
    const qrDataUrl = await QRCode.toDataURL(publicUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#5C3A21',
        light: '#FFFFFF',
      },
    });

    res.json({ qrcode: qrDataUrl, url: publicUrl });
  } catch (err) {
    res.status(500).json({ error: '生成二维码失败' });
  }
});

export default router;
