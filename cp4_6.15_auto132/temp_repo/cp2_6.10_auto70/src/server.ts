import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import type { PawnItem } from './types';
import { calculateValuation, calculateDeadPawnPrice } from './utils/valuation';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

let pawnItems: PawnItem[] = [];

app.get('/api/items', (req, res) => {
  res.json({ items: pawnItems });
});

app.get('/api/market', (req, res) => {
  const marketItems = pawnItems.filter(item => item.status === 'dead' && item.marketPrice);
  res.json({ items: marketItems });
});

app.post('/api/pawn', (req, res) => {
  const itemData = req.body;
  const valuation = calculateValuation({
    material: itemData.material,
    era: itemData.era,
    condition: itemData.condition,
    liquidity: itemData.liquidity,
    weight: itemData.weight
  });

  const newItem: PawnItem = {
    id: uuidv4(),
    ...itemData,
    pawnAmount: valuation.pawnAmount,
    originalValue: valuation.baseValue,
    monthlyInterest: 0.02,
    pawnTermMonths: 6
  };

  pawnItems.push(newItem);
  res.json({ success: true, item: newItem, valuation });
});

app.post('/api/redeem', (req, res) => {
  const { itemId } = req.body;
  const item = pawnItems.find(i => i.id === itemId);
  
  if (!item) {
    return res.status(404).json({ success: false, error: 'Item not found' });
  }

  if (item.status !== 'active') {
    return res.status(400).json({ success: false, error: 'Item not available for redemption' });
  }

  const monthsPaid = 6;
  const interest = item.pawnAmount * item.monthlyInterest * monthsPaid;
  const totalAmount = item.pawnAmount + interest;

  item.status = 'redeemed';
  res.json({ success: true, item, totalAmount });
});

app.post('/api/deadpawn', (req, res) => {
  const { itemId, marketPrice } = req.body;
  const item = pawnItems.find(i => i.id === itemId);
  
  if (!item) {
    return res.status(404).json({ success: false, error: 'Item not found' });
  }

  if (item.status !== 'dead') {
    return res.status(400).json({ success: false, error: 'Item is not a dead pawn' });
  }

  const price = marketPrice || calculateDeadPawnPrice(item.pawnAmount);
  item.marketPrice = price;
  
  res.json({ success: true, item });
});

app.get('/api/buy/:itemId', (req, res) => {
  const { itemId } = req.params;
  const item = pawnItems.find(i => i.id === itemId);
  
  if (!item) {
    return res.status(404).json({ success: false, error: 'Item not found' });
  }

  if (item.status !== 'dead' || !item.marketPrice) {
    return res.status(400).json({ success: false, error: 'Item not available for purchase' });
  }

  item.status = 'sold';
  item.sellDate = new Date().toISOString();
  
  res.json({ success: true, item });
});

app.listen(PORT, () => {
  console.log(`恒升当铺服务器运行在 http://localhost:${PORT}`);
});
