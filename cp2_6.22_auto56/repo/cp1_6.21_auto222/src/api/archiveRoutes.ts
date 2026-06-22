import { Router, Request, Response } from 'express';
import type { SaveData } from '../types';

const router = Router();

const saves: Map<string, SaveData> = new Map();

router.post('/save', (req: Request, res: Response) => {
  try {
    const body = req.body as Partial<SaveData>;
    const id = 'save_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    const saveData: SaveData = {
      id,
      buildings: body.buildings ?? [],
      resources: body.resources ?? {
        oxygen: 100, energy: 100, metal: 150,
        oxygenMax: 300, energyMax: 300, metalMax: 500,
      },
      survivalDays: body.survivalDays ?? 0,
      timestamp: Date.now(),
    };
    saves.set(id, saveData);
    res.json({ id, message: '存档成功' });
  } catch (err) {
    res.status(500).json({ error: '保存失败' });
  }
});

router.get('/load/:id', (req: Request, res: Response) => {
  const data = saves.get(req.params.id);
  if (!data) {
    return res.status(404).json({ error: '存档不存在' });
  }
  res.json(data);
});

router.delete('/delete/:id', (req: Request, res: Response) => {
  const deleted = saves.delete(req.params.id);
  res.json({ success: deleted, message: deleted ? '删除成功' : '存档不存在' });
});

router.get('/saves', (_req: Request, res: Response) => {
  const list = Array.from(saves.values())
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 10)
    .map(s => ({
      id: s.id,
      timestamp: s.timestamp,
      survivalDays: s.survivalDays,
    }));
  res.json(list);
});

export default router;
