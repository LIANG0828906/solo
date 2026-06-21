import { Router, Request, Response } from 'express';
import type { Recipe } from '../types';
import { mockRecipes } from '../data/mockData';

const router = Router();

let favoriteIds: string[] = [];
const recipeMap = new Map<string, Recipe>();
mockRecipes.forEach(r => recipeMap.set(r.id, r));

router.get('/', (req: Request, res: Response) => {
  const favorites: Recipe[] = favoriteIds
    .map(id => recipeMap.get(id))
    .filter((r): r is Recipe => r !== undefined)
    .map(r => ({ ...r, isFavorite: true }));

  res.json(favorites);
});

router.post('/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  if (!recipeMap.has(id)) {
    return res.status(404).json({ error: '食谱不存在' });
  }

  if (!favoriteIds.includes(id)) {
    favoriteIds.push(id);
  }

  res.json({ success: true, isFavorite: true });
});

router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  favoriteIds = favoriteIds.filter(fid => fid !== id);
  res.json({ success: true, isFavorite: false });
});

export { favoriteIds, recipeMap };
export default router;
