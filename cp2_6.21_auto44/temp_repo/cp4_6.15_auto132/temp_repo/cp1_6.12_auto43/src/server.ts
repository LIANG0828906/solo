import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { differenceInDays, isPast, isToday, formatISO } from 'date-fns';
import type {
  InventoryItem,
  AddItemRequest,
  UpdateItemRequest,
  StockReport,
  ReportItem,
} from './types';

const app = express();
const PORT = 3001;

app.use(express.json());

const items = new Map<string, InventoryItem>();

function generateMockData(): void {
  const mockItems: Omit<InventoryItem, 'id' | 'createdAt'>[] = [
    { name: '牛奶', quantity: 50, initialQuantity: 50, expireDate: addDays(3), category: 'food' },
    { name: '面包', quantity: 30, initialQuantity: 30, expireDate: addDays(2), category: 'food' },
    { name: '鸡蛋', quantity: 100, initialQuantity: 100, expireDate: addDays(10), category: 'food' },
    { name: '苹果', quantity: 80, initialQuantity: 80, expireDate: addDays(5), category: 'food' },
    { name: '方便面', quantity: 200, initialQuantity: 200, expireDate: addDays(180), category: 'food' },
    { name: '薯片', quantity: 15, initialQuantity: 60, expireDate: addDays(30), category: 'food' },
    { name: '饼干', quantity: 40, initialQuantity: 80, expireDate: addDays(60), category: 'food' },
    { name: '酸奶', quantity: 25, initialQuantity: 40, expireDate: addDays(4), category: 'food' },
    { name: '牙膏', quantity: 60, initialQuantity: 60, expireDate: addDays(365), category: 'daily' },
    { name: '洗发水', quantity: 30, initialQuantity: 30, expireDate: addDays(300), category: 'daily' },
    { name: '肥皂', quantity: 10, initialQuantity: 50, expireDate: addDays(200), category: 'daily' },
    { name: '纸巾', quantity: 5, initialQuantity: 40, expireDate: addDays(365), category: 'daily' },
    { name: '洗洁精', quantity: 25, initialQuantity: 30, expireDate: addDays(250), category: 'daily' },
    { name: '垃圾袋', quantity: 12, initialQuantity: 50, expireDate: addDays(365), category: 'daily' },
    { name: '速冻饺子', quantity: 20, initialQuantity: 40, expireDate: addDays(90), category: 'food' },
  ];

  mockItems.forEach((item) => {
    const id = uuidv4();
    items.set(id, {
      ...item,
      id,
      createdAt: formatISO(new Date()),
    });
  });
}

function addDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatISO(date, { representation: 'date' });
}

generateMockData();

app.get('/api/items', (_req, res) => {
  const itemsList = Array.from(items.values());
  res.json(itemsList);
});

app.post('/api/items', (req, res) => {
  const { name, quantity, expireDate, category } = req.body as AddItemRequest;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: '商品名称不能为空' });
  }

  if (!quantity || !Number.isInteger(quantity) || quantity <= 0) {
    return res.status(400).json({ error: '库存数量必须为正整数' });
  }

  if (!expireDate) {
    return res.status(400).json({ error: '过期日期不能为空' });
  }

  if (!category || !['food', 'daily'].includes(category)) {
    return res.status(400).json({ error: '分类无效' });
  }

  const id = uuidv4();
  const newItem: InventoryItem = {
    id,
    name: name.trim(),
    quantity,
    initialQuantity: quantity,
    expireDate,
    category,
    createdAt: formatISO(new Date()),
  };

  items.set(id, newItem);
  res.status(201).json(newItem);
});

app.put('/api/items/:id', (req, res) => {
  const { id } = req.params;
  const item = items.get(id);

  if (!item) {
    return res.status(404).json({ error: '商品不存在' });
  }

  const updates = req.body as UpdateItemRequest;

  if (updates.quantity !== undefined) {
    if (!Number.isInteger(updates.quantity) || updates.quantity < 0) {
      return res.status(400).json({ error: '库存数量必须为非负整数' });
    }
  }

  const updatedItem: InventoryItem = {
    ...item,
    ...updates,
  };

  items.set(id, updatedItem);
  res.json(updatedItem);
});

app.delete('/api/items/:id', (req, res) => {
  const { id } = req.params;
  const deleted = items.delete(id);

  if (!deleted) {
    return res.status(404).json({ error: '商品不存在' });
  }

  res.json({ success: true });
});

app.get('/api/report', (_req, res) => {
  const reportItems: ReportItem[] = [];
  const today = new Date();

  items.forEach((item) => {
    const expireDateObj = new Date(item.expireDate);
    const daysUntilExpire = differenceInDays(expireDateObj, today);
    const isExpired = isPast(expireDateObj) && !isToday(expireDateObj);
    const stockRatio = item.quantity / item.initialQuantity;

    const reasons: string[] = [];

    if (stockRatio < 0.2 && item.initialQuantity > 0) {
      reasons.push('库存不足20%');
    }

    if (daysUntilExpire < 14 && !isExpired) {
      reasons.push('即将过期（小于14天）');
    }

    if (isExpired) {
      reasons.push('已过期，需要补货');
    }

    if (reasons.length > 0) {
      const suggestedStock = Math.max(
        item.initialQuantity - item.quantity,
        Math.floor(item.initialQuantity * 0.5)
      );

      reportItems.push({
        id: item.id,
        name: item.name,
        currentStock: item.quantity,
        suggestedStock: suggestedStock,
        reason: reasons.join('；'),
      });
    }
  });

  const report: StockReport = {
    items: reportItems,
    generatedAt: formatISO(new Date()),
    totalSuggestedQuantity: reportItems.reduce((sum, item) => sum + item.suggestedStock, 0),
  };

  res.json(report);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
