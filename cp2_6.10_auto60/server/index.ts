import express from 'express';
import cors from 'cors';
import type { RecipeTemplate, Order, MoldPattern, InkGrade } from '../src/types';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const recipes: RecipeTemplate[] = [
  {
    id: 'recipe1',
    name: '松烟墨基础配方',
    glueRatio: 1,
    waterRatio: 0.5,
    optimalTemp: 90,
    targetHardness: 3
  },
  {
    id: 'recipe2',
    name: '上品墨精细配方',
    glueRatio: 1.2,
    waterRatio: 0.3,
    optimalTemp: 95,
    targetHardness: 4
  },
  {
    id: 'recipe3',
    name: '贡墨御制配方',
    glueRatio: 1.5,
    waterRatio: 0.2,
    optimalTemp: 100,
    targetHardness: 5
  }
];

const orders: Order[] = [
  {
    id: 'order1',
    pattern: 'dragon' as MoldPattern,
    requiredGrade: 'superior' as InkGrade,
    quantity: 3,
    reward: 9,
    fulfilled: 0
  },
  {
    id: 'order2',
    pattern: 'longevity' as MoldPattern,
    requiredGrade: 'common' as InkGrade,
    quantity: 5,
    reward: 10,
    fulfilled: 0
  },
  {
    id: 'order3',
    pattern: 'phoenix' as MoldPattern,
    requiredGrade: 'superior' as InkGrade,
    quantity: 2,
    reward: 6,
    fulfilled: 0
  },
  {
    id: 'order4',
    pattern: 'fiveFu' as MoldPattern,
    requiredGrade: 'common' as InkGrade,
    quantity: 4,
    reward: 8,
    fulfilled: 0
  }
];

const processes = [
  { id: 'smoke', name: '松烟和胶', description: '将松烟与皮胶在铁锅中加热混合' },
  { id: 'pounding', name: '捶打揉捏', description: '反复捶打墨团以增加韧性和密度' },
  { id: 'molding', name: '墨模压印', description: '将墨团放入模具中压制成型' },
  { id: 'drying', name: '阴干晾置', description: '墨锭在阴凉处自然阴干14天' },
  { id: 'gilding', name: '描金装饰', description: '为墨锭图案描绘金粉增加价值' }
];

app.get('/api/recipes', (_req, res) => {
  res.json(recipes);
});

app.get('/api/recipes/:id', (req, res) => {
  const recipe = recipes.find(r => r.id === req.params.id);
  if (recipe) {
    res.json(recipe);
  } else {
    res.status(404).json({ error: '配方不存在' });
  }
});

app.get('/api/processes', (_req, res) => {
  res.json(processes);
});

app.get('/api/orders', (_req, res) => {
  res.json(orders);
});

app.get('/api/orders/:id', (req, res) => {
  const order = orders.find(o => o.id === req.params.id);
  if (order) {
    res.json(order);
  } else {
    res.status(404).json({ error: '订单不存在' });
  }
});

app.post('/api/orders/:id/fulfill', (req, res) => {
  const { batchIds } = req.body;
  const order = orders.find(o => o.id === req.params.id);
  
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }
  
  if (!Array.isArray(batchIds)) {
    return res.status(400).json({ error: '无效的批次ID' });
  }
  
  if (order.fulfilled + batchIds.length > order.quantity) {
    return res.status(400).json({ error: '超出订单数量' });
  }
  
  order.fulfilled += batchIds.length;
  
  res.json({ 
    success: true, 
    order,
    reward: order.reward * (batchIds.length / order.quantity)
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.listen(PORT, () => {
  console.log(`徽州墨坊服务器运行在 http://localhost:${PORT}`);
  console.log(`API 端点:`);
  console.log(`  GET /api/recipes - 获取配方列表`);
  console.log(`  GET /api/recipes/:id - 获取单个配方`);
  console.log(`  GET /api/processes - 获取工序列表`);
  console.log(`  GET /api/orders - 获取订单列表`);
  console.log(`  GET /api/orders/:id - 获取单个订单`);
  console.log(`  POST /api/orders/:id/fulfill - 完成订单`);
});
