import express from 'express';
import cors from 'cors';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;
const DB_PATH = join(__dirname, 'data', 'db.json');

interface Item {
  id: string;
  name: string;
  description: string;
  status: 'available' | 'borrowed';
  createdAt: string;
}

interface Borrow {
  id: string;
  itemId: string;
  itemName: string;
  borrowerName: string;
  days: number;
  remark: string;
  status: 'active' | 'returned';
  borrowTime: string;
}

interface Database {
  items: Item[];
  borrows: Borrow[];
}

class DatabaseService {
  private data: Database;
  private itemCache: Map<string, Item>;

  constructor() {
    this.data = this.loadFromFile();
    this.itemCache = new Map();
    this.buildCache();
  }

  private loadFromFile(): Database {
    try {
      const content = readFileSync(DB_PATH, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.error('Error loading database file:', error);
      return { items: [], borrows: [] };
    }
  }

  private saveToFile(): void {
    try {
      writeFileSync(DB_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error saving database file:', error);
    }
  }

  private buildCache(): void {
    this.itemCache.clear();
    for (const item of this.data.items) {
      this.itemCache.set(item.id, item);
    }
  }

  getItems(name?: string): Item[] {
    let items = this.data.items;
    if (name) {
      items = items.filter(item => 
        item.name.toLowerCase().includes(name.toLowerCase())
      );
    }
    return items;
  }

  getItemById(id: string): Item | undefined {
    return this.itemCache.get(id);
  }

  getBorrows(): Borrow[] {
    return this.data.borrows;
  }

  borrowItem(
    itemId: string,
    borrowerName: string,
    days: number,
    remark: string
  ): Borrow | null {
    const item = this.itemCache.get(itemId);
    if (!item || item.status === 'borrowed') {
      return null;
    }

    item.status = 'borrowed';

    const borrow: Borrow = {
      id: uuidv4(),
      itemId: item.id,
      itemName: item.name,
      borrowerName,
      days,
      remark,
      status: 'active',
      borrowTime: new Date().toISOString()
    };

    this.data.borrows.unshift(borrow);
    this.saveToFile();

    return borrow;
  }
}

const db = new DatabaseService();

app.use(cors());
app.use(express.json());

app.get('/api/items', (req, res) => {
  const { name } = req.query;
  const items = db.getItems(name as string);
  res.json(items);
});

app.post('/api/items/:id/borrow', (req, res) => {
  const { id } = req.params;
  const { borrowerName, days, remark } = req.body;

  if (!borrowerName || !days) {
    return res.status(400).json({ error: 'borrowerName and days are required' });
  }

  const borrow = db.borrowItem(id, borrowerName, days, remark || '');

  if (!borrow) {
    return res.status(400).json({ error: 'Item not found or already borrowed' });
  }

  res.json(borrow);
});

app.get('/api/borrows', (req, res) => {
  const borrows = db.getBorrows();
  res.json(borrows);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
