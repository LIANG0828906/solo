import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import {
  products,
  Product,
  RestockSuggestion,
  calculateRestockSuggestion,
  getStockStatus,
} from './data';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/products', (req, res) => {
  setTimeout(() => {
    res.json(
      products.map((p) => ({
        ...p,
        status: getStockStatus(p.stock, p.threshold),
      }))
    );
  }, 100);
});

app.get('/api/products/:id', (req, res) => {
  const product = products.find((p) => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ error: '商品不存在' });
  }
  setTimeout(() => {
    res.json({
      ...product,
      status: getStockStatus(product.stock, product.threshold),
    });
  }, 100);
});

app.post('/api/products/:id/threshold', (req, res) => {
  const { threshold } = req.body;
  const productIndex = products.findIndex((p) => p.id === req.params.id);
  if (productIndex === -1) {
    return res.status(404).json({ error: '商品不存在' });
  }
  if (typeof threshold !== 'number' || threshold < 0) {
    return res.status(400).json({ error: '阈值必须是非负数字' });
  }
  products[productIndex].threshold = threshold;
  setTimeout(() => {
    res.json({
      ...products[productIndex],
      status: getStockStatus(products[productIndex].stock, products[productIndex].threshold),
    });
  }, 100);
});

app.post('/api/restock/suggest', (req, res) => {
  const { productIds } = req.body;
  const ids: string[] = Array.isArray(productIds) ? productIds : [productIds];

  setTimeout(() => {
    const suggestions: RestockSuggestion[] = [];
    for (const id of ids) {
      const product = products.find((p) => p.id === id);
      if (product) {
        suggestions.push(calculateRestockSuggestion(product));
      }
    }
    res.json(suggestions);
  }, 300);
});

app.post('/api/orders', (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: '订单不能为空' });
  }

  setTimeout(() => {
    for (const item of items) {
      const productIndex = products.findIndex((p) => p.id === item.productId);
      if (productIndex !== -1) {
        const quantity = item.quantity ?? item.suggestedQuantity ?? 0;
        products[productIndex].stock += quantity;
      }
    }

    const orderId = uuidv4();
    res.json({
      success: true,
      orderId,
      message: '订单提交成功，库存已更新',
    });
  }, 500);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
