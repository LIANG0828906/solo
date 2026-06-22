import express, { Request, Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = 3000;

const DATA_DIR = path.join(__dirname, 'data');
const CARDS_FILE = path.join(DATA_DIR, 'cards.json');
const EXCHANGES_FILE = path.join(DATA_DIR, 'exchanges.json');

interface Card {
  id: string;
  nickname: string;
  bio: string;
  skills: string[];
  email: string;
  createdAt: number;
}

interface Exchange {
  id: string;
  viewerId: string | null;
  targetCardId: string;
  targetNickname: string;
  timestamp: number;
  mutual: boolean;
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function readCards(): Card[] {
  try {
    const data = fs.readFileSync(CARDS_FILE, 'utf-8');
    return JSON.parse(data) as Card[];
  } catch {
    return [];
  }
}

function writeCards(cards: Card[]): void {
  fs.writeFileSync(CARDS_FILE, JSON.stringify(cards, null, 2), 'utf-8');
}

function readExchanges(): Exchange[] {
  try {
    const data = fs.readFileSync(EXCHANGES_FILE, 'utf-8');
    return JSON.parse(data) as Exchange[];
  } catch {
    return [];
  }
}

function writeExchanges(exchanges: Exchange[]): void {
  fs.writeFileSync(EXCHANGES_FILE, JSON.stringify(exchanges, null, 2), 'utf-8');
}

app.get('/api/cards', (_req: Request, res: Response) => {
  try {
    const cards = readCards();
    res.json(cards);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read cards' });
  }
});

app.post('/api/cards', (req: Request, res: Response) => {
  try {
    const { nickname, bio, skills, email } = req.body;

    if (!nickname || !email) {
      res.status(400).json({ error: '昵称和邮箱是必填项' });
      return;
    }

    const cards = readCards();
    const newCard: Card = {
      id: uuidv4(),
      nickname: String(nickname).trim(),
      bio: String(bio || '').trim(),
      skills: Array.isArray(skills)
        ? skills.map((s: string) => String(s).trim()).filter(Boolean).slice(0, 5)
        : [],
      email: String(email).trim(),
      createdAt: Date.now()
    };

    cards.push(newCard);
    writeCards(cards);
    res.status(201).json(newCard);
  } catch (err) {
    res.status(500).json({ error: '创建名片失败' });
  }
});

app.post('/api/exchanges', (req: Request, res: Response) => {
  try {
    const { viewerId, targetCardId } = req.body;

    if (!targetCardId) {
      res.status(400).json({ error: '缺少目标名片ID' });
      return;
    }

    const cards = readCards();
    const targetCard = cards.find(c => c.id === targetCardId);

    if (!targetCard) {
      res.status(404).json({ error: '目标名片不存在' });
      return;
    }

    const exchanges = readExchanges();

    const existingExchange = exchanges.find(
      e => e.viewerId === viewerId && e.targetCardId === targetCardId
    );

    if (existingExchange) {
      existingExchange.timestamp = Date.now();
      writeExchanges(exchanges);
      res.json(existingExchange);
      return;
    }

    let mutual = false;
    if (viewerId) {
      const reverseExchange = exchanges.find(
        e => e.viewerId === targetCardId && e.targetCardId === viewerId
      );
      if (reverseExchange) {
        reverseExchange.mutual = true;
        mutual = true;
      }
    }

    const newExchange: Exchange = {
      id: uuidv4(),
      viewerId: viewerId || null,
      targetCardId,
      targetNickname: targetCard.nickname,
      timestamp: Date.now(),
      mutual
    };

    exchanges.push(newExchange);
    writeExchanges(exchanges);
    res.status(201).json(newExchange);
  } catch (err) {
    res.status(500).json({ error: '记录交换失败' });
  }
});

app.get('/api/exchanges', (req: Request, res: Response) => {
  try {
    const { viewerId } = req.query;
    const exchanges = readExchanges();

    let filtered = exchanges;
    if (viewerId) {
      filtered = exchanges.filter(e => e.viewerId === viewerId || e.targetCardId === viewerId);
    }

    filtered.sort((a, b) => b.timestamp - a.timestamp);
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: '获取交换记录失败' });
  }
});

app.listen(PORT, () => {
  console.log(`复古名片交换站 API 服务器运行在 http://localhost:${PORT}`);
});
