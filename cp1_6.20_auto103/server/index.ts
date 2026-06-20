import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';
import { canvasManager, generateAnonymousUser, DrawPath, Note } from './canvasManager';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(cors());
app.use(bodyParser.json());

app.get('/api/canvas', (_req, res) => {
  res.json(canvasManager.getState());
});

app.get('/api/users', (_req, res) => {
  res.json(canvasManager.getUsers());
});

wss.on('connection', (ws) => {
  const userId = uuidv4();
  const { username, color } = generateAnonymousUser();

  canvasManager.addUser({ id: userId, username, color, ws });

  canvasManager.sendToUser(userId, {
    type: 'init',
    data: {
      selfId: userId,
      selfUsername: username,
      selfColor: color,
      ...canvasManager.getState()
    }
  });

  ws.on('message', (raw) => {
    try {
      const message = JSON.parse(raw.toString());
      handleMessage(userId, username, color, message);
    } catch (e) {
      console.error('Failed to parse message', e);
    }
  });

  ws.on('close', () => {
    canvasManager.removeUser(userId);
  });

  ws.on('error', (err) => {
    console.error('WebSocket error for user', userId, err);
    canvasManager.removeUser(userId);
  });
});

function handleMessage(userId: string, username: string, userColor: string, message: any): void {
  switch (message.type) {
    case 'draw': {
      const pathData = message.data as Omit<DrawPath, 'id' | 'userId' | 'likes' | 'comments' | 'type'>;
      const path: DrawPath = {
        id: uuidv4(),
        type: 'path',
        points: pathData.points,
        color: pathData.color || userColor,
        width: pathData.width || 4,
        userId,
        likes: [],
        comments: []
      };
      canvasManager.addElement(path);
      break;
    }

    case 'addNote': {
      const noteData = message.data as Partial<Note>;
      const note: Note = {
        id: uuidv4(),
        type: 'note',
        x: noteData.x || 100,
        y: noteData.y || 100,
        width: noteData.width || 150,
        height: noteData.height || 150,
        text: noteData.text || '',
        color: noteData.color || '#ffd700',
        userId,
        likes: [],
        comments: []
      };
      canvasManager.addElement(note);
      break;
    }

    case 'updateNote': {
      const { id, ...updates } = message.data;
      canvasManager.updateElement(id, updates);
      break;
    }

    case 'like': {
      const { elementId } = message.data;
      canvasManager.likeElement(elementId, userId);
      break;
    }

    case 'comment': {
      const { elementId, text } = message.data;
      canvasManager.addComment(elementId, userId, username, text);
      break;
    }

    default:
      console.warn('Unknown message type:', message.type);
  }
}

const PORT = process.env.PORT || 40080;

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket path: /ws`);
});
