const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

const bidderNames = ['竞拍者A', '竞拍者B', '竞拍者C', '竞拍者D', '竞拍者E', '竞拍者F'];
const bidderColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const products = [
  { id: '1', name: '清代青花瓷瓶', startingPrice: 50000 },
  { id: '2', name: '明代山水画', startingPrice: 80000 },
  { id: '3', name: '和田玉雕件', startingPrice: 30000 },
];

const bids = [];

const now = Date.now();
products.forEach((p) => {
  const numBids = 4 + Math.floor(Math.random() * 4);
  let currentPrice = p.startingPrice;
  for (let i = 0; i < numBids; i++) {
    currentPrice += Math.floor(currentPrice * (0.05 + Math.random() * 0.1));
    bids.push({
      id: uuidv4(),
      productId: p.id,
      bidder: bidderNames[Math.floor(Math.random() * bidderNames.length)],
      bidderColor: bidderColors[Math.floor(Math.random() * bidderColors.length)],
      amount: currentPrice,
      timestamp: now - (numBids - i) * 25000,
    });
  }
});

app.get('/api/products', (req, res) => {
  res.json(products);
});

app.get('/api/products/:id', (req, res) => {
  const product = products.find((p) => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

app.get('/api/products/:id/bids', (req, res) => {
  const productBids = bids
    .filter((b) => b.productId === req.params.id)
    .sort((a, b) => a.timestamp - b.timestamp);
  res.json(productBids);
});

app.post('/api/products/:id/bids', (req, res) => {
  const { amount, bidder, bidderColor } = req.body;
  const product = products.find((p) => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const productBids = bids.filter((b) => b.productId === req.params.id);
  const currentMax =
    productBids.length > 0
      ? Math.max(...productBids.map((b) => b.amount))
      : product.startingPrice;

  if (!amount || amount < Math.floor(currentMax * 1.05)) {
    return res.status(400).json({
      error: 'Bid must be at least 5% higher than current max',
      currentMax,
      minBid: Math.floor(currentMax * 1.05),
    });
  }

  const newBid = {
    id: uuidv4(),
    productId: req.params.id,
    bidder: bidder || bidderNames[Math.floor(Math.random() * bidderNames.length)],
    bidderColor:
      bidderColor || bidderColors[Math.floor(Math.random() * bidderColors.length)],
    amount,
    timestamp: Date.now(),
  };

  bids.push(newBid);
  res.json(newBid);
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Auction server running on port ${PORT}`);
});
