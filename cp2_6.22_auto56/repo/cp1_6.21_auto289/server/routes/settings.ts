import { Router, Request, Response } from 'express';
import { getDb, saveDatabase } from '../db.js';
import type { Settings } from '../../shared/types.js';

const router = Router();

function mapRowToSettings(row: any[]): Settings {
  return {
    userName: row[1] as string,
    hourlyRate: row[2] as number,
    logoData: row[3] as string,
  };
}

router.get('/', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const result = db.exec('SELECT * FROM settings WHERE id = 1');

    if (!result[0]?.values.length) {
      return res.status(404).json({ success: false, error: '设置不存在' });
    }

    const settings = mapRowToSettings(result[0].values[0]);
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('获取设置失败:', error);
    res.status(500).json({ success: false, error: '获取设置失败' });
  }
});

router.put('/', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { userName, hourlyRate, logoData } = req.body;

    const existing = db.exec('SELECT * FROM settings WHERE id = 1');
    if (!existing[0]?.values.length) {
      return res.status(404).json({ success: false, error: '设置不存在' });
    }

    db.run(
      `UPDATE settings SET 
        user_name = COALESCE(?, user_name),
        hourly_rate = COALESCE(?, hourly_rate),
        logo_data = COALESCE(?, logo_data)
       WHERE id = 1`,
      [userName !== undefined ? userName : null, hourlyRate !== undefined ? hourlyRate : null, logoData !== undefined ? logoData : null]
    );
    saveDatabase();

    const result = db.exec('SELECT * FROM settings WHERE id = 1');
    const settings = mapRowToSettings(result[0].values[0]);

    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('更新设置失败:', error);
    res.status(500).json({ success: false, error: '更新设置失败' });
  }
});

export default router;
