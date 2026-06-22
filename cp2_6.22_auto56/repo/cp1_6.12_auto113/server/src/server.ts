import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import {
  createCard,
  getCardById,
  getCardsByOwner,
  getCardsByGroup,
  updateCardGroup,
  addCardToCollection
} from './controllers/cardController';
import { CreateCardInput, WebSocketMessage } from '../../shared/types';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(cors());
app.use(express.json());

const clients = new Map<string, WebSocket>();

function broadcastToUser(userId: string, message: WebSocketMessage) {
  const ws = clients.get(userId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

wss.on('connection', (ws) => {
  const userId = uuidv4();
  clients.set(userId, ws);

  ws.on('message', (data) => {
    try {
      const message: WebSocketMessage = JSON.parse(data.toString());
      
      if (message.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
        return;
      }

      if (message.type === 'exchange') {
        const { fromCardId, toCardId, fromUserId, toUserId } = message.payload;
        const fromCard = getCardById(fromCardId);
        const toCard = getCardById(toCardId);

        if (fromCard && toCard) {
          const addedToFrom = addCardToCollection(toCard, fromUserId);
          const addedToTo = addCardToCollection(fromCard, toUserId);

          broadcastToUser(fromUserId, {
            type: 'exchange',
            payload: { card: addedToFrom, direction: 'received' }
          });

          broadcastToUser(toUserId, {
            type: 'exchange',
            payload: { card: addedToTo, direction: 'received' }
          });

          broadcastToUser(toUserId, {
            type: 'notification',
            payload: { message: '您收到了一张新名片！', cardId: fromCardId }
          });
        }
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    clients.delete(userId);
  });

  ws.send(JSON.stringify({ type: 'connected', payload: { userId } }));
});

app.post('/api/cards', (req, res) => {
  const input: CreateCardInput = req.body;
  const ownerId = req.headers['x-user-id'] as string || uuidv4();
  const card = createCard(input, ownerId);
  res.status(201).json({ card, ownerId });
});

app.get('/api/cards/:id', (req, res) => {
  const card = getCardById(req.params.id);
  if (!card) {
    res.status(404).json({ error: 'Card not found' });
    return;
  }
  res.json(card);
});

app.get('/api/cards', (req, res) => {
  const ownerId = req.headers['x-user-id'] as string;
  const group = req.query.group as string;
  
  if (!ownerId) {
    res.status(400).json({ error: 'User ID required' });
    return;
  }

  const cards = group 
    ? getCardsByGroup(ownerId, group)
    : getCardsByOwner(ownerId);
  
  res.json(cards);
});

app.patch('/api/cards/:id/group', (req, res) => {
  const { group } = req.body;
  const card = updateCardGroup(req.params.id, group);
  if (!card) {
    res.status(404).json({ error: 'Card not found' });
    return;
  }
  res.json(card);
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server ready`);
});
