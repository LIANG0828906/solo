import express, { Request, Response } from 'express';
import { DRINKS, VESSELS, SHICHENS, generateCustomerName, HU_NAMES, HAN_NAMES } from './data';
import { Drink, OrderRequest, OrderResponse, TransactionRecord, GambleResult, InventoryUpdate } from './types';

const app = express();
const port = 3001;

app.use(express.json());

let drinks = JSON.parse(JSON.stringify(DRINKS)) as Drink[];
let records: TransactionRecord[] = [];

setInterval(() => {
  drinks = drinks.map(d => ({
    ...d,
    stock: Math.min(d.stock + 5, d.maxStock)
  }));
}, 60000);

function calculateChange(amount: number) {
  let remaining = amount;
  const silkBolts = Math.floor(remaining / 500);
  remaining -= silkBolts * 500;
  const ivoryChips = Math.ceil(remaining / 5);
  const chipValue = ivoryChips * 5;
  const cash = chipValue - remaining;
  return { silkBolts, ivoryChips, cash, totalChange: amount };
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatDate(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

app.get('/api/drinks', (req: Request, res: Response) => {
  res.json(drinks);
});

app.get('/api/items', (req: Request, res: Response) => {
  res.json(VESSELS);
});

app.get('/api/shichens', (req: Request, res: Response) => {
  res.json(SHICHENS);
});

app.post('/api/order', (req: Request<{}, {}, OrderRequest>, res: Response<OrderResponse>) => {
  const { drinkId, quantity, vesselId, shichenId, customerName, payment } = req.body;

  const drink = drinks.find(d => d.id === drinkId);
  if (!drink) {
    return res.json({ success: false, message: '酒水不存在' });
  }

  if (drink.stock < quantity) {
    return res.json({ success: false, message: `库存不足，仅剩${drink.stock}${drink.unit}` });
  }

  const vessel = VESSELS.find(v => v.id === vesselId);
  if (!vessel) {
    return res.json({ success: false, message: '器皿不存在' });
  }

  const shichen = SHICHENS.find(s => s.id === shichenId);
  if (!shichen) {
    return res.json({ success: false, message: '时辰不存在' });
  }

  if (payment.ivoryChips < 0 || payment.silkBolts < 0) {
    return res.json({ success: false, message: '支付数量不能为负' });
  }

  if (payment.ivoryChips > 100 || payment.silkBolts > 10) {
    return res.json({ success: false, message: '支付数量超过限额' });
  }

  const totalPaid = payment.ivoryChips * 5 + payment.silkBolts * 500;
  const basePrice = drink.price * quantity;
  const vesselTotal = vessel.price * quantity;
  const subtotal = basePrice + vesselTotal;
  const modifierAmount = subtotal * shichen.priceModifier;
  const totalPrice = Math.round(subtotal + modifierAmount);
  const cost = Math.round(basePrice * drink.costRatio);
  const profit = totalPrice - cost;

  if (totalPaid < totalPrice) {
    return res.json({ success: false, message: `支付不足，还差${totalPrice - totalPaid}文` });
  }

  drink.stock -= quantity;
  const change = calculateChange(totalPaid - totalPrice);

  const now = new Date();
  const record: TransactionRecord = {
    id: generateId(),
    timestamp: now.toISOString(),
    date: formatDate(now),
    type: 'drink',
    customerName: customerName || generateCustomerName(),
    drinkName: drink.name,
    quantity,
    unit: drink.unit,
    vesselName: vessel.name,
    shichenName: shichen.name,
    basePrice,
    priceModifier: shichen.priceModifier,
    totalPrice,
    cost,
    profit,
    paymentMethod: `${payment.ivoryChips > 0 ? payment.ivoryChips + '根象牙筹签 ' : ''}${payment.silkBolts > 0 ? payment.silkBolts + '匹绢帛' : ''}`.trim(),
    paymentAmount: totalPaid,
    change: change.totalChange
  };

  records.unshift(record);

  res.json({
    success: true,
    bill: {
      drinkName: drink.name,
      unit: drink.unit,
      quantity,
      basePrice,
      vesselPrice: vessel.price,
      vesselName: vessel.name,
      shichenName: shichen.name,
      priceModifier: shichen.priceModifier,
      subtotal,
      totalPrice,
      cost,
      profit,
      payment: {
        ivoryChips: payment.ivoryChips,
        silkBolts: payment.silkBolts,
        totalPaid
      },
      change
    },
    record
  });
});

app.get('/api/records', (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  let filtered = records;
  
  if (startDate && typeof startDate === 'string') {
    filtered = filtered.filter(r => r.date >= startDate);
  }
  if (endDate && typeof endDate === 'string') {
    filtered = filtered.filter(r => r.date <= endDate);
  }
  
  res.json(filtered);
});

app.post('/api/gamble', (req: Request, res: Response<GambleResult>) => {
  const winner = Math.random() < 0.5 ? 'banker' : 'customer';
  const amount = winner === 'customer' ? 50 : 0;
  const isHu = Math.random() > 0.5;
  const names = isHu ? HU_NAMES : HAN_NAMES;
  const customerName = names[Math.floor(Math.random() * names.length)];
  
  const now = new Date();
  const record: TransactionRecord = {
    id: generateId(),
    timestamp: now.toISOString(),
    date: formatDate(now),
    type: 'gamble',
    customerName,
    totalPrice: amount,
    cost: 0,
    profit: amount,
    paymentMethod: '博戏',
    paymentAmount: amount,
    change: 0
  };
  
  records.unshift(record);
  
  res.json({ winner, amount, record });
});

app.get('/api/inventory', (req: Request, res: Response<Drink[]>) => {
  res.json(drinks);
});

app.listen(port, () => {
  console.log(`酒肆账房已在端口 ${port} 开工`);
});
