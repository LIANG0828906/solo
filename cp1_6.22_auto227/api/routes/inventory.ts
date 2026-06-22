import { Router, type Request, type Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import store from '../data/store.js';
import type { InventoryItem, Unit } from '../data/store.js';

const router = Router();

router.get('/', (req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    data: store.inventory,
  });
});

router.post('/', (req: Request, res: Response): void => {
  const { name, quantity, unit, expirationDate } = req.body as Partial<InventoryItem>;

  if (!name || quantity === undefined || !unit) {
    res.status(400).json({
      success: false,
      error: '缺少必要字段: name, quantity, unit',
    });
    return;
  }

  const validUnits: Unit[] = ['g', 'ml', 'piece'];
  if (!validUnits.includes(unit)) {
    res.status(400).json({
      success: false,
      error: 'unit 必须是 g, ml 或 piece',
    });
    return;
  }

  const newItem: InventoryItem = {
    id: uuidv4(),
    name,
    quantity,
    unit,
    expirationDate: expirationDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  };

  store.inventory.push(newItem);

  res.status(201).json({
    success: true,
    data: newItem,
  });
});

router.delete('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const index = store.inventory.findIndex((item) => item.id === id);

  if (index === -1) {
    res.status(404).json({
      success: false,
      error: '库存项不存在',
    });
    return;
  }

  const deleted = store.inventory.splice(index, 1)[0];

  res.status(200).json({
    success: true,
    data: deleted,
  });
});

export default router;
