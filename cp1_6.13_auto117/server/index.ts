import express, { Request, Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, '..', 'data.json');

interface DigestCard {
  id: string;
  boardId: string;
  title: string;
  author: string;
  excerpt: string;
  insight: string;
  tags: string[];
  createdAt: number;
}

interface Board {
  id: string;
  name: string;
  createdAt: number;
}

interface AppData {
  boards: Board[];
  cards: DigestCard[];
}

let data: AppData = {
  boards: [],
  cards: [],
};

function loadData(): void {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      data = JSON.parse(raw);
      console.log('数据加载成功');
    }
  } catch (e) {
    console.error('加载数据失败，使用空数据', e);
  }
}

function saveData(): void {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('保存数据失败', e);
  }
}

loadData();
setInterval(saveData, 10000);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/boards', (_req: Request, res: Response) => {
  const boardsWithCount = data.boards
    .map((board) => ({
      ...board,
      cardCount: data.cards.filter((c) => c.boardId === board.id).length,
    }))
    .sort((a, b) => b.createdAt - a.createdAt);
  res.json(boardsWithCount);
});

app.post('/api/boards', (req: Request, res: Response) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: '板名称不能为空' });
  }
  const newBoard: Board = {
    id: uuidv4(),
    name: name.trim(),
    createdAt: Date.now(),
  };
  data.boards.push(newBoard);
  saveData();
  res.status(201).json({ ...newBoard, cardCount: 0 });
});

app.put('/api/boards/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { name } = req.body;
  const board = data.boards.find((b) => b.id === id);
  if (!board) {
    return res.status(404).json({ error: '主题板不存在' });
  }
  if (!name || !name.trim()) {
    return res.status(400).json({ error: '板名称不能为空' });
  }
  board.name = name.trim();
  saveData();
  const cardCount = data.cards.filter((c) => c.boardId === id).length;
  res.json({ ...board, cardCount });
});

app.delete('/api/boards/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const boardIndex = data.boards.findIndex((b) => b.id === id);
  if (boardIndex === -1) {
    return res.status(404).json({ error: '主题板不存在' });
  }
  const deletedCardCount = data.cards.filter((c) => c.boardId === id).length;
  data.boards.splice(boardIndex, 1);
  data.cards = data.cards.filter((c) => c.boardId !== id);
  saveData();
  res.json({ deletedCardCount });
});

app.get('/api/boards/:id/cards', (req: Request, res: Response) => {
  const { id } = req.params;
  const cards = data.cards
    .filter((c) => c.boardId === id)
    .sort((a, b) => b.createdAt - a.createdAt);
  res.json(cards);
});

app.get('/api/cards', (_req: Request, res: Response) => {
  res.json(data.cards);
});

app.post('/api/cards', (req: Request, res: Response) => {
  const { boardId, title, author, excerpt, insight, tags } = req.body;
  if (!boardId || !title || !excerpt) {
    return res.status(400).json({ error: '板ID、书名和摘录内容为必填项' });
  }
  if (excerpt.length > 500) {
    return res.status(400).json({ error: '摘录内容不能超过500字' });
  }
  if (insight && insight.length > 200) {
    return res.status(400).json({ error: '个人感悟不能超过200字' });
  }
  const newCard: DigestCard = {
    id: uuidv4(),
    boardId,
    title: String(title).trim(),
    author: author ? String(author).trim() : '',
    excerpt: String(excerpt).trim(),
    insight: insight ? String(insight).trim() : '',
    tags: Array.isArray(tags) ? tags.filter((t: string) => t && t.trim()) : [],
    createdAt: Date.now(),
  };
  data.cards.push(newCard);
  saveData();
  res.status(201).json(newCard);
});

app.put('/api/cards/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const card = data.cards.find((c) => c.id === id);
  if (!card) {
    return res.status(404).json({ error: '卡片不存在' });
  }
  const { title, author, excerpt, insight, tags } = req.body;
  if (title !== undefined) {
    if (!String(title).trim()) {
      return res.status(400).json({ error: '书名不能为空' });
    }
    card.title = String(title).trim();
  }
  if (excerpt !== undefined) {
    if (!String(excerpt).trim()) {
      return res.status(400).json({ error: '摘录内容不能为空' });
    }
    if (excerpt.length > 500) {
      return res.status(400).json({ error: '摘录内容不能超过500字' });
    }
    card.excerpt = String(excerpt).trim();
  }
  if (author !== undefined) {
    card.author = author ? String(author).trim() : '';
  }
  if (insight !== undefined) {
    if (insight.length > 200) {
      return res.status(400).json({ error: '个人感悟不能超过200字' });
    }
    card.insight = insight ? String(insight).trim() : '';
  }
  if (tags !== undefined) {
    card.tags = Array.isArray(tags) ? tags.filter((t: string) => t && t.trim()) : [];
  }
  saveData();
  res.json(card);
});

app.delete('/api/cards/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const cardIndex = data.cards.findIndex((c) => c.id === id);
  if (cardIndex === -1) {
    return res.status(404).json({ error: '卡片不存在' });
  }
  data.cards.splice(cardIndex, 1);
  saveData();
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`DigestBoard 后端服务运行在 http://localhost:${PORT}`);
});
