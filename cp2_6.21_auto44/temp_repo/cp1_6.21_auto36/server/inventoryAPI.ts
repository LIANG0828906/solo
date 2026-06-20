import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { inventory, recipes } from './store';
import { InventoryItem } from '../src/types';

const router = express.Router();

router.get('/', (_req, res) => {
  res.json(inventory);
});

router.get('/:id', (req, res) => {
  const item = inventory.find(i => i.id === req.params.id);
  if (!item) return res.status(404).json({ error: '食材不存在' });
  res.json(item);
});

router.post('/', (req, res) => {
  const body = req.body as Partial<InventoryItem>;
  const newItem: InventoryItem = {
    id: uuidv4(),
    name: body.name || '新食材',
    quantity: body.quantity ?? 0,
    unit: body.unit || '个',
    purchaseDate: body.purchaseDate || new Date().toISOString().split('T')[0],
    expiryDate: body.expiryDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    category: body.category || '其他',
  };
  inventory.push(newItem);
  res.status(201).json(newItem);
});

router.put('/:id', (req, res) => {
  const idx = inventory.findIndex(i => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: '食材不存在' });
  inventory[idx] = { ...inventory[idx], ...req.body };
  res.json(inventory[idx]);
});

router.delete('/:id', (req, res) => {
  const idx = inventory.findIndex(i => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: '食材不存在' });
  inventory.splice(idx, 1);
  res.json({ message: '删除成功' });
});

router.get('/recommend/recipes', (_req, res) => {
  const result = recipes.map(recipe => {
    let missingCount = 0;
    const ingredientStatus: { name: string; required: number; unit: string; available: number; enough: boolean }[] = [];

    for (const ri of recipe.ingredients) {
      const inv = inventory.find(i => i.name === ri.name);
      const available = inv ? inv.quantity : 0;
      const enough = available >= ri.quantity;
      if (!enough) missingCount++;
      ingredientStatus.push({
        name: ri.name,
        required: ri.quantity,
        unit: ri.unit,
        available,
        enough,
      });
    }

    return {
      recipe,
      canMake: missingCount === 0,
      missingCount,
      ingredientStatus,
    };
  });

  result.sort((a, b) => {
    if (a.canMake !== b.canMake) return a.canMake ? -1 : 1;
    return a.missingCount - b.missingCount;
  });

  res.json(result);
});

router.post('/consume/recipe/:recipeId', (req, res) => {
  const recipe = recipes.find(r => r.id === req.params.recipeId);
  if (!recipe) return res.status(404).json({ error: '食谱不存在' });

  const consumed: { name: string; quantity: number; unit: string }[] = [];
  const insufficient: { name: string; required: number; available: number }[] = [];

  for (const ri of recipe.ingredients) {
    const invIdx = inventory.findIndex(i => i.name === ri.name);
    if (invIdx === -1 || inventory[invIdx].quantity < ri.quantity) {
      insufficient.push({
        name: ri.name,
        required: ri.quantity,
        available: invIdx === -1 ? 0 : inventory[invIdx].quantity,
      });
    }
  }

  if (insufficient.length > 0) {
    return res.status(400).json({ error: '部分食材库存不足', insufficient });
  }

  for (const ri of recipe.ingredients) {
    const invIdx = inventory.findIndex(i => i.name === ri.name);
    if (invIdx !== -1) {
      inventory[invIdx].quantity -= ri.quantity;
      consumed.push({ name: ri.name, quantity: ri.quantity, unit: ri.unit });
      if (inventory[invIdx].quantity <= 0) {
        inventory.splice(invIdx, 1);
      }
    }
  }

  res.json({ message: '食材扣除成功', consumed, remainingInventory: inventory });
});

export default router;
