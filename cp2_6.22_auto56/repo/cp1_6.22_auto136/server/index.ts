import express, { Request, Response } from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import {
  BoardData,
  BoardColumn,
  TaskCard,
  WSMessage,
  WSMessageType,
  OnlineUser,
} from '../src/types';

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

const createInitialData = (): BoardData => {
  const card1Id = `card-${uuidv4()}`;
  const card2Id = `card-${uuidv4()}`;
  const card3Id = `card-${uuidv4()}`;
  const card4Id = `card-${uuidv4()}`;

  return {
    columns: [
      { id: 'col-todo', title: '待办', cardIds: [card1Id, card2Id] },
      { id: 'col-progress', title: '进行中', cardIds: [card3Id] },
      { id: 'col-done', title: '已完成', cardIds: [card4Id] },
    ],
    columnOrder: ['col-todo', 'col-progress', 'col-done'],
    cards: {
      [card1Id]: {
        id: card1Id,
        title: '设计登录页面',
        description:
          '完成登录页面UI设计\n包括表单验证和响应式布局适配\n需支持移动端和桌面端两种尺寸',
        assignee: '张三',
        dueDate: '2026-06-25',
        createdAt: new Date().toISOString(),
      },
      [card2Id]: {
        id: card2Id,
        title: '修复用户列表Bug',
        description: '用户列表分页异常，需要排查后端接口返回数据格式',
        assignee: '李四',
        dueDate: '2026-06-20',
        createdAt: new Date().toISOString(),
      },
      [card3Id]: {
        id: card3Id,
        title: '实现搜索功能',
        description:
          '全文检索支持\n模糊匹配用户和订单\n优化数据库查询性能',
        assignee: '王五',
        dueDate: '2026-06-30',
        createdAt: new Date().toISOString(),
      },
      [card4Id]: {
        id: card4Id,
        title: '项目初始化配置',
        description: '完成项目脚手架搭建，配置TypeScript和ESLint',
        assignee: '赵六',
        dueDate: '2026-06-15',
        createdAt: new Date().toISOString(),
      },
    },
  };
};

let boardData: BoardData = createInitialData();

const onlineUsers: Map<string, OnlineUser> = new Map();

function broadcastMessage(
  wss: WebSocketServer,
  type: WSMessageType,
  payload: any,
  excludeSenderId?: string
) {
  const message: WSMessage = {
    type,
    payload,
    timestamp: Date.now(),
  };
  const data = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      const clientId = (client as any).clientId;
      if (excludeSenderId && clientId === excludeSenderId) return;
      client.send(data);
    }
  });
}

function getOnlineCount(): number {
  return onlineUsers.size;
}

app.get('/api/board', (_req: Request, res: Response) => {
  res.json({
    ...boardData,
    onlineCount: getOnlineCount(),
  });
});

app.post('/api/columns', (req: Request, res: Response) => {
  const { title } = req.body;
  if (!title || typeof title !== 'string') {
    return res.status(400).json({ error: '列标题不能为空' });
  }

  const columnId = `col-${uuidv4()}`;
  const newColumn: BoardColumn = {
    id: columnId,
    title: title.trim(),
    cardIds: [],
  };

  boardData.columns.push(newColumn);
  boardData.columnOrder.push(columnId);

  res.status(201).json(newColumn);
});

app.put('/api/columns/:columnId', (req: Request, res: Response) => {
  const { columnId } = req.params;
  const { title } = req.body;

  const column = boardData.columns.find((c) => c.id === columnId);
  if (!column) {
    return res.status(404).json({ error: '列不存在' });
  }

  if (title && typeof title === 'string') {
    column.title = title.trim();
  }

  res.json(column);
});

app.delete('/api/columns/:columnId', (req: Request, res: Response) => {
  const { columnId } = req.params;
  const columnIndex = boardData.columns.findIndex((c) => c.id === columnId);

  if (columnIndex === -1) {
    return res.status(404).json({ error: '列不存在' });
  }

  const column = boardData.columns[columnIndex];
  column.cardIds.forEach((cardId) => {
    delete boardData.cards[cardId];
  });

  boardData.columns.splice(columnIndex, 1);
  const orderIndex = boardData.columnOrder.indexOf(columnId);
  if (orderIndex !== -1) {
    boardData.columnOrder.splice(orderIndex, 1);
  }

  res.json({ success: true });
});

