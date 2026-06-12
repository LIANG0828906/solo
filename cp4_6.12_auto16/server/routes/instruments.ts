import { Router, Request, Response } from 'express';
import {
  getWoods,
  getWoodById,
  getInstruments,
  getInstrumentByType,
  getLowStockWoods,
  updateWoodStock,
  Wood,
} from '../db';

const router = Router();

router.get('/instruments', (_req: Request, res: Response) => {
  try {
    const instruments = getInstruments();
    res.json(instruments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch instruments' });
  }
});

router.get('/instruments/:type', (req: Request, res: Response) => {
  try {
    const instrument = getInstrumentByType(req.params.type);
    if (!instrument) {
      res.status(404).json({ error: 'Instrument not found' });
      return;
    }
    res.json(instrument);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch instrument' });
  }
});

router.get('/woods', (req: Request, res: Response) => {
  try {
    const category = req.query.category as string | undefined;
    const woods = getWoods(category);
    res.json(woods);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch woods' });
  }
});

router.get('/woods/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const wood = getWoodById(id);
    if (!wood) {
      res.status(404).json({ error: 'Wood not found' });
      return;
    }
    res.json(wood);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch wood' });
  }
});

router.get('/woods/low-stock', (_req: Request, res: Response) => {
  try {
    const lowStockWoods = getLowStockWoods();
    res.json(lowStockWoods);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch low stock woods' });
  }
});

router.put('/woods/:id/stock', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { stock } = req.body as { stock: number };
    if (typeof stock !== 'number' || stock < 0) {
      res.status(400).json({ error: 'Invalid stock value' });
      return;
    }
    updateWoodStock(id, stock);
    const wood = getWoodById(id);
    res.json(wood);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update wood stock' });
  }
});

router.post('/woods/check-availability', (req: Request, res: Response) => {
  try {
    const { woodIds } = req.body as { woodIds: number[] };
    const results: { id: number; available: boolean; stock: number }[] = [];
    for (const id of woodIds) {
      const wood = getWoodById(id) as Wood | undefined;
      if (wood) {
        results.push({
          id,
          available: wood.stock >= 5,
          stock: wood.stock,
        });
      }
    }
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Failed to check availability' });
  }
});

export default router;
