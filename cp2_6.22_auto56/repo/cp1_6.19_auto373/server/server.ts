import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  stock: number;
  weeklySales: number;
  price: number;
  createdAt: string;
  inventoryHistory: { date: string; stock: number }[];
}

interface Store {
  id: string;
  name: string;
  lat: number;
  lng: number;
  stock: number;
}

interface ActionLog {
  id: string;
  bookId: string;
  bookTitle: string;
  type: 'print' | 'transfer';
  quantity: number;
  timestamp: string;
  details: string;
}

const stores: Store[] = [
  { id: 's1', name: '朝阳门店', lat: 39.92, lng: 116.44, stock: 120 },
  { id: 's2', name: '中关村店', lat: 39.98, lng: 116.31, stock: 85 },
  { id: 's3', name: '国贸店', lat: 39.91, lng: 116.46, stock: 45 },
  { id: 's4', name: '西单店', lat: 39.91, lng: 116.37, stock: 60 },
  { id: 's5', name: '三里屯店', lat: 39.94, lng: 116.45, stock: 30 },
];

const generateHistory = (initialStock: number, days: number = 7) => {
  const history: { date: string; stock: number }[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const variance = Math.floor(Math.random() * 20) - 10;
    history.push({
      date: d.toISOString().split('T')[0],
      stock: Math.max(0, initialStock + variance - Math.floor((days - i) * 2)),
    });
  }
  history[history.length - 1].stock = initialStock;
  return history;
};

let books: Book[] = [
  {
    id: '1',
    title: '人类简史',
    author: '尤瓦尔·赫拉利',
    isbn: '9787508647357',
    stock: 3,
    weeklySales: 56,
    price: 68,
    createdAt: new Date().toISOString(),
    inventoryHistory: generateHistory(3),
  },
  {
    id: '2',
    title: '活着',
    author: '余华',
    isbn: '9787506365437',
    stock: 42,
    weeklySales: 28,
    price: 35,
    createdAt: new Date().toISOString(),
    inventoryHistory: generateHistory(42),
  },
  {
    id: '3',
    title: '三体',
    author: '刘慈欣',
    isbn: '9787536692930',
    stock: 8,
    weeklySales: 89,
    price: 93,
    createdAt: new Date().toISOString(),
    inventoryHistory: generateHistory(8),
  },
  {
    id: '4',
    title: '百年孤独',
    author: '加西亚·马尔克斯',
    isbn: '9787544253994',
    stock: 2,
    weeklySales: 45,
    price: 55,
    createdAt: new Date().toISOString(),
    inventoryHistory: generateHistory(2),
  },
  {
    id: '5',
    title: '红楼梦',
    author: '曹雪芹',
    isbn: '9787020002207',
    stock: 56,
    weeklySales: 12,
    price: 59.8,
    createdAt: new Date().toISOString(),
    inventoryHistory: generateHistory(56),
  },
  {
    id: '6',
    title: '平凡的世界',
    author: '路遥',
    isbn: '9787530209555',
    stock: 15,
    weeklySales: 34,
    price: 128,
    createdAt: new Date().toISOString(),
    inventoryHistory: generateHistory(15),
  },
];

let actionLogs: ActionLog[] = [];

const haversineDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const currentLocation = { lat: 39.9042, lng: 116.4074 };

app.get('/api/books', (_req: Request, res: Response) => {
  res.json(books);
});

app.get('/api/books/:id', (req: Request, res: Response) => {
  const book = books.find((b) => b.id === req.params.id);
  if (!book) return res.status(404).json({ error: 'Book not found' });
  res.json(book);
});

app.post('/api/books', (req: Request, res: Response) => {
  const { title, author, isbn, stock, weeklySales, price } = req.body;
  const newBook: Book = {
    id: Date.now().toString(),
    title,
    author,
    isbn,
    stock: Number(stock),
    weeklySales: Number(weeklySales),
    price: Number(price),
    createdAt: new Date().toISOString(),
    inventoryHistory: generateHistory(Number(stock)),
  };
  books.push(newBook);
  res.status(201).json(newBook);
});

app.put('/api/books/:id', (req: Request, res: Response) => {
  const index = books.findIndex((b) => b.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Book not found' });
  books[index] = { ...books[index], ...req.body };
  res.json(books[index]);
});

app.get('/api/suggestion/:bookId', (req: Request, res: Response) => {
  const book = books.find((b) => b.id === req.params.bookId);
  if (!book) return res.status(404).json({ error: 'Book not found' });

  const dailySlope = book.weeklySales / 7;
  const predictedDemand = Math.ceil(dailySlope * 3 * 1.2);
  const printQty = Math.max(0, predictedDemand - book.stock);
  const roundedPrintQty = Math.max(50, Math.ceil(printQty / 10) * 10);

  const storesWithDistance = stores
    .map((s) => ({
      ...s,
      distance: haversineDistance(
        currentLocation.lat,
        currentLocation.lng,
        s.lat,
        s.lng
      ),
    }))
    .sort((a, b) => a.distance - b.distance)
    .filter((s) => s.stock > 0)
    .slice(0, 3);

  const totalAvailable = storesWithDistance.reduce((sum, s) => sum + s.stock, 0);
  const transferQty = Math.min(totalAvailable, predictedDemand);

  res.json({
    print: {
      type: 'print' as const,
      predictedDemand,
      recommendedQty: roundedPrintQty,
      reason: `基于近7日日均销量${dailySlope.toFixed(1)}本，预测未来3日需求${predictedDemand}本，考虑1.2倍安全系数`,
      estimatedCost: roundedPrintQty * book.price * 0.3,
    },
    transfer: {
      type: 'transfer' as const,
      stores: storesWithDistance,
      totalAvailable,
      recommendedQty: transferQty,
      reason: `最近3家门店总可用库存${totalAvailable}本，按距离优先推荐调拨`,
      estimatedCost: transferQty * 5 + storesWithDistance[0]?.distance * 2 || 0,
    },
  });
});

app.get('/api/logs', (_req: Request, res: Response) => {
  res.json(actionLogs);
});

app.post('/api/action', (req: Request, res: Response) => {
  const { bookId, type, quantity, details } = req.body;
  const bookIndex = books.findIndex((b) => b.id === bookId);
  if (bookIndex === -1) return res.status(404).json({ error: 'Book not found' });

  const book = books[bookIndex];
  const newStock = type === 'print' 
    ? book.stock + Number(quantity) 
    : book.stock + Number(quantity);

  const today = new Date().toISOString().split('T')[0];
  const existingHistoryIndex = book.inventoryHistory.findIndex(
    (h) => h.date === today
  );
  const newHistory = [...book.inventoryHistory];
  if (existingHistoryIndex >= 0) {
    newHistory[existingHistoryIndex] = { date: today, stock: newStock };
  } else {
    newHistory.push({ date: today, stock: newStock });
    if (newHistory.length > 7) newHistory.shift();
  }

  books[bookIndex] = {
    ...book,
    stock: newStock,
    inventoryHistory: newHistory,
  };

  const log: ActionLog = {
    id: Date.now().toString(),
    bookId,
    bookTitle: book.title,
    type,
    quantity: Number(quantity),
    timestamp: new Date().toISOString(),
    details,
  };
  actionLogs.unshift(log);
  if (actionLogs.length > 50) actionLogs.pop();

  res.json({ success: true, book: books[bookIndex], log });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
