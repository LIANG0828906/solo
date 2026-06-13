import express, { Request, Response } from 'express';
import session from 'express-session';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import { Card, Deck, BattleRecord, UserStats } from '../src/types';
import { initialCards, initialDecks, initialBattles, initialStats } from './seed';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Database {
  cards: Card[];
  decks: Deck[];
  battles: BattleRecord[];
  stats: UserStats;
}

const app = express();
const PORT = 3001;

app.use(express.json({ limit: '50mb' }));
app.use(
  session({
    secret: 'card-game-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

const dbFile = path.join(__dirname, 'db.json');
const adapter = new JSONFile<Database>(dbFile);
const defaultData: Database = {
  cards: initialCards,
  decks: initialDecks,
  battles: initialBattles,
  stats: initialStats,
};
const db = new Low<Database>(adapter, defaultData);

await db.read();
if (!db.data || !db.data.cards || db.data.cards.length === 0) {
  db.data = defaultData;
  await db.write();
}

const updateStats = async () => {
  await db.read();
  const decks = db.data.decks;
  const battles = db.data.battles;
  const cardCounts: Record<string, number> = {};

  decks.forEach((deck) => {
    deck.cards.forEach((dc) => {
      cardCounts[dc.cardId] = (cardCounts[dc.cardId] || 0) + dc.count;
    });
  });

  const topCards = Object.entries(cardCounts)
    .map(([cardId, count]) => ({ cardId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  db.data.stats = {
    deckCount: decks.length,
    battleCount: battles.length,
    topCards,
  };
  await db.write();
};

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.get('/api/cards', async (_req: Request, res: Response) => {
  await db.read();
  res.json(db.data.cards);
});

app.get('/api/cards/:id', async (req: Request, res: Response) => {
  await db.read();
  const card = db.data.cards.find((c) => c.id === req.params.id);
  if (!card) return res.status(404).json({ error: '卡牌不存在' });
  res.json(card);
});

app.get('/api/decks', async (_req: Request, res: Response) => {
  await db.read();
  res.json(db.data.decks);
});

app.post('/api/decks', async (req: Request, res: Response) => {
  await db.read();
  if (db.data.decks.length >= 5) {
    return res.status(400).json({ error: '卡组数量已达上限（最多5套）' });
  }
  const { name, cards } = req.body;
  if (!name || !cards) {
    return res.status(400).json({ error: '卡组名称和卡牌列表不能为空' });
  }
  const newDeck: Deck = {
    id: uuidv4(),
    name,
    cards,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.data.decks.push(newDeck);
  await db.write();
  await updateStats();
  res.status(201).json(newDeck);
});

app.put('/api/decks/:id', async (req: Request, res: Response) => {
  await db.read();
  const deckIndex = db.data.decks.findIndex((d) => d.id === req.params.id);
  if (deckIndex === -1) return res.status(404).json({ error: '卡组不存在' });
  const { name, cards } = req.body;
  db.data.decks[deckIndex] = {
    ...db.data.decks[deckIndex],
    name: name || db.data.decks[deckIndex].name,
    cards: cards || db.data.decks[deckIndex].cards,
    updatedAt: new Date().toISOString(),
  };
  await db.write();
  await updateStats();
  res.json(db.data.decks[deckIndex]);
});

app.delete('/api/decks/:id', async (req: Request, res: Response) => {
  await db.read();
  const deckIndex = db.data.decks.findIndex((d) => d.id === req.params.id);
  if (deckIndex === -1) return res.status(404).json({ error: '卡组不存在' });
  db.data.decks.splice(deckIndex, 1);
  await db.write();
  await updateStats();
  res.json({ success: true });
});

app.get('/api/battles', async (_req: Request, res: Response) => {
  await db.read();
  res.json(db.data.battles);
});

app.post('/api/battles', async (req: Request, res: Response) => {
  await db.read();
  const battleData = req.body;
  if (!battleData.turns || !battleData.player1 || !battleData.player2) {
    return res.status(400).json({ error: '对局数据不完整' });
  }
  const newBattle: BattleRecord = {
    id: uuidv4(),
    player1: battleData.player1,
    player2: battleData.player2,
    winner: battleData.winner || 1,
    turns: battleData.turns,
    totalTurns: battleData.turns.length,
    createdAt: new Date().toISOString(),
  };
  db.data.battles.push(newBattle);
  await db.write();
  await updateStats();
  res.status(201).json(newBattle);
});

app.get('/api/battles/:id', async (req: Request, res: Response) => {
  await db.read();
  const battle = db.data.battles.find((b) => b.id === req.params.id);
  if (!battle) return res.status(404).json({ error: '对局不存在' });
  res.json(battle);
});

app.delete('/api/battles/:id', async (req: Request, res: Response) => {
  await db.read();
  const battleIndex = db.data.battles.findIndex((b) => b.id === req.params.id);
  if (battleIndex === -1) return res.status(404).json({ error: '对局不存在' });
  db.data.battles.splice(battleIndex, 1);
  await db.write();
  await updateStats();
  res.json({ success: true });
});

app.get('/api/stats', async (_req: Request, res: Response) => {
  await db.read();
  await updateStats();
  res.json(db.data.stats);
});

app.listen(PORT, () => {
  console.log(`\n🚀 后端服务已启动: http://localhost:${PORT}`);
  console.log(`📊 API文档: http://localhost:${PORT}/api/health`);
});
