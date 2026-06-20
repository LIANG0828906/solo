const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

const DATA_DIR = path.join(__dirname, 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const SALES_FILE = path.join(DATA_DIR, 'sales.json');
const DELETED_SALES_FILE = path.join(DATA_DIR, 'deleted-sales.json');

app.use(cors());
app.use(express.json());

function readJSON(filePath) {
  try {
    if (!fs.existsSync(filePath)) return [];
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    return [];
  }
}

function writeJSON(filePath, data) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function isLowStock(product) {
  return product.stock <= product.alertThreshold;
}

app.get('/api/products', (req, res) => {
  const products = readJSON(PRODUCTS_FILE);
  const { category, search } = req.query;
  let filtered = products;
  if (category && category !== '全部') {
    filtered = filtered.filter(p => p.category === category);
  }
  if (search) {
    const s = String(search).toLowerCase();
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(s) ||
      p.barcode.includes(s) ||
      p.supplier.toLowerCase().includes(s)
    );
  }
  res.json(filtered);
});

app.get('/api/products/alerts', (req, res) => {
  const products = readJSON(PRODUCTS_FILE);
  const alerts = products.filter(isLowStock);
  res.json(alerts);
});

app.get('/api/products/:id', (req, res) => {
  const products = readJSON(PRODUCTS_FILE);
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: '商品不存在' });
  res.json(product);
});

app.post('/api/products', (req, res) => {
  const products = readJSON(PRODUCTS_FILE);
  const { name, barcode, category, costPrice, sellingPrice, stock, supplier, alertThreshold } = req.body;
  if (!name || !barcode || !category) {
    return res.status(400).json({ error: '名称、条码、类别为必填项' });
  }
  if (products.some(p => p.barcode === barcode)) {
    return res.status(400).json({ error: '条码已存在' });
  }
  const now = new Date().toISOString();
  const newProduct = {
    id: uuidv4(),
    name,
    barcode,
    category,
    costPrice: Number(costPrice) || 0,
    sellingPrice: Number(sellingPrice) || 0,
    stock: Number(stock) || 0,
    supplier: supplier || '',
    alertThreshold: Number(alertThreshold) || 10,
    createdAt: now,
    updatedAt: now
  };
  products.push(newProduct);
  writeJSON(PRODUCTS_FILE, products);
  res.status(201).json(newProduct);
});

app.put('/api/products/:id', (req, res) => {
  const products = readJSON(PRODUCTS_FILE);
  const idx = products.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: '商品不存在' });
  const { barcode } = req.body;
  if (barcode && products.some((p, i) => i !== idx && p.barcode === barcode)) {
    return res.status(400).json({ error: '条码已被其他商品使用' });
  }
  const updated = {
    ...products[idx],
    ...req.body,
    costPrice: Number(req.body.costPrice) || products[idx].costPrice,
    sellingPrice: Number(req.body.sellingPrice) || products[idx].sellingPrice,
    stock: Number(req.body.stock) !== undefined ? Number(req.body.stock) : products[idx].stock,
    alertThreshold: Number(req.body.alertThreshold) || products[idx].alertThreshold,
    updatedAt: new Date().toISOString()
  };
  products[idx] = updated;
  writeJSON(PRODUCTS_FILE, products);
  res.json(updated);
});

app.delete('/api/products/:id', (req, res) => {
  const products = readJSON(PRODUCTS_FILE);
  const filtered = products.filter(p => p.id !== req.params.id);
  if (filtered.length === products.length) {
    return res.status(404).json({ error: '商品不存在' });
  }
  writeJSON(PRODUCTS_FILE, filtered);
  res.json({ success: true });
});

app.get('/api/sales', (req, res) => {
  const sales = readJSON(SALES_FILE);
  const products = readJSON(PRODUCTS_FILE);
  const { date, category } = req.query;
  let filtered = sales.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 30);
  if (date) {
    const d = new Date(String(date)).toDateString();
    filtered = filtered.filter(s => new Date(s.createdAt).toDateString() === d);
  }
  if (category && category !== '全部') {
    filtered = filtered.filter(s =>
      s.items.some(item => {
        const prod = products.find(p => p.id === item.productId);
        return prod && prod.category === category;
      })
    );
  }
  res.json(filtered);
});

