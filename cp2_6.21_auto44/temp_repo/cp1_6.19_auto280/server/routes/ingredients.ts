import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

let pool: Pool | null = null;

export function setPool(p: Pool | null) {
  pool = p;
}

interface Ingredient {
  id: string;
  user_id: string;
  name: string;
  quantity: number;
  unit: string;
  expiry_date: string;
  image_url: string | null;
  category: string;
  description: string | null;
  is_exchanged: boolean;
  created_at: string;
  distance?: number;
  freshness_days?: number;
}

const mockIngredients: Ingredient[] = [];

const FRESHNESS_MAP: Record<string, number> = {
  '绿叶菜': 3,
  '水果': 5,
  '肉类': 2,
  '调味料': 30,
  '根茎类': 7,
  '乳制品': 5,
};

function getFreshnessDays(category: string): number {
  return FRESHNESS_MAP[category] ?? 7;
}

function addComputedFields(item: Ingredient): Ingredient {
  item.distance = Math.round((0.3 + Math.random() * 2.2) * 10) / 10;
  item.freshness_days = getFreshnessDays(item.category);
  return item;
}

router.get('/', async (req: Request, res: Response) => {
  const { category } = req.query;

  try {
    if (pool) {
      let query = 'SELECT * FROM ingredients WHERE is_exchanged = FALSE';
      const params: unknown[] = [];
      if (category) {
        query += ' AND category = $1';
        params.push(category as string);
      }
      query += ' ORDER BY created_at DESC';
      const result = await pool.query(query, params);
      const ingredients = result.rows.map(addComputedFields);
      res.json(ingredients);
    } else {
      let results = mockIngredients.filter((i) => !i.is_exchanged);
      if (category) {
        results = results.filter((i) => i.category === category);
      }
      results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      res.json(results.map(addComputedFields));
    }
  } catch (err) {
    console.error('获取食材列表失败:', err);
    res.status(500).json({ error: '获取食材列表失败' });
  }
});

router.post('/', authMiddleware, async (req: Request, res: Response) => {
  const { name, quantity, unit, expiry_date, image_url, category, description } = req.body;
  const userId = req.user!.id;

  if (!name || !quantity || !expiry_date || !category) {
    res.status(400).json({ error: '缺少必填字段' });
    return;
  }

  try {
    if (pool) {
      const result = await pool.query(
        `INSERT INTO ingredients (user_id, name, quantity, unit, expiry_date, image_url, category, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [userId, name, quantity, unit || 'g', expiry_date, image_url || null, category, description || null]
      );
      const ingredient = addComputedFields(result.rows[0]);
      res.status(201).json(ingredient);
    } else {
      const ingredient: Ingredient = {
        id: crypto.randomUUID(),
        user_id: userId,
        name,
        quantity,
        unit: unit || 'g',
        expiry_date,
        image_url: image_url || null,
        category,
        description: description || null,
        is_exchanged: false,
        created_at: new Date().toISOString(),
      };
      mockIngredients.push(ingredient);
      res.status(201).json(addComputedFields(ingredient));
    }
  } catch (err) {
    console.error('创建食材失败:', err);
    res.status(500).json({ error: '创建食材失败' });
  }
});

router.put('/:id/exchange', authMiddleware, async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  try {
    if (pool) {
      const check = await pool.query('SELECT * FROM ingredients WHERE id = $1', [id]);
      if (check.rows.length === 0) {
        res.status(404).json({ error: '食材不存在' });
        return;
      }
      if (check.rows[0].user_id !== userId) {
        res.status(403).json({ error: '只能标记自己的食材' });
        return;
      }
      if (check.rows[0].is_exchanged) {
        res.status(400).json({ error: '食材已被交换' });
        return;
      }
      const result = await pool.query(
        'UPDATE ingredients SET is_exchanged = TRUE WHERE id = $1 RETURNING *',
        [id]
      );
      await pool.query('UPDATE users SET exchange_count = exchange_count + 1 WHERE id = $1', [userId]);
      res.json(addComputedFields(result.rows[0]));
    } else {
      const idx = mockIngredients.findIndex((i) => i.id === id);
      if (idx === -1) {
        res.status(404).json({ error: '食材不存在' });
        return;
      }
      if (mockIngredients[idx].user_id !== userId) {
        res.status(403).json({ error: '只能标记自己的食材' });
        return;
      }
      if (mockIngredients[idx].is_exchanged) {
        res.status(400).json({ error: '食材已被交换' });
        return;
      }
      mockIngredients[idx].is_exchanged = true;
      res.json(addComputedFields(mockIngredients[idx]));
    }
  } catch (err) {
    console.error('标记交换失败:', err);
    res.status(500).json({ error: '标记交换失败' });
  }
});

export default router;
