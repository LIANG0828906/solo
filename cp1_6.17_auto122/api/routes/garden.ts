import express, { type Request, type Response } from 'express';
import {
  getAllGardens,
  getGardenById,
  claimGarden,
  addWaterLog,
  harvestGarden,
  updateGarden,
} from '../store.js';
import type { ClaimGardenRequest, AddWaterLogRequest } from '../../shared/types.js';

const router = express.Router();

router.get('/', (_req: Request, res: Response) => {
  res.json({ success: true, data: getAllGardens() });
});

router.get('/:id', (req: Request, res: Response) => {
  const garden = getGardenById(req.params.id);
  if (!garden) {
    res.status(404).json({ success: false, error: 'Garden not found' });
    return;
  }
  res.json({ success: true, data: garden });
});

router.put('/:id/claim', (req: Request, res: Response) => {
  const { ownerName, cropType } = req.body as ClaimGardenRequest;
  if (!ownerName || !cropType) {
    res.status(400).json({ success: false, error: 'ownerName and cropType required' });
    return;
  }
  const garden = claimGarden(req.params.id, ownerName, cropType);
  if (!garden) {
    res.status(404).json({ success: false, error: 'Garden not found' });
    return;
  }
  res.json({ success: true, data: garden });
});

router.post('/:id/water', (req: Request, res: Response) => {
  const { amount } = req.body as AddWaterLogRequest;
  if (typeof amount !== 'number') {
    res.status(400).json({ success: false, error: 'amount required' });
    return;
  }
  const result = addWaterLog(req.params.id, amount);
  if (!result) {
    res.status(404).json({ success: false, error: 'Garden not found' });
    return;
  }
  res.json({ success: true, data: result.garden });
});

router.post('/:id/harvest', (req: Request, res: Response) => {
  const garden = harvestGarden(req.params.id);
  if (!garden) {
    res.status(404).json({ success: false, error: 'Garden not found' });
    return;
  }
  res.json({ success: true, data: garden });
});

router.put('/:id', (req: Request, res: Response) => {
  const garden = updateGarden(req.params.id, req.body);
  if (!garden) {
    res.status(404).json({ success: false, error: 'Garden not found' });
    return;
  }
  res.json({ success: true, data: garden });
});

export default router;