app.post('/api/columns/:columnId/cards', (req: Request, res: Response) => {
  const { columnId } = req.params;
  const { title, description, assignee, dueDate } = req.body;

  const column = boardData.columns.find((c) => c.id === columnId);
  if (!column) {
    return res.status(404).json({ error: '列不存在' });
  }

  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: '卡片标题不能为空' });
  }

  const cardId = `card-${uuidv4()}`;
  const newCard: TaskCard = {
    id: cardId,
    title: title.trim(),
    description: description ? description.trim() : '',
    assignee: assignee ? assignee.trim() : '',
    dueDate: dueDate || '',
    createdAt: new Date().toISOString(),
  };

  boardData.cards[cardId] = newCard;
  column.cardIds.push(cardId);

  res.status(201).json(newCard);
});

app.put('/api/cards/:cardId', (req: Request, res: Response) => {
  const { cardId } = req.params;
  const { title, description, assignee, dueDate } = req.body;

  const card = boardData.cards[cardId];
  if (!card) {
    return res.status(404).json({ error: '卡片不存在' });
  }

  if (title !== undefined) card.title = title.trim();
  if (description !== undefined) card.description = description.trim();
  if (assignee !== undefined) card.assignee = assignee.trim();
  if (dueDate !== undefined) card.dueDate = dueDate;

  res.json(card);
});

app.delete('/api/cards/:cardId', (req: Request, res: Response) => {
  const { cardId } = req.params;
  const card = boardData.cards[cardId];

  if (!card) {
    return res.status(404).json({ error: '卡片不存在' });
  }

  delete boardData.cards[cardId];
  boardData.columns.forEach((col) => {
    const idx = col.cardIds.indexOf(cardId);
    if (idx !== -1) {
      col.cardIds.splice(idx, 1);
    }
  });

  res.json({ success: true });
});

app.post('/api/reorder', (req: Request, res: Response) => {
  const { source, destination, draggableId, type } = req.body;

  if (!source || !destination) {
    return res.status(400).json({ error: '参数不完整' });
  }

  if (type === 'column') {
    const startIndex = source.index;
    const endIndex = destination.index;
    const [removed] = boardData.columnOrder.splice(startIndex, 1);
    boardData.columnOrder.splice(endIndex, 0, removed);
  } else {
    const startColId = source.droppableId;
    const endColId = destination.droppableId;
    const startIndex = source.index;
    const endIndex = destination.index;

    const startCol = boardData.columns.find((c) => c.id === startColId);
    const endCol = boardData.columns.find((c) => c.id === endColId);

    if (!startCol || !endCol) {
      return res.status(404).json({ error: '列不存在' });
    }

    const [movedCardId] = startCol.cardIds.splice(startIndex, 1);
    endCol.cardIds.splice(endIndex, 0, movedCardId);
  }

  res.json({ success: true });
});

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws: WebSocket) => {
  const clientId = uuidv4();
  (ws as any).clientId = clientId;

  onlineUsers.set(clientId, {
    id: clientId,
    connectedAt: Date.now(),
  });

  ws.send(
    JSON.stringify({
      type: 'SYNC_STATE',
      payload: {
        boardData,
        clientId,
        onlineCount: getOnlineCount(),
      },
      timestamp: Date.now(),
    } as WSMessage)
  );

  broadcastMessage(wss, 'USER_CONNECTED', {
    userId: clientId,
    onlineCount: getOnlineCount(),
  });

  ws.on('message', (data) => {
    try {
      const msg: WSMessage = JSON.parse(data.toString());

      switch (msg.type) {
        case 'BOARD_UPDATED':
        case 'COLUMN_CREATED':
        case 'COLUMN_RENAMED':
        case 'CARD_CREATED':
        case 'CARD_UPDATED':
        case 'CARD_DELETED':
        case 'CARDS_REORDERED':
          broadcastMessage(wss, msg.type, msg.payload, clientId);
          break;
      }
    } catch (e) {
      console.error('Failed to parse WS message:', e);
    }
  });

  ws.on('close', () => {
    onlineUsers.delete(clientId);
    broadcastMessage(wss, 'USER_DISCONNECTED', {
      userId: clientId,
      onlineCount: getOnlineCount(),
    });
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });
});

console.log(`WebSocket server ready on ws://localhost:${PORT}/ws`);
