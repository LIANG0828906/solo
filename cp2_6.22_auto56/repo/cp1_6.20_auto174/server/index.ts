import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json());

function readData() {
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(raw);
}

function writeData(data: any) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

app.get('/api/server-time', (_req, res) => {
  res.json({ time: new Date().toISOString() });
});

app.get('/api/products', (_req, res) => {
  const data = readData();
  const products = data.products.sort(
    (a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  res.json(products);
});

app.post('/api/products', (req, res) => {
  const data = readData();
  const product = {
    id: uuidv4(),
    name: req.body.name,
    description: req.body.description,
    category: req.body.category,
    imageUrl: req.body.imageUrl,
    costPrice: req.body.costPrice,
    stock: req.body.stock,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  data.products.push(product);
  writeData(data);
  res.status(201).json(product);
});

app.put('/api/products/:id', (req, res) => {
  const data = readData();
  const index = data.products.findIndex((p: any) => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Product not found' });
  data.products[index] = {
    ...data.products[index],
    ...req.body,
    id: data.products[index].id,
    createdAt: data.products[index].createdAt,
    updatedAt: new Date().toISOString()
  };
  writeData(data);
  res.json(data.products[index]);
});

app.delete('/api/products/:id', (req, res) => {
  const data = readData();
  data.products = data.products.filter((p: any) => p.id !== req.params.id);
  data.pricingRules = data.pricingRules.filter((r: any) => r.productId !== req.params.id);
  data.sales = (data.sales || []).filter((s: any) => s.productId !== req.params.id);
  writeData(data);
  res.status(204).end();
});

app.get('/api/products/:id/pricing-rules', (req, res) => {
  const data = readData();
  const rules = (data.pricingRules || [])
    .filter((r: any) => r.productId === req.params.id)
    .sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  res.json(rules);
});

app.post('/api/products/:id/pricing-rules', (req, res) => {
  const data = readData();
  if (!data.pricingRules) data.pricingRules = [];
  const rule = {
    id: uuidv4(),
    productId: req.params.id,
    type: req.body.type,
    price: req.body.price,
    startTime: req.body.startTime,
    endTime: req.body.endTime,
    createdAt: new Date().toISOString()
  };
  data.pricingRules.push(rule);
  writeData(data);
  res.status(201).json(rule);
});

app.put('/api/pricing-rules/:id', (req, res) => {
  const data = readData();
  const index = data.pricingRules.findIndex((r: any) => r.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Rule not found' });
  data.pricingRules[index] = { ...data.pricingRules[index], ...req.body, id: data.pricingRules[index].id, productId: data.pricingRules[index].productId, createdAt: data.pricingRules[index].createdAt };
  writeData(data);
  res.json(data.pricingRules[index]);
});

app.delete('/api/pricing-rules/:id', (req, res) => {
  const data = readData();
  data.pricingRules = (data.pricingRules || []).filter((r: any) => r.id !== req.params.id);
  writeData(data);
  res.status(204).end();
});

app.get('/api/sales', (req, res) => {
  const data = readData();
  const { productId } = req.query;
  let sales = data.sales || [];

  if (productId && productId !== 'all') {
    sales = sales.filter((s: any) => s.productId === productId);
  }

  const grouped: Record<string, number> = {};
  sales.forEach((s: any) => {
    grouped[s.date] = (grouped[s.date] || 0) + s.quantity;
  });

  const result = Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, quantity]) => ({ date, quantity }));

  res.json(result);
});

app.post('/api/sales/generate', (_req, res) => {
  const data = readData();
  const sales: any[] = [];
  const products = data.products || [];
  const now = new Date();

  for (let d = 29; d >= 0; d--) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    const dateStr = date.toISOString().split('T')[0];

    products.forEach((p: any) => {
      if (Math.random() > 0.3) {
        sales.push({
          date: dateStr,
          productId: p.id,
          quantity: Math.floor(Math.random() * 8) + 1
        });
      }
    });
  }

  data.sales = sales;
  writeData(data);
  res.json({ generated: sales.length });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
