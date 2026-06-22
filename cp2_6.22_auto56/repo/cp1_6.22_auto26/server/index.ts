import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import type { RecipeBoard, RecipeCard, WsAction, BoardData } from '../src/types';

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

interface Store {
  boards: Map<string, RecipeBoard>;
  cards: Map<string, RecipeCard>;
}

const store: Store = {
  boards: new Map(),
  cards: new Map(),
};

const gradientPresets = [
  'linear-gradient(135deg, #ff9a56 0%, #ff6b6b 100%)',
  'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  'linear-gradient(135deg, #ffd89b 0%, #19547b 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
];

function initMockData() {
  const board1: RecipeBoard = {
    id: uuidv4(),
    name: '周末早午餐',
    gradient: gradientPresets[0],
    createdAt: Date.now(),
    cardOrder: [],
  };
  const board2: RecipeBoard = {
    id: uuidv4(),
    name: '低卡甜品',
    gradient: gradientPresets[2],
    createdAt: Date.now() - 86400000,
    cardOrder: [],
  };
  const board3: RecipeBoard = {
    id: uuidv4(),
    name: '家常快手菜',
    gradient: gradientPresets[3],
    createdAt: Date.now() - 172800000,
    cardOrder: [],
  };

  store.boards.set(board1.id, board1);
  store.boards.set(board2.id, board2);
  store.boards.set(board3.id, board3);

  const sampleCards: Omit<RecipeCard, 'id' | 'order' | 'boardId'>[] = [
    {
      name: '班尼迪克蛋',
      sourceUrl: 'https://example.com/eggs-benedict',
      coverImage: 'https://picsum.photos/seed/eggs-benedict/400/300',
      tags: ['早餐', '西式', '经典'],
      difficulty: 3,
      notes: '荷兰酱是关键，要注意温度控制',
    },
    {
      name: '法式吐司',
      sourceUrl: 'https://example.com/french-toast',
      coverImage: 'https://picsum.photos/seed/french-toast/400/300',
      tags: ['早餐', '甜点', '简单'],
      difficulty: 1,
      notes: '浸泡过夜口感更好',
    },
    {
      name: '牛油果吐司',
      sourceUrl: 'https://example.com/avocado-toast',
      coverImage: 'https://picsum.photos/seed/avocado-toast/400/300',
      tags: ['健康', '快手', '素食'],
      difficulty: 1,
      notes: '加一点柠檬汁防止氧化',
    },
  ];

  sampleCards.forEach((cardData, index) => {
    const card: RecipeCard = {
      ...cardData,
      id: uuidv4(),
      order: index,
      boardId: board1.id,
    };
    store.cards.set(card.id, card);
    board1.cardOrder.push(card.id);
  });

  const dessertCards: Omit<RecipeCard, 'id' | 'order' | 'boardId'>[] = [
    {
      name: '抹茶提拉米苏',
      sourceUrl: 'https://example.com/matcha-tiramisu',
      coverImage: 'https://picsum.photos/seed/matcha-tiramisu/400/300',
      tags: ['日式', '甜品', '低卡'],
      difficulty: 3,
      notes: '用希腊酸奶代替马斯卡彭更健康',
    },
    {
      name: '莓果燕麦杯',
      sourceUrl: 'https://example.com/berry-oat-cup',
      coverImage: 'https://picsum.photos/seed/berry-oat-cup/400/300',
      tags: ['健康', '快手', '早餐'],
      difficulty: 1,
      notes: '可以前一天晚上准备好',
    },
  ];

  dessertCards.forEach((cardData, index) => {
    const card: RecipeCard = {
      ...cardData,
      id: uuidv4(),
      order: index,
      boardId: board2.id,
    };
    store.cards.set(card.id, card);
    board2.cardOrder.push(card.id);
  });
}

initMockData();

function broadcast(wss: WebSocketServer, action: WsAction, excludeId?: string) {
  const message = JSON.stringify(action);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && (client as any).id !== excludeId) {
      client.send(message);
    }
  });
}

app.get('/api/boards', (_req, res) => {
  const boards = Array.from(store.boards.values()).sort((a, b) => b.createdAt - a.createdAt);
  res.json(boards);
});

app.get('/api/boards/:id', (req, res) => {
  const board = store.boards.get(req.params.id);
  if (!board) {
    res.status(404).json({ error: 'Board not found' });
    return;
  }
  const cards = board.cardOrder.map((id) => store.cards.get(id)).filter(Boolean) as RecipeCard[];
  res.json({ board, cards } as BoardData);
});

