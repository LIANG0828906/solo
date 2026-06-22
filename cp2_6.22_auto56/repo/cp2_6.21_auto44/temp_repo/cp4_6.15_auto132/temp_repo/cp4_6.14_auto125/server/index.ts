import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

interface Ingredient {
  id: string;
  name: string;
  amount: number;
}

interface Recipe {
  id: string;
  name: string;
  yieldCount: number;
  ingredients: Ingredient[];
  price: number;
}

interface OrderItem {
  recipeId: string;
  recipeName: string;
  quantity: number;
}

interface Order {
  id: string;
  customerName: string;
  items: OrderItem[];
  status: 'pending' | 'completed';
  createdAt: string;
  totalAmount: number;
}

interface Stock {
  id: string;
  name: string;
  currentStock: number;
  safetyLevel: number;
  costPerGram: number;
}

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const recipes = new Map<string, Recipe>();
const orders = new Map<string, Order>();
const stocks = new Map<string, Stock>();

const initialStocks: Stock[] = [
  { id: uuidv4(), name: '高筋面粉', currentStock: 5000, safetyLevel: 2000, costPerGram: 0.008 },
  { id: uuidv4(), name: '低筋面粉', currentStock: 3000, safetyLevel: 1500, costPerGram: 0.009 },
  { id: uuidv4(), name: '黄油', currentStock: 1500, safetyLevel: 1000, costPerGram: 0.05 },
  { id: uuidv4(), name: '白砂糖', currentStock: 800, safetyLevel: 1000, costPerGram: 0.006 },
  { id: uuidv4(), name: '鸡蛋', currentStock: 500, safetyLevel: 800, costPerGram: 0.02 },
  { id: uuidv4(), name: '牛奶', currentStock: 2000, safetyLevel: 1500, costPerGram: 0.012 },
  { id: uuidv4(), name: '淡奶油', currentStock: 600, safetyLevel: 1000, costPerGram: 0.04 },
  { id: uuidv4(), name: '可可粉', currentStock: 300, safetyLevel: 500, costPerGram: 0.08 },
];

initialStocks.forEach((s) => stocks.set(s.id, s));

const initialRecipes: Recipe[] = [
  {
    id: uuidv4(),
    name: '经典黄油曲奇',
    yieldCount: 20,
    price: 68,
    ingredients: [
      { id: uuidv4(), name: '低筋面粉', amount: 200 },
      { id: uuidv4(), name: '黄油', amount: 130 },
      { id: uuidv4(), name: '白砂糖', amount: 80 },
      { id: uuidv4(), name: '鸡蛋', amount: 30 },
    ],
  },
  {
    id: uuidv4(),
    name: '巧克力蛋糕',
    yieldCount: 8,
    price: 128,
    ingredients: [
      { id: uuidv4(), name: '低筋面粉', amount: 100 },
      { id: uuidv4(), name: '可可粉', amount: 30 },
      { id: uuidv4(), name: '黄油', amount: 80 },
      { id: uuidv4(), name: '白砂糖', amount: 100 },
      { id: uuidv4(), name: '鸡蛋', amount: 150 },
      { id: uuidv4(), name: '牛奶', amount: 60 },
    ],
  },
  {
    id: uuidv4(),
    name: '奶油吐司',
    yieldCount: 1,
    price: 38,
    ingredients: [
      { id: uuidv4(), name: '高筋面粉', amount: 250 },
      { id: uuidv4(), name: '黄油', amount: 30 },
      { id: uuidv4(), name: '白砂糖', amount: 40 },
      { id: uuidv4(), name: '鸡蛋', amount: 50 },
      { id: uuidv4(), name: '牛奶', amount: 120 },
    ],
  },
];

initialRecipes.forEach((r) => recipes.set(r.id, r));

const initialOrders: Order[] = [
  {
    id: uuidv4(),
    customerName: '王女士',
    status: 'pending',
    createdAt: new Date().toISOString(),
    items: [
      { recipeId: initialRecipes[0].id, recipeName: initialRecipes[0].name, quantity: 2 },
    ],
    totalAmount: 136,
  },
  {
    id: uuidv4(),
    customerName: '李先生',
    status: 'completed',
    createdAt: new Date().toISOString(),
    items: [
      { recipeId: initialRecipes[1].id, recipeName: initialRecipes[1].name, quantity: 1 },
      { recipeId: initialRecipes[2].id, recipeName: initialRecipes[2].name, quantity: 3 },
    ],
    totalAmount: 242,
  },
];

initialOrders.forEach((o) => orders.set(o.id, o));

function calculateIngredients(items: OrderItem[]): Map<string, number> {
  const totals = new Map<string, number>();
  items.forEach((item) => {
    const recipe = recipes.get(item.recipeId);
    if (recipe) {
      const multiplier = item.quantity / recipe.yieldCount;
      recipe.ingredients.forEach((ing) => {
        const current = totals.get(ing.name) || 0;
        totals.set(ing.name, current + ing.amount * multiplier);
      });
    }
  });
  return totals;
}

