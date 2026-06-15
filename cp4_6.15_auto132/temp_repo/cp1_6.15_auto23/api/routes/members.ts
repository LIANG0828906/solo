import { Router } from 'express';
import type { Request, Response } from 'express';
import { dataStore } from '../models/dataStore.js';

const router = Router();

router.get('/me', (_req: Request, res: Response) => {
  res.json({ success: true, data: dataStore.getCurrentMember() });
});

router.get('/', (_req: Request, res: Response) => {
  res.json({ success: true, data: dataStore.getMembers() });
});

export default router;
