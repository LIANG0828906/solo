import { Router, Request, Response } from 'express';

export interface Instrument {
  id: string;
  brand: string;
  model: string;
  category: 'guitar' | 'keyboard' | 'wind' | 'string';
  purchaseYear: number;
  usageYears: number;
  condition: number;
  images: string[];
  description: string;
  expectedPrice: number;
  createdAt: number;
  seller: { id: string; name: string };
}

export interface Offer {
  id: string;
  instrumentId: string;
  buyerName: string;
  price: number;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
}

interface InventoryDB {
  instruments: Instrument[];
  offers: Offer[];
}

declare global {
  var __inventoryDB: InventoryDB;
}

const router = Router();

function getDB(): InventoryDB {
  if (!global.__inventoryDB) {
    global.__inventoryDB = {
      instruments: [],
      offers: [],
    };
  }
  return global.__inventoryDB;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

router.get('/', (req: Request, res: Response) => {
  const db = getDB();
  const { category, priceMin, priceMax, conditionMin, conditionMax } = req.query;

  let instruments = [...db.instruments];

  if (category && typeof category === 'string') {
    instruments = instruments.filter((i) => i.category === category);
  }
  if (priceMin) {
    const min = Number(priceMin);
    if (!isNaN(min)) {
      instruments = instruments.filter((i) => i.expectedPrice >= min);
    }
  }
  if (priceMax) {
    const max = Number(priceMax);
    if (!isNaN(max)) {
      instruments = instruments.filter((i) => i.expectedPrice <= max);
    }
  }
  if (conditionMin) {
    const min = Number(conditionMin);
    if (!isNaN(min)) {
      instruments = instruments.filter((i) => i.condition >= min);
    }
  }
  if (conditionMax) {
    const max = Number(conditionMax);
    if (!isNaN(max)) {
      instruments = instruments.filter((i) => i.condition <= max);
    }
  }

  instruments.sort((a, b) => b.createdAt - a.createdAt);

  res.json(instruments);
});

router.get('/:id', (req: Request, res: Response) => {
  const db = getDB();
  const instrument = db.instruments.find((i) => i.id === req.params.id);

  if (!instrument) {
    res.status(404).json({ error: '商品不存在' });
    return;
  }

  res.json(instrument);
});

router.post('/', (req: Request, res: Response) => {
  const db = getDB();
  const {
    brand,
    model,
    category,
    purchaseYear,
    usageYears,
    condition,
    description,
    expectedPrice,
    sellerId,
    sellerName,
  } = req.body;

  if (!brand || !model || !category || !expectedPrice) {
    res.status(400).json({ error: '缺少必要字段' });
    return;
  }

  const images: string[] = [];
  if (req.file) {
    const filename = (req.file as Express.Multer.File & { savedFilename?: string }).savedFilename;
    if (filename) {
      images.push(`/uploads/${filename}`);
    }
  }

  const instrument: Instrument = {
    id: generateId(),
    brand: String(brand),
    model: String(model),
    category: category as Instrument['category'],
    purchaseYear: Number(purchaseYear) || new Date().getFullYear(),
    usageYears: Number(usageYears) || 0,
    condition: Number(condition) || 5,
    images,
    description: String(description || ''),
    expectedPrice: Number(expectedPrice),
    createdAt: Date.now(),
    seller: {
      id: String(sellerId || 'default-seller'),
      name: String(sellerName || '匿名卖家'),
    },
  };

  db.instruments.push(instrument);
  res.status(201).json(instrument);
});

router.post('/:id/offers', (req: Request, res: Response) => {
  const db = getDB();
  const instrument = db.instruments.find((i) => i.id === req.params.id);

  if (!instrument) {
    res.status(404).json({ error: '商品不存在' });
    return;
  }

  const { buyerName, price } = req.body;

  if (!buyerName || !price) {
    res.status(400).json({ error: '缺少必要字段' });
    return;
  }

  const offerPrice = Number(price);
  const minPrice = instrument.expectedPrice * 0.6;

  if (offerPrice < minPrice) {
    res.status(400).json({
      error: `出价不能低于期望价格的60%（¥${Math.round(minPrice).toLocaleString()}）`,
    });
    return;
  }

  const offer: Offer = {
    id: generateId(),
    instrumentId: instrument.id,
    buyerName: String(buyerName),
    price: offerPrice,
    status: 'pending',
    createdAt: Date.now(),
  };

  db.offers.push(offer);
  res.status(201).json(offer);
});

router.get('/:id/offers', (req: Request, res: Response) => {
  const db = getDB();
  const instrument = db.instruments.find((i) => i.id === req.params.id);

  if (!instrument) {
    res.status(404).json({ error: '商品不存在' });
    return;
  }

  const offers = db.offers
    .filter((o) => o.instrumentId === req.params.id)
    .sort((a, b) => b.createdAt - a.createdAt);

  res.json(offers);
});

router.post('/:id/offers/batch', (req: Request, res: Response) => {
  const db = getDB();
  const instrument = db.instruments.find((i) => i.id === req.params.id);

  if (!instrument) {
    res.status(404).json({ error: '商品不存在' });
    return;
  }

  const offersInput = Array.isArray(req.body) ? req.body : [];
  const createdOffers: Offer[] = [];
  const errors: string[] = [];

  for (const input of offersInput) {
    const { buyerName, price } = input;
    if (!buyerName || !price) {
      errors.push('缺少必要字段');
      continue;
    }

    const offerPrice = Number(price);
    const minPrice = instrument.expectedPrice * 0.6;

    if (offerPrice < minPrice) {
      errors.push(`出价 ¥${offerPrice.toLocaleString()} 低于最低要求`);
      continue;
    }

    const offer: Offer = {
      id: generateId(),
      instrumentId: instrument.id,
      buyerName: String(buyerName),
      price: offerPrice,
      status: 'pending',
      createdAt: Date.now(),
    };

    db.offers.push(offer);
    createdOffers.push(offer);
  }

  res.status(201).json({ created: createdOffers, errors });
});

export default router;
