import { Router, Request, Response } from 'express';
import { generateQR } from '../utils/generateQR';
import type { ShareInfo } from '../types';
import { mockRecipes } from '../data/mockData';

const router = Router();

router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const recipe = mockRecipes.find(r => r.id === id);

  if (!recipe) {
    return res.status(404).json({ error: '食谱不存在' });
  }

  const host = req.get('host') || 'localhost:5173';
  const frontendBase = `${req.protocol}://${host.replace(':3001', ':5173')}`;
  const shareUrl = `${frontendBase}/share/${id}`;
  const qrCodeDataUrl = await generateQR(id, frontendBase);

  const result: ShareInfo = {
    shareUrl,
    qrCodeDataUrl
  };

  res.json(result);
});

router.get('/recipe/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const recipe = mockRecipes.find(r => r.id === id);

  if (!recipe) {
    return res.status(404).json({ error: '食谱不存在' });
  }

  res.json(recipe);
});

export default router;
