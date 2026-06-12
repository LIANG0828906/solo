import { Router, type Request, type Response } from 'express';
import {
  getAllArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  getArticleExists,
} from '../repositories/articleRepository.js';
import type { Article, ProcessStep } from '../types/index.js';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const articles = await getAllArticles();
    res.status(200).json(articles);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server internal error' });
  }
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const article = await getArticleById(id);
    if (!article) {
      res.status(404).json({ success: false, error: 'Article not found' });
      return;
    }
    res.status(200).json(article);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server internal error' });
  }
});

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, completionDate, mainImageUrl, steps, leatherIds } = req.body as {
      name?: string;
      completionDate?: string;
      mainImageUrl?: string;
      steps?: ProcessStep[];
      leatherIds?: number[];
    };

    if (
      name === undefined ||
      name === '' ||
      completionDate === undefined ||
      completionDate === '' ||
      mainImageUrl === undefined ||
      mainImageUrl === '' ||
      steps === undefined ||
      !Array.isArray(steps) ||
      leatherIds === undefined ||
      !Array.isArray(leatherIds)
    ) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }

    const newArticle = await createArticle({
      name,
      completionDate,
      mainImageUrl,
      steps: steps.map((s) => ({
        stepOrder: s.stepOrder,
        description: s.description,
        duration: s.duration,
      })),
      leatherIds,
    });
    res.status(201).json(newArticle);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server internal error' });
  }
});

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { name, completionDate, mainImageUrl, steps, leatherIds } = req.body as {
      name?: string;
      completionDate?: string;
      mainImageUrl?: string;
      steps?: ProcessStep[];
      leatherIds?: number[];
    };

    if (
      name === undefined ||
      name === '' ||
      completionDate === undefined ||
      completionDate === '' ||
      mainImageUrl === undefined ||
      mainImageUrl === '' ||
      steps === undefined ||
      !Array.isArray(steps) ||
      leatherIds === undefined ||
      !Array.isArray(leatherIds)
    ) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }

    const exists = await getArticleExists(id);
    if (!exists) {
      res.status(404).json({ success: false, error: 'Article not found' });
      return;
    }

    await updateArticle(id, {
      name,
      completionDate,
      mainImageUrl,
      steps: steps.map((s) => ({
        stepOrder: s.stepOrder,
        description: s.description,
        duration: s.duration,
      })),
      leatherIds,
    });

    const updated = await getArticleById(id);
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server internal error' });
  }
});

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    await deleteArticle(id);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server internal error' });
  }
});

export default router;