app.post('/api/boards', (req, res) => {
  const { name } = req.body;
  const gradient = gradientPresets[Math.floor(Math.random() * gradientPresets.length)];
  const board: RecipeBoard = {
    id: uuidv4(),
    name,
    gradient,
    createdAt: Date.now(),
    cardOrder: [],
  };
  store.boards.set(board.id, board);
  res.status(201).json(board);
});

app.put('/api/boards/:id', (req, res) => {
  const board = store.boards.get(req.params.id);
  if (!board) {
    res.status(404).json({ error: 'Board not found' });
    return;
  }
  if (req.body.name !== undefined) board.name = req.body.name;
  if (req.body.cardOrder !== undefined) board.cardOrder = req.body.cardOrder;
  res.json(board);
});

app.delete('/api/boards/:id', (req, res) => {
  const boardId = req.params.id;
  const board = store.boards.get(boardId);
  if (!board) {
    res.status(404).json({ error: 'Board not found' });
    return;
  }
  board.cardOrder.forEach((cardId) => store.cards.delete(cardId));
  store.boards.delete(boardId);
  res.status(204).send();
});

app.post('/api/boards/:boardId/cards', (req, res) => {
  const board = store.boards.get(req.params.boardId);
  if (!board) {
    res.status(404).json({ error: 'Board not found' });
    return;
  }
  const { name, sourceUrl, coverImage, tags, difficulty, notes } = req.body;
  const card: RecipeCard = {
    id: uuidv4(),
    name,
    sourceUrl,
    coverImage,
    tags: tags || [],
    difficulty: difficulty || 0,
    notes: notes || '',
    order: board.cardOrder.length,
    boardId: board.id,
  };
  store.cards.set(card.id, card);
  board.cardOrder.push(card.id);
  res.status(201).json(card);
});

app.put('/api/cards/:id', (req, res) => {
  const card = store.cards.get(req.params.id);
  if (!card) {
    res.status(404).json({ error: 'Card not found' });
    return;
  }
  const { name, sourceUrl, coverImage, tags, difficulty, notes } = req.body;
  if (name !== undefined) card.name = name;
  if (sourceUrl !== undefined) card.sourceUrl = sourceUrl;
  if (coverImage !== undefined) card.coverImage = coverImage;
  if (tags !== undefined) card.tags = tags;
  if (difficulty !== undefined) card.difficulty = difficulty;
  if (notes !== undefined) card.notes = notes;
  res.json(card);
});

app.delete('/api/cards/:id', (req, res) => {
  const card = store.cards.get(req.params.id);
  if (!card) {
    res.status(404).json({ error: 'Card not found' });
    return;
  }
  const board = store.boards.get(card.boardId);
  if (board) {
    board.cardOrder = board.cardOrder.filter((id) => id !== card.id);
  }
  store.cards.delete(card.id);
  res.status(204).send();
});

app.post('/api/cards/:id/move', (req, res) => {
  const card = store.cards.get(req.params.id);
  if (!card) {
    res.status(404).json({ error: 'Card not found' });
    return;
  }
  const { toBoardId, newIndex } = req.body;
  const fromBoard = store.boards.get(card.boardId);
  const toBoard = store.boards.get(toBoardId);
  if (!toBoard) {
    res.status(404).json({ error: 'Target board not found' });
    return;
  }

  if (fromBoard) {
    fromBoard.cardOrder = fromBoard.cardOrder.filter((id) => id !== card.id);
  }

  card.boardId = toBoardId;
  toBoard.cardOrder.splice(newIndex, 0, card.id);
  toBoard.cardOrder.forEach((id, idx) => {
    const c = store.cards.get(id);
    if (c) c.order = idx;
  });

  res.json({ card, fromBoardId: fromBoard?.id, toBoardId });
});

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

const wss = new WebSocketServer({ server, path: '/ws' });
let clientCounter = 0;

wss.on('connection', (ws: WebSocket & { id?: string }) => {
  clientCounter++;
  ws.id = `client-${clientCounter}`;
  console.log(`Client ${ws.id} connected`);

  ws.on('message', (data) => {
    try {
      const action: WsAction = JSON.parse(data.toString());
      broadcast(wss, action, ws.id);
    } catch (e) {
      console.error('Invalid message:', e);
    }
  });

  ws.on('close', () => {
    console.log(`Client ${ws.id} disconnected`);
  });
});

console.log('WebSocket server ready');
