import { Router, type Request, type Response } from 'express';
import { getLogsByBoardId, getMemberLoad } from '../store.js';

const router = Router();

router.get('/logs/:boardId', (req: Request, res: Response): void => {
  const logs = getLogsByBoardId(req.params.boardId);
  logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  res.json(logs);
});

router.get('/stats/:boardId/load', (req: Request, res: Response): void => {
  const load = getMemberLoad(req.params.boardId);
  res.json(load);
});

export default router;
