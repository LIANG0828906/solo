import { Router, type Request, type Response } from 'express';
import { getStats } from '../repositories/statsRepository.js';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await getStats();
    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server internal error' });
  }
});

export default router;
