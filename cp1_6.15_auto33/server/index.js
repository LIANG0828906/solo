import express from 'express';
import cors from 'cors';
import { getFlowers, validateBouquetStock, createOrder, getOrderById } from './data.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/flowers', (req, res) => {
  try {
    const { category, minPrice, maxPrice } = req.query;
    const result = getFlowers({ category, minPrice, maxPrice });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/bouquet/validate', (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ success: false, error: '请求体必须包含items数组' });
    }
    const result = validateBouquetStock(items);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/orders', (req, res) => {
  try {
    const { bouquet, deliveryInfo } = req.body;
    if (!bouquet || !deliveryInfo) {
      return res.status(400).json({ success: false, error: '请求体必须包含bouquet和deliveryInfo' });
    }
    const order = createOrder(bouquet, deliveryInfo);
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/api/orders/:id', (req, res) => {
  try {
    const order = getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: '订单不存在' });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🌸 花店服务器运行在 http://localhost:${PORT}`);
});
