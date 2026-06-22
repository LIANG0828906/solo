import { Router, type Request, type Response } from 'express';
import type { Game } from '../../shared/types.js';

const router = Router();

const games = new Map<string, Game>();

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

router.get('/', (req: Request, res: Response): void => {
  const { teacherId } = req.query;
  const result: Game[] = [];
  for (const game of games.values()) {
    if (!teacherId || game.teacherId === teacherId) {
      result.push(game);
    }
  }
  res.json({ success: true, data: result });
});

router.get('/:id', (req: Request, res: Response): void => {
  const game = games.get(req.params.id);
  if (!game) {
    res.status(404).json({ success: false, error: 'Game not found' });
    return;
  }
  res.json({ success: true, data: game });
});

router.post('/', (req: Request, res: Response): void => {
  const { teacherId, theme, cards, rules, winCondition } = req.body;
  if (!teacherId || !theme || !cards || !rules || !winCondition) {
    res.status(400).json({ success: false, error: 'Missing required fields' });
    return;
  }
  if (!Array.isArray(cards) || cards.length < 10) {
    res.status(400).json({ success: false, error: 'Game must have at least 10 cards' });
    return;
  }
  const game: Game = {
    id: generateId(),
    teacherId,
    theme,
    cards,
    rules,
    winCondition,
    createdAt: new Date().toISOString(),
  };
  games.set(game.id, game);
  res.status(201).json({ success: true, data: game });
});

router.put('/:id', (req: Request, res: Response): void => {
  const game = games.get(req.params.id);
  if (!game) {
    res.status(404).json({ success: false, error: 'Game not found' });
    return;
  }
  const { theme, cards, rules, winCondition } = req.body;
  if (cards !== undefined && (!Array.isArray(cards) || cards.length < 10)) {
    res.status(400).json({ success: false, error: 'Game must have at least 10 cards' });
    return;
  }
  const updated: Game = {
    ...game,
    ...(theme && { theme }),
    ...(cards && { cards }),
    ...(rules && { rules }),
    ...(winCondition && { winCondition }),
  };
  games.set(game.id, updated);
  res.json({ success: true, data: updated });
});

router.delete('/:id', (req: Request, res: Response): void => {
  if (!games.has(req.params.id)) {
    res.status(404).json({ success: false, error: 'Game not found' });
    return;
  }
  games.delete(req.params.id);
  res.json({ success: true, data: null });
});

export default router;
export { games };
