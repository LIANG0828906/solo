import express, { Request, Response } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import { v4 as uuidv4 } from 'uuid';
import type {
  Task,
  ColumnData,
  ClientMessage,
  ServerMessage,
  Priority,
} from '../client/types';

const DEFAULT_COLUMNS: ColumnData[] = [
  { id: 'todo', title: '待办' },
  { id: 'in-progress', title: '进行中' },
  { id: 'done', title: '已完成' },
];

let tasks: Task[] = [
  {
    id: uuidv4(),
    title: '设计产品原型',
    priority: 'high',
    columnId: 'todo',
    createdAt: Date.now() - 86400000,
  },
  {
    id: uuidv4(),
    title: '撰写需求文档',
    priority: 'medium',
    columnId: 'todo',
    createdAt: Date.now() - 43200000,
  },
  {
    id: uuidv4(),
    title: '搭建项目脚手架',
    priority: 'high',
    columnId: 'in-progress',
    createdAt: Date.now() - 21600000,
  },
  {
    id: uuidv4(),
    title: '初始化代码仓库',
    priority: 'low',
    columnId: 'done',
    createdAt: Date.now() - 172800000,
  },
];

const columns: ColumnData[] = DEFAULT_COLUMNS;

const app = express();
app.get('/', (_req: Request, res: Response) => {
  res.send('Kanban WebSocket Server is running.');
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

function sendMessage(ws: WebSocket, msg: ServerMessage) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

function broadcast(msg: ServerMessage) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(msg));
    }
  });
}

function sendState(ws: WebSocket) {
  sendMessage(ws, {
    type: 'STATE',
    payload: { tasks: [...tasks], columns: [...columns] },
  });
}

wss.on('connection', (ws: WebSocket) => {
  console.log(`[WS] Client connected. Total: ${wss.clients.size}`);
  sendState(ws);

  ws.on('message', (raw: Buffer) => {
    try {
      const data: ClientMessage = JSON.parse(raw.toString());
      handleMessage(ws, data);
    } catch (err) {
      console.error('[WS] Parse error:', err);
    }
  });

  ws.on('close', () => {
    console.log(`[WS] Client disconnected. Total: ${wss.clients.size}`);
  });
});

function handleMessage(ws: WebSocket, msg: ClientMessage) {
  switch (msg.type) {
    case 'REQUEST_STATE': {
      sendState(ws);
      break;
    }
    case 'ADD_TASK': {
      const { title, priority, columnId } = msg.payload;
      if (!title || !priority || !columnId) return;
      const newTask: Task = {
        id: uuidv4(),
        title: title.trim(),
        priority: priority as Priority,
        columnId,
        createdAt: Date.now(),
      };
      tasks.push(newTask);
      broadcast({ type: 'TASK_ADDED', payload: newTask });
      break;
    }
    case 'DELETE_TASK': {
      const { taskId } = msg.payload;
      tasks = tasks.filter((t) => t.id !== taskId);
      broadcast({ type: 'TASK_DELETED', payload: { taskId } });
      break;
    }
    case 'UPDATE_TASK_TITLE': {
      const { taskId, title } = msg.payload;
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;
      task.title = title.trim();
      broadcast({ type: 'TASK_UPDATED', payload: { id: taskId, title: task.title } });
      break;
    }
    case 'UPDATE_TASK_PRIORITY': {
      const { taskId, priority } = msg.payload;
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;
      task.priority = priority;
      broadcast({ type: 'TASK_UPDATED', payload: { id: taskId, priority } });
      break;
    }
    case 'MOVE_TASK': {
      const { taskId, toColumnId, newIndex } = msg.payload;
      const taskIndex = tasks.findIndex((t) => t.id === taskId);
      if (taskIndex === -1) return;
      const [task] = tasks.splice(taskIndex, 1);
      task.columnId = toColumnId;
      const colTasks = tasks.filter((t) => t.columnId === toColumnId);
      const insertIdx = Math.max(0, Math.min(newIndex, colTasks.length));
      const before = tasks.filter((t) => t.columnId !== toColumnId);
      colTasks.splice(insertIdx, 0, task);
      tasks = [...before, ...colTasks];
      broadcast({ type: 'TASK_MOVED', payload: { taskId, toColumnId, newIndex: insertIdx } });
      break;
    }
  }
}

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`[Server] HTTP+WS listening on http://localhost:${PORT}`);
});
