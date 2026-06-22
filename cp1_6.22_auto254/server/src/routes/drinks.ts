import { Router, Request, Response } from 'express';
import { store } from '../store';
import type { ApiResponse, CreateDrinkRequest, Drink } from '@shared/types';

const router = Router();

router.get('/', (_req: Request, res: Response<ApiResponse<Drink[]>>) => {
  try {
    const drinks = store.getDrinks();
    res.json({ success: true, data: drinks });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取饮品列表失败' });
  }
});

router.get('/:id', (req: Request<{ id: string }>, res: Response<ApiResponse<Drink>>) => {
  try {
    const drink = store.getDrinkById(req.params.id);
    if (!drink) {
      res.status(404).json({ success: false, error: '饮品不存在' });
      return;
    }
    res.json({ success: true, data: drink });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取饮品详情失败' });
  }
});

router.post('/', (req: Request<unknown, unknown, CreateDrinkRequest>, res: Response<ApiResponse<Drink>>) => {
  try {
    const { name, description, category, price, costPrice, ingredients } = req.body;

    if (!name || !category || price === undefined || costPrice === undefined || !ingredients) {
      res.status(400).json({ success: false, error: '缺少必要字段' });
      return;
    }

    const ingredientsWithIds = ingredients.map((ing) => {
      const existing = store.getIngredientByName(ing.ingredientName);
      if (existing) {
        return {
          ingredientId: existing.id,
          ingredientName: ing.ingredientName,
          amount: ing.amount,
          unit: ing.unit,
        };
      }
      return {
        ingredientId: '',
        ingredientName: ing.ingredientName,
        amount: ing.amount,
        unit: ing.unit,
      };
    });

    const newDrink = store.addDrink({
      name,
      description: description || '',
      category,
      price,
      costPrice,
      ingredients: ingredientsWithIds,
    });

    res.status(201).json({ success: true, data: newDrink });
  } catch (error) {
    res.status(500).json({ success: false, error: '创建饮品失败' });
  }
});

router.put('/:id', (req: Request<{ id: string }, unknown, Partial<CreateDrinkRequest>>, res: Response<ApiResponse<Drink>>) => {
  try {
    const existing = store.getDrinkById(req.params.id);
    if (!existing) {
      res.status(404).json({ success: false, error: '饮品不存在' });
      return;
    }

    const { name, description, category, price, costPrice, ingredients } = req.body;

    const updates: Partial<Drink> = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (category !== undefined) updates.category = category;
    if (price !== undefined) updates.price = price;
    if (costPrice !== undefined) updates.costPrice = costPrice;
    if (ingredients !== undefined) {
      updates.ingredients = ingredients.map((ing) => {
        const existingIng = store.getIngredientByName(ing.ingredientName);
        return {
          ingredientId: existingIng?.id || '',
          ingredientName: ing.ingredientName,
          amount: ing.amount,
          unit: ing.unit,
        };
      });
    }

    const updated = store.updateDrink(req.params.id, updates);
    res.json({ success: true, data: updated! });
  } catch (error) {
    res.status(500).json({ success: false, error: '更新饮品失败' });
  }
});

router.delete('/:id', (req: Request<{ id: string }>, res: Response<ApiResponse<null>>) => {
  try {
    const deleted = store.deleteDrink(req.params.id);
    if (!deleted) {
      res.status(404).json({ success: false, error: '饮品不存在' });
      return;
    }
    res.json({ success: true, data: null });
  } catch (error) {
    res.status(500).json({ success: false, error: '删除饮品失败' });
  }
});

export default router;
