import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { v4 as uuidv4 } from 'uuid';
import {
  getAllBoards,
  getBoardById,
  createBoard,
  createTask,
  updateTaskStatus,
  addComment,
  getTaskComments,
  addOnlineUser,
  removeOnlineUser,
  getOnlineUsers,
  MEMBERS,
} from './dataStore.js';

const app = express();
app.use(cors());
app.use(express.json());

const server = createServer(app);

const wss = new WebSocketServer({ server, path: '/ws' });

const boardClients = new Map<string, Set<{ ws: WebSocket; username: string }>>();

function broadcastToBoard(boardId: string, message: object, excludeWs?: WebSocket) {
  const clients = boardClients.get(boardId);
  if (!clients) return;
  const data = JSON.stringify(message);
  clients.forEach(({ ws }) => {
    if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  });
}

wss.on('connection', (ws) => {
  let currentBoardId: string | null = null;
  let currentUsername: string = '';

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.type === 'join' && msg.boardId && msg.username) {
        currentBoardId = msg.boardId;
        currentUsername = msg.username;
        if (!boardClients.has(currentBoardId)) {
          boardClients.set(currentBoardId, new Set());
        }
        boardClients.get(currentBoardId)!.add({ ws, username: currentUsername });
        addOnlineUser(currentBoardId, currentUsername);
        broadcastToBoard(currentBoardId, {
          type: 'online-users',
          users: getOnlineUsers(currentBoardId),
        });
      }
      if (msg.type === 'leave' && currentBoardId) {
        removeOnlineUser(currentBoardId, currentUsername);
        const clients = boardClients.get(currentBoardId);
        if (clients) {
          clients.delete({ ws, username: currentUsername });
        }
        broadcastToBoard(currentBoardId, {
          type: 'online-users',
          users: getOnlineUsers(currentBoardId),
        });
        currentBoardId = null;
      }
    } catch {}
  });

  ws.on('close', () => {
    if (currentBoardId && currentUsername) {
      removeOnlineUser(currentBoardId, currentUsername);
      const clients = boardClients.get(currentBoardId);
      if (clients) {
        clients.forEach((c) => {
          if (c.ws === ws) clients.delete(c);
        });
      }
      broadcastToBoard(currentBoardId, {
        type: 'online-users',
        users: getOnlineUsers(currentBoardId),
      });
    }
  });
});

app.get('/api/boards', (_req, res) => {
  const boards = getAllBoards().map((b) => ({
    id: b.id,
    name: b.name,
    description: b.description,
    taskCount: b.tasks.length,
  }));
  res.json(boards);
});

app.get('/api/boards/:id', (req, res) => {
  const board = getBoardById(req.params.id);
  if (!board) return res.status(404).json({ error: 'Board not found' });
  res.json(board);
});

app.post('/api/boards', (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const board = createBoard(name, description || '');
  res.status(201).json(board);
});

app.post('/api/boards/:id/tasks', (req, res) => {
  const { title, description, assignee } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });
  const task = createTask(req.params.id, title, description || '', assignee || MEMBERS[0]);
  if (!task) return res.status(404).json({ error: 'Board not found' });
  broadcastToBoard(req.params.id, { type: 'task-created', task });
  res.status(201).json(task);
});

app.patch('/api/boards/:id/tasks/:taskId', (req, res) => {
  const { status } = req.body;
  const task = updateTaskStatus(req.params.id, req.params.taskId, status);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  broadcastToBoard(req.params.id, { type: 'task-updated', task });
  res.json(task);
});

app.post('/api/boards/:id/tasks/:taskId/comments', (req, res) => {
  const { username, content } = req.body;
  if (!username || !content) return res.status(400).json({ error: 'Username and content required' });
  const comment = addComment(req.params.id, req.params.taskId, username, content);
  if (!comment) return res.status(404).json({ error: 'Task not found' });
  broadcastToBoard(req.params.id, { type: 'comment-added', taskId: req.params.taskId, comment });
  res.status(201).json(comment);
});

app.get('/api/boards/:id/tasks/:taskId/comments', (req, res) => {
  const comments = getTaskComments(req.params.id, req.params.taskId);
  if (!comments) return res.status(404).json({ error: 'Task not found' });
  res.json(comments);
});

app.get('/api/members', (_req, res) => {
  res.json(MEMBERS);
});

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
