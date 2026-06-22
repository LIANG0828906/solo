import { Router, type Request, type Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import store from '../data/store.js';
import type { CookingHistory } from '../data/store.js';

const router = Router();

router.get('/', (req: Request, res: Response): void => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

  const filtered = store.history
    .filter((h) => h.date >= sevenDaysAgoStr)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  res.status(200).json({
    success: true,
    data: filtered,
  });
});

router.post('/', (req: Request, res: Response): void => {
  const { recipeId, recipeName, date, completed } = req.body as Partial<CookingHistory>;

  if (!recipeId || !recipeName) {
    res.status(400).json({
      success: false,
      error: '缺少必要字段: recipeId, recipeName',
    });
    return;
  }

  const newRecord: CookingHistory = {
    id: uuidv4(),
    recipeId,
    recipeName,
    date: date || new Date().toISOString().split('T')[0],
    completed: completed !== undefined ? completed : true,
  };

  store.history.push(newRecord);

  res.status(201).json({
    success: true,
    data: newRecord,
  });
});

export default router;
