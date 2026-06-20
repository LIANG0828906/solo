const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3001;

const PRODUCTS_FILE = path.join(__dirname, 'products.json');
const ORDERS_FILE = path.join(__dirname, 'orders.json');

const CATEGORIES = ['手作饰品', '文创文具', '陶瓷器皿', '布艺编织', '原创插画'];

const SAMPLE_PRODUCTS = [
  { name: '月光石银饰耳环', price: 128, category: '手作饰品', stock: 12, image: 'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=400&q=80' },
  { name: '手绘植物书签套装', price: 36, category: '文创文具', stock: 48, image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80' },
  { name: '粗陶手捏咖啡杯', price: 98, category: '陶瓷器皿', stock: 3, image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&q=80' },
  { name: '亚麻刺绣手拿包', price: 156, category: '布艺编织', stock: 8, image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400&q=80' },
  { name: '城市剪影明信片', price: 22, category: '原创插画', stock: 60, image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&q=80' },
  { name: '珍珠编织手链', price: 88, category: '手作饰品', stock: 2, image: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=400&q=80' },
  { name: '烫金封面手账本', price: 68, category: '文创文具', stock: 25, image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=400&q=80' },
  { name: '青瓷小茶盏', price: 58, category: '陶瓷器皿', stock: 18, image: 'https://images.unsplash.com/photo-1558642084-fd07fae5282e?w=400&q=80' }
];

function readJSON(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, 'utf8');
    if (!raw.trim()) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function initData() {
  if (!fs.existsSync(PRODUCTS_FILE)) {
    const now = Date.now();
    const products = SAMPLE_PRODUCTS.map((p, i) => ({
      id: uuidv4(),
      ...p,
      createdAt: now - i * 1000
    }));
    writeJSON(PRODUCTS_FILE, products);
  }
  if (!fs.existsSync(ORDERS_FILE)) {
    writeJSON(ORDERS_FILE, []);
  }
}

initData();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/products', (_req, res) => {
  const products = readJSON(PRODUCTS_FILE, []);
  res.json(products);
});

app.post('/api/products', (req, res) => {
  const { name, price, category, stock, image } = req.body || {};
  if (!name || typeof price !== 'number' || !category || typeof stock !== 'number') {
    return res.status(400).json({ error: '缺少必填字段' });
  }
  if (!CATEGORIES.includes(category)) {
    return res.status(400).json({ error: '无效分类' });
  }
  const products = readJSON(PRODUCTS_FILE, []);
  const newProduct = {
    id: uuidv4(),
    name,
    price,
    category,
    stock,
    image: image || '',
    createdAt: Date.now()
  };
  products.unshift(newProduct);
  writeJSON(PRODUCTS_FILE, products);
  res.status(201).json(newProduct);
});

app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const products = readJSON(PRODUCTS_FILE, []);
  const idx = products.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: '商品不存在' });
  const { category } = req.body;
  if (category && !CATEGORIES.includes(category)) {
    return res.status(400).json({ error: '无效分类' });
  }
  products[idx] = { ...products[idx], ...req.body, id: products[idx].id, createdAt: products[idx].createdAt };
  writeJSON(PRODUCTS_FILE, products);
  res.json(products[idx]);
});

app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const products = readJSON(PRODUCTS_FILE, []);
  const idx = products.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: '商品不存在' });
  products.splice(idx, 1);
  writeJSON(PRODUCTS_FILE, products);
  res.json({ success: true });
});

app.get('/api/orders', (_req, res) => {
  const orders = readJSON(ORDERS_FILE, []);
  res.json(orders);
});

app.post('/api/orders', (req, res) => {
  const { items } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: '订单商品不能为空' });
  }
  const products = readJSON(PRODUCTS_FILE, []);
  const productsMap = new Map(products.map(p => [p.id, p]));
  let total = 0;
  const orderItems = [];

  for (const it of items) {
    const product = productsMap.get(it.productId);
    if (!product) return res.status(400).json({ error: `商品不存在: ${it.productId}` });
    if (product.stock < it.quantity) {
      return res.status(400).json({ error: `库存不足: ${product.name} (剩余${product.stock})` });
    }
    const unitPrice = it.unitPrice ?? product.price;
    total += unitPrice * it.quantity;
    orderItems.push({
      productId: product.id,
      name: product.name,
      quantity: it.quantity,
      unitPrice
    });
    product.stock -= it.quantity;
  }

  const newOrder = {
    id: uuidv4(),
    items: orderItems,
    total: Math.round(total * 100) / 100,
    createdAt: Date.now()
  };

  const orders = readJSON(ORDERS_FILE, []);
  orders.unshift(newOrder);
  writeJSON(PRODUCTS_FILE, products);
  writeJSON(ORDERS_FILE, orders);
  res.status(201).json(newOrder);
});

app.get('/api/categories', (_req, res) => {
  res.json(CATEGORIES);
});

app.listen(PORT, () => {
  console.log(`[server] 创意市集摊主助手后端运行在 http://localhost:${PORT}`);
});
