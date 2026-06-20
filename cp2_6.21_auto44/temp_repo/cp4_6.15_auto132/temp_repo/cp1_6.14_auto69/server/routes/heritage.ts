import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import db from '../db.js';
import type { HeritageItem, Rating } from '../types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

const uploadsDir = path.join(__dirname, '..', '..', 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const calcAverageRating = (ratings: Rating[]): number => {
  if (ratings.length === 0) return 0;
  const sum = ratings.reduce((acc, r) => acc + r.score, 0);
  return Math.round((sum / ratings.length) * 10) / 10;
};

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      search = '',
      category = '',
      region = '',
      page = '1',
      limit = '12',
      favorites = '',
    } = req.query as {
      search?: string;
      category?: string;
      region?: string;
      page?: string;
      limit?: string;
      favorites?: string;
    };

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 12));

    let items = [...db.data!.heritage];

    if (favorites) {
      const user = db.data!.users.find((u) => u.id === favorites);
      if (user) {
        items = items.filter((h) => user.favorites.includes(h.id));
      } else {
        items = [];
      }
    }

    if (search.trim()) {
      const keyword = search.trim().toLowerCase();
      items = items.filter(
        (h) =>
          h.name.toLowerCase().includes(keyword) ||
          h.story.toLowerCase().includes(keyword),
      );
    }

    if (category.trim()) {
      items = items.filter((h) => h.category === category.trim());
    }

    if (region.trim()) {
      items = items.filter((h) => h.region === region.trim());
    }

    const total = items.length;
    const totalPages = Math.ceil(total / limitNum);
    const startIdx = (pageNum - 1) * limitNum;
    const paginatedItems = items.slice(startIdx, startIdx + limitNum);

    res.status(200).json({
      success: true,
      items: paginatedItems,
      total,
      page: pageNum,
      totalPages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取非遗列表失败',
    });
  }
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const item = db.data!.heritage.find((h) => h.id === id);

    if (!item) {
      res.status(404).json({
        success: false,
        error: '非遗项目不存在',
      });
      return;
    }

    res.status(200).json({
      success: true,
      item,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取非遗详情失败',
    });
  }
});

router.post('/', upload.array('images', 5), async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      region,
      category,
      videoUrl,
      story,
      createdBy = 'user-demo',
    } = req.body as {
      name?: string;
      region?: string;
      category?: string;
      videoUrl?: string;
      story?: string;
      createdBy?: string;
    };

    if (!name || !region || !category || !story) {
      res.status(400).json({
        success: false,
        error: 'name、region、category、story 为必填字段',
      });
      return;
    }

    const imageUrls: string[] = [];

    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        const filename = `${uuidv4()}-${Date.now()}.jpg`;
        const outputPath = path.join(uploadsDir, filename);

        await sharp(file.buffer)
          .resize(1200, null, { withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toFile(outputPath);

        imageUrls.push(`/uploads/${filename}`);
      }
    }

    const newItem: HeritageItem = {
      id: uuidv4(),
      name: name.trim(),
      region: region.trim(),
      category: category.trim(),
      images: imageUrls,
      videoUrl: videoUrl?.trim() || undefined,
      story: story.trim(),
      ratings: [],
      averageRating: 0,
      createdAt: new Date().toISOString(),
      createdBy: createdBy,
    };

    db.data!.heritage.unshift(newItem);
    await db.write();

    res.status(201).json({
      success: true,
      item: newItem,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '创建非遗项目失败',
    });
  }
});

router.post('/:id/rate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { userId, score } = req.body as { userId?: string; score?: number };

    if (!userId || score === undefined || score === null) {
      res.status(400).json({
        success: false,
        error: 'userId 和 score 为必填字段',
      });
      return;
    }

    const scoreNum = Number(score);
    if (isNaN(scoreNum) || scoreNum < 1 || scoreNum > 5) {
      res.status(400).json({
        success: false,
        error: '评分必须是 1-5 之间的整数',
      });
      return;
    }

    const item = db.data!.heritage.find((h) => h.id === id);
    if (!item) {
      res.status(404).json({
        success: false,
        error: '非遗项目不存在',
      });
      return;
    }

    const existingRating = item.ratings.find((r) => r.userId === userId);
    if (existingRating) {
      existingRating.score = scoreNum;
      existingRating.createdAt = new Date().toISOString();
    } else {
      const newRating: Rating = {
        userId,
        score: scoreNum,
        createdAt: new Date().toISOString(),
      };
      item.ratings.push(newRating);
    }

    item.averageRating = calcAverageRating(item.ratings);
    await db.write();

    res.status(200).json({
      success: true,
      averageRating: item.averageRating,
      ratingsCount: item.ratings.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '评分失败',
    });
  }
});

router.post('/:id/favorite', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { userId } = req.body as { userId?: string };

    if (!userId) {
      res.status(400).json({
        success: false,
        error: 'userId 为必填字段',
      });
      return;
    }

    const user = db.data!.users.find((u) => u.id === userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: '用户不存在',
      });
      return;
    }

    const heritage = db.data!.heritage.find((h) => h.id === id);
    if (!heritage) {
      res.status(404).json({
        success: false,
        error: '非遗项目不存在',
      });
      return;
    }

    const idx = user.favorites.indexOf(id);
    let isFavorited: boolean;
    if (idx > -1) {
      user.favorites.splice(idx, 1);
      isFavorited = false;
    } else {
      user.favorites.push(id);
      isFavorited = true;
    }

    await db.write();

    res.status(200).json({
      success: true,
      favorites: user.favorites,
      isFavorited,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '切换收藏状态失败',
    });
  }
});

export default router;