function calculateCost(items: OrderItem[]): number {
  let totalCost = 0;
  items.forEach((item) => {
    const recipe = recipes.get(item.recipeId);
    if (recipe) {
      const multiplier = item.quantity / recipe.yieldCount;
      recipe.ingredients.forEach((ing) => {
        const stock = Array.from(stocks.values()).find((s) => s.name === ing.name);
        if (stock) {
          totalCost += ing.amount * multiplier * stock.costPerGram;
        }
      });
    }
  });
  return Math.round(totalCost * 100) / 100;
}

app.get('/api/recipes', (req, res) => {
  res.json(Array.from(recipes.values()));
});

app.post('/api/recipes', (req, res) => {
  const { name, yieldCount, ingredients, price } = req.body;
  if (!name || !yieldCount || !ingredients) {
    return res.status(400).json({ error: '缺少必要参数' });
  }
  const recipe: Recipe = {
    id: uuidv4(),
    name,
    yieldCount,
    ingredients: ingredients.map((i: Ingredient) => ({ ...i, id: uuidv4() })),
    price: price || 0,
  };
  recipes.set(recipe.id, recipe);
  res.status(201).json(recipe);
});

app.delete('/api/recipes/:id', (req, res) => {
  const deleted = recipes.delete(req.params.id);
  if (!deleted) return res.status(404).json({ error: '配方不存在' });
  res.json({ success: true });
});

app.get('/api/orders', (req, res) => {
  res.json(Array.from(orders.values()));
});

app.post('/api/orders', (req, res) => {
  const { customerName, items } = req.body;
  if (!customerName || !items || items.length === 0) {
    return res.status(400).json({ error: '缺少必要参数' });
  }
  let totalAmount = 0;
  const orderItems: OrderItem[] = items.map((item: { recipeId: string; quantity: number }) => {
    const recipe = recipes.get(item.recipeId);
    if (!recipe) throw new Error('配方不存在');
    totalAmount += recipe.price * item.quantity;
    return {
      recipeId: item.recipeId,
      recipeName: recipe.name,
      quantity: item.quantity,
    };
  });
  const order: Order = {
    id: uuidv4(),
    customerName,
    items: orderItems,
    status: 'pending',
    createdAt: new Date().toISOString(),
    totalAmount,
  };
  orders.set(order.id, order);
  res.status(201).json(order);
});

app.patch('/api/orders/:id', (req, res) => {
  const order = orders.get(req.params.id);
  if (!order) return res.status(404).json({ error: '订单不存在' });
  const { status } = req.body;
  if (status) order.status = status;
  orders.set(order.id, order);
  res.json(order);
});

app.delete('/api/orders/:id', (req, res) => {
  const deleted = orders.delete(req.params.id);
  if (!deleted) return res.status(404).json({ error: '订单不存在' });
  res.json({ success: true });
});

app.post('/api/orders/calculate', (req, res) => {
  const { items } = req.body;
  if (!items) {
    return res.status(400).json({ error: '缺少必要参数' });
  }
  const ingredientTotals = calculateIngredients(items);
  const totalCost = calculateCost(items);
  res.json({
    ingredients: Object.fromEntries(ingredientTotals),
    totalCost,
  });
});

app.get('/api/stocks', (req, res) => {
  res.json(Array.from(stocks.values()));
});

app.patch('/api/stocks/:id', (req, res) => {
  const stock = stocks.get(req.params.id);
  if (!stock) return res.status(404).json({ error: '原料不存在' });
  const { currentStock, safetyLevel, costPerGram } = req.body;
  if (currentStock !== undefined) stock.currentStock = currentStock;
  if (safetyLevel !== undefined) stock.safetyLevel = safetyLevel;
  if (costPerGram !== undefined) stock.costPerGram = costPerGram;
  stocks.set(stock.id, stock);
  res.json(stock);
});

app.get('/api/reports', (req, res) => {
  const today = new Date().toDateString();
  const todayOrders = Array.from(orders.values()).filter(
    (o) => new Date(o.createdAt).toDateString() === today
  );
  const totalOrders = todayOrders.length;
  const totalRevenue = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  let totalCost = 0;
  todayOrders.forEach((o) => {
    totalCost += calculateCost(o.items);
  });
  totalCost = Math.round(totalCost * 100) / 100;
  const profit = Math.round((totalRevenue - totalCost) * 100) / 100;
  res.json({
    totalOrders,
    totalCost,
    totalRevenue,
    profit,
  });
});

app.listen(PORT, () => {
  console.log(`烘焙工作室后端服务运行在 http://localhost:${PORT}`);
});
