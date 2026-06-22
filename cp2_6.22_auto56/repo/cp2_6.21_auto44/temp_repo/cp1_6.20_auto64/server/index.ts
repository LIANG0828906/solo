import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { differenceInHours, differenceInDays, isToday, parseISO } from 'date-fns';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(bodyParser.json());

interface Item {
  id: string;
  name: string;
  category: '蔬菜' | '水果' | '肉类' | '乳制品' | '调料';
  quantity: number;
  unit: '克' | '个' | '盒';
  purchaseDate: string;
  shelfLifeDays: number;
  createdAt: string;
}

const readData = (): Item[] => {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return [];
    }
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

const writeData = (data: Item[]) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
};

const getExpiryDate = (item: Item) => {
  const purchase = parseISO(item.purchaseDate);
  const expiry = new Date(purchase);
  expiry.setDate(expiry.getDate() + item.shelfLifeDays);
  return expiry;
};

const getRemainingHours = (item: Item) => {
  const expiry = getExpiryDate(item);
  return differenceInHours(expiry, new Date());
};

app.get('/api/items', (req, res) => {
  try {
    const items = readData();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

app.get('/api/items/:id', (req, res) => {
  try {
    const items = readData();
    const item = items.find((i) => i.id === req.params.id);
    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

app.post('/api/items', (req, res) => {
  try {
    const { name, category, quantity, unit, purchaseDate, shelfLifeDays } = req.body;

    if (!name || !category || !quantity || !unit || !purchaseDate || !shelfLifeDays) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const items = readData();
    const newItem: Item = {
      id: uuidv4(),
      name,
      category,
      quantity: Number(quantity),
      unit,
      purchaseDate,
      shelfLifeDays: Number(shelfLifeDays),
      createdAt: new Date().toISOString(),
    };
    items.push(newItem);
    writeData(items);
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create item' });
  }
});

app.put('/api/items/:id', (req, res) => {
  try {
    const items = readData();
    const index = items.findIndex((i) => i.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    items[index] = { ...items[index], ...req.body };
    writeData(items);
    res.json(items[index]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update item' });
  }
});

app.delete('/api/items/:id', (req, res) => {
  try {
    const items = readData();
    const filtered = items.filter((i) => i.id !== req.params.id);
    if (filtered.length === items.length) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }
    writeData(filtered);
    res.json({ message: 'Item deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

app.get('/api/stats', (req, res) => {
  try {
    const items = readData();
    const now = new Date();

    const total = items.length;
    let expiringSoon = 0;
    let expired = 0;
    let todayAdded = 0;

    items.forEach((item) => {
      const remainingHours = getRemainingHours(item);
      if (remainingHours < 0) {
        expired++;
      } else if (remainingHours <= 72) {
        expiringSoon++;
      }
      if (isToday(parseISO(item.createdAt))) {
        todayAdded++;
      }
    });

    res.json({
      total,
      expiringSoon,
      expired,
      todayAdded,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
