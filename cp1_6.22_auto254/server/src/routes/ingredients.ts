import { Router, Request, Response } from 'express';
import { store } from '../store';
import type { ApiResponse, CreateIngredientRequest, DeductStockRequest, Ingredient } from '@shared/types';

const router = Router();

router.get('/', (_req: Request, res: Response<ApiResponse<Ingredient[]>>) => {
  try {
    const ingredients = store.getIngredients();
    res.json({ success: true, data: ingredients });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取原料列表失败' });
  }
});

router.get('/:id', (req: Request<{ id: string }>, res: Response<ApiResponse<Ingredient>>) => {
  try {
    const ingredient = store.getIngredientById(req.params.id);
    if (!ingredient) {
      res.status(404).json({ success: false, error: '原料不存在' });
      return;
    }
    res.json({ success: true, data: ingredient });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取原料详情失败' });
  }
});

router.post('/', (req: Request<unknown, unknown, CreateIngredientRequest>, res: Response<ApiResponse<Ingredient>>) => {
  try {
    const { name, stock, unit, purchasePrice, warningThreshold } = req.body;

    if (!name || stock === undefined || !unit || purchasePrice === undefined || warningThreshold === undefined) {
      res.status(400).json({ success: false, error: '缺少必要字段' });
      return;
    }

    const existing = store.getIngredientByName(name);
    if (existing) {
      res.status(400).json({ success: false, error: '原料已存在' });
      return;
    }

    const newIngredient = store.addIngredient({
      name,
      stock,
      unit,
      purchasePrice,
      warningThreshold,
    });

    res.status(201).json({ success: true, data: newIngredient });
  } catch (error) {
    res.status(500).json({ success: false, error: '创建原料失败' });
  }
});

router.put('/:id', (req: Request<{ id: string }, unknown, Partial<CreateIngredientRequest>>, res: Response<ApiResponse<Ingredient>>) => {
  try {
    const existing = store.getIngredientById(req.params.id);
    if (!existing) {
      res.status(404).json({ success: false, error: '原料不存在' });
      return;
    }

    const { name, stock, unit, purchasePrice, warningThreshold } = req.body;

    const updates: Partial<Ingredient> = {};
    if (name !== undefined) updates.name = name;
    if (stock !== undefined) updates.stock = stock;
    if (unit !== undefined) updates.unit = unit;
    if (purchasePrice !== undefined) updates.purchasePrice = purchasePrice;
    if (warningThreshold !== undefined) updates.warningThreshold = warningThreshold;

    const updated = store.updateIngredient(req.params.id, updates);
    res.json({ success: true, data: updated! });
  } catch (error) {
    res.status(500).json({ success: false, error: '更新原料失败' });
  }
});

router.delete('/:id', (req: Request<{ id: string }>, res: Response<ApiResponse<null>>) => {
  try {
    const deleted = store.deleteIngredient(req.params.id);
    if (!deleted) {
      res.status(404).json({ success: false, error: '原料不存在' });
      return;
    }
    res.json({ success: true, data: null });
  } catch (error) {
    res.status(500).json({ success: false, error: '删除原料失败' });
  }
});

router.post('/deduct', (req: Request<unknown, unknown, DeductStockRequest>, res: Response<ApiResponse<null>>) => {
  try {
    const { deductions } = req.body;

    if (!deductions || !Array.isArray(deductions)) {
      res.status(400).json({ success: false, error: '无效的扣减数据' });
      return;
    }

    for (const ded of deductions) {
      const ingredient = store.getIngredientById(ded.ingredientId);
      if (!ingredient) {
        res.status(404).json({ success: false, error: `原料不存在: ${ded.ingredientId}` });
        return;
      }
      if (ingredient.stock < ded.amount) {
        res.status(400).json({ success: false, error: `${ingredient.name} 库存不足` });
        return;
      }
    }

    for (const ded of deductions) {
      store.deductStock(ded.ingredientId, ded.amount);
    }

    res.json({ success: true, data: null });
  } catch (error) {
    res.status(500).json({ success: false, error: '扣减库存失败' });
  }
});

export default router;
