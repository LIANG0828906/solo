import { Router } from 'express';

const router = Router();

interface InventoryRecord {
  id: string;
  materialId: string;
  type: 'in' | 'out';
  quantity: number;
  date: string;
  note?: string;
}

interface DailyStock {
  date: string;
  stock: number;
}

const inventoryRecords: InventoryRecord[] = [];

function generateMockRecords(materialId: string, initialStock: number): InventoryRecord[] {
  const records: InventoryRecord[] = [];
  let currentStock = initialStock;
  const today = new Date();

  records.push({
    id: `${materialId}-init`,
    materialId,
    type: 'in',
    quantity: initialStock + 10,
    date: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    note: '初始库存',
  });

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const random = Math.random();
    
    if (random < 0.4) {
      const outQty = Math.floor(Math.random() * 3) + 1;
      if (currentStock > outQty) {
        records.push({
          id: `${materialId}-out-${i}`,
          materialId,
          type: 'out',
          quantity: outQty,
          date: date.toISOString().split('T')[0],
        });
        currentStock -= outQty;
      }
    }
    
    if (random > 0.85) {
      const inQty = Math.floor(Math.random() * 5) + 2;
      records.push({
        id: `${materialId}-in-${i}`,
        materialId,
        type: 'in',
        quantity: inQty,
        date: date.toISOString().split('T')[0],
        note: '补货',
      });
      currentStock += inQty;
    }
  }

  return records;
}

const materialStocks: Record<string, number> = {
  '1': 5, '2': 3, '3': 8, '4': 4, '5': 2, '6': 6,
  '7': 3, '8': 2, '9': 4, '10': 2, '11': 5, '12': 3,
};

Object.entries(materialStocks).forEach(([id, stock]) => {
  const records = generateMockRecords(id, stock);
  inventoryRecords.push(...records);
});

router.get('/:materialId', (req, res) => {
  const { materialId } = req.params;
  const records = inventoryRecords
    .filter(r => r.materialId === materialId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 30);
  
  res.json(records);
});

router.get('/:materialId/trend', (req, res) => {
  const { materialId } = req.params;
  const records = inventoryRecords
    .filter(r => r.materialId === materialId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const today = new Date();
  const dailyStocks: DailyStock[] = [];
  let currentStock = 0;

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayRecords = records.filter(r => r.date === dateStr);
    dayRecords.forEach(r => {
      if (r.type === 'in') currentStock += r.quantity;
      else currentStock -= r.quantity;
    });

    dailyStocks.push({
      date: dateStr,
      stock: Math.max(0, currentStock),
    });
  }

  res.json(dailyStocks);
});

router.post('/', (req, res) => {
  const newRecord: InventoryRecord = {
    ...req.body,
    id: Date.now().toString(),
    date: new Date().toISOString().split('T')[0],
  };
  inventoryRecords.push(newRecord);
  res.status(201).json(newRecord);
});

export default router;
