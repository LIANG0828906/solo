const express = require('express');
const cors = require('cors');
const { getFlowers, validateBouquet, createOrder, getOrderById } = require('./data.js');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/flowers', (req, res) => {
  try {
    console.log('GET /api/flowers - 查询参数:', req.query);
    const { category, minPrice, maxPrice } = req.query;
    const flowers = getFlowers({ category, minPrice, maxPrice });
    res.json({ success: true, data: flowers });
  } catch (error) {
    console.log('GET /api/flowers - 错误:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/bouquet/validate', (req, res) => {
  try {
    console.log('POST /api/bouquet/validate - 请求体:', req.body);
    const { items } = req.body;
    
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ success: false, error: '请求体必须包含items数组' });
    }
    
    const result = validateBouquet(items);
    res.json({ success: true, data: result });
  } catch (error) {
    console.log('POST /api/bouquet/validate - 错误:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/orders', (req, res) => {
  try {
    console.log('POST /api/orders - 请求体:', req.body);
    const { bouquet, deliveryInfo } = req.body;
    
    if (!bouquet || !deliveryInfo) {
      return res.status(400).json({ success: false, error: '请求体必须包含bouquet和deliveryInfo' });
    }
    
    const order = createOrder(bouquet, deliveryInfo);
    res.json({ success: true, data: order });
  } catch (error) {
    console.log('POST /api/orders - 错误:', error.message);
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/api/orders/:id', (req, res) => {
  try {
    console.log('GET /api/orders/:id - 订单ID:', req.params.id);
    const { id } = req.params;
    const order = getOrderById(id);
    
    if (!order) {
      return res.status(404).json({ success: false, error: '订单不存在' });
    }
    
    res.json({ success: true, data: order });
  } catch (error) {
    console.log('GET /api/orders/:id - 错误:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