app.post('/api/sales', (req, res) => {
  const { items } = req.body;
  if (!items || !items.length) {
    return res.status(400).json({ error: '购物车为空' });
  }
  const products = readJSON(PRODUCTS_FILE);
  const sales = readJSON(SALES_FILE);
  const saleItems = [];
  let totalAmount = 0;

  for (const it of items) {
    const prod = products.find(p => p.id === it.productId);
    if (!prod) return res.status(400).json({ error: `商品不存在: ${it.productId}` });
    if (prod.stock < it.quantity) {
      return res.status(400).json({ error: `${prod.name} 库存不足，当前库存: ${prod.stock}` });
    }
    const unitPrice = prod.sellingPrice;
    const subtotal = unitPrice * it.quantity;
    saleItems.push({
      productId: prod.id,
      productName: prod.name,
      quantity: it.quantity,
      unitPrice,
      subtotal
    });
    totalAmount += subtotal;
  }

  const productMap = new Map(products.map(p => [p.id, p]));
  for (const it of items) {
    const prod = productMap.get(it.productId);
    prod.stock -= it.quantity;
    prod.updatedAt = new Date().toISOString();
  }

  const newSale = {
    id: uuidv4(),
    items: saleItems,
    totalAmount: Math.round(totalAmount * 100) / 100,
    createdAt: new Date().toISOString()
  };

  sales.unshift(newSale);
  writeJSON(PRODUCTS_FILE, products);
  writeJSON(SALES_FILE, sales);
  res.status(201).json(newSale);
});

app.delete('/api/sales/:id', (req, res) => {
  const sales = readJSON(SALES_FILE);
  const deletedSales = readJSON(DELETED_SALES_FILE);
  const products = readJSON(PRODUCTS_FILE);
  const idx = sales.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: '销售记录不存在' });

  const [deleted] = sales.splice(idx, 1);
  deleted.deletedAt = new Date().toISOString();
  deletedSales.push(deleted);

  const productMap = new Map(products.map(p => [p.id, p]));
  for (const item of deleted.items) {
    const prod = productMap.get(item.productId);
    if (prod) {
      prod.stock += item.quantity;
      prod.updatedAt = new Date().toISOString();
    }
  }

  writeJSON(SALES_FILE, sales);
  writeJSON(DELETED_SALES_FILE, deletedSales);
  writeJSON(PRODUCTS_FILE, products);

  res.json({ success: true, deleted });
});

app.put('/api/sales/:id/undo', (req, res) => {
  const sales = readJSON(SALES_FILE);
  const deletedSales = readJSON(DELETED_SALES_FILE);
  const products = readJSON(PRODUCTS_FILE);
  const deletedIdx = deletedSales.findIndex(s => s.id === req.params.id);
  if (deletedIdx === -1) return res.status(404).json({ error: '可撤销的记录不存在' });

  const fiveSecondsAgo = Date.now() - 5000;
  if (new Date(deletedSales[deletedIdx].deletedAt).getTime() < fiveSecondsAgo) {
    return res.status(400).json({ error: '撤销窗口已关闭（超过5秒）' });
  }

  const [restored] = deletedSales.splice(deletedIdx, 1);
  delete restored.deletedAt;
  sales.unshift(restored);

  const productMap = new Map(products.map(p => [p.id, p]));
  for (const item of restored.items) {
    const prod = productMap.get(item.productId);
    if (prod) {
      prod.stock -= item.quantity;
      prod.updatedAt = new Date().toISOString();
    }
  }

  writeJSON(SALES_FILE, sales);
  writeJSON(DELETED_SALES_FILE, deletedSales);
  writeJSON(PRODUCTS_FILE, products);

  res.json(restored);
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
