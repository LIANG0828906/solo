import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { store } from './store';
import type { ClientEvent, ServerEvent } from '../../shared/types';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 3099;

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

io.on('connection', (socket) => {
  const userId = uuidv4();
  console.log(`[socket] user connected: ${userId}`);

  const initMsg: ServerEvent = {
    type: 'INIT_STATE',
    payload: {
      cards: store.getCards(),
      votes: store.getVotes(),
      userId,
    },
  };
  socket.emit('message', initMsg);

  socket.on('message', (evt: ClientEvent) => {
    try {
      switch (evt.type) {
        case 'ADD_CARD': {
          const card = store.addCard(evt.payload, userId);
          const msg: ServerEvent = { type: 'CARD_ADDED', payload: card };
          io.emit('message', msg);
          break;
        }
        case 'MOVE_CARD': {
          const { id, x, y } = evt.payload;
          const result = store.moveCard(id, x, y);
          if (result) {
            const msg: ServerEvent = {
              type: 'CARD_MOVED',
              payload: { id, x, y },
            };
            io.emit('message', msg);
          }
          break;
        }
        case 'UPDATE_CARD': {
          const { id, ...patch } = evt.payload;
          const result = store.updateCard(id, patch);
          if (result) {
            const msg: ServerEvent = {
              type: 'CARD_UPDATED',
              payload: result,
            };
            io.emit('message', msg);
          }
          break;
        }
        case 'UPDATE_CARD_PRIORITY': {
          const { id, priority } = evt.payload;
          const result = store.updateCard(id, { priority });
          if (result) {
            const msg: ServerEvent = {
              type: 'CARD_PRIORITY_UPDATED',
              payload: { id, priority },
            };
            io.emit('message', msg);
          }
          break;
        }
        case 'DELETE_CARD': {
          const deleted = store.deleteCard(evt.payload.id);
          if (deleted) {
            const msg: ServerEvent = {
              type: 'CARD_DELETED',
              payload: { id: evt.payload.id },
            };
            io.emit('message', msg);
          }
          break;
        }
        case 'TOGGLE_VOTE': {
          const result = store.toggleVote(evt.payload.cardId, userId);
          if (result) {
            const msg: ServerEvent = {
              type: 'VOTE_TOGGLED',
              payload: {
                cardId: evt.payload.cardId,
                userId,
                voted: result.voted,
                total: result.total,
              },
            };
            io.emit('message', msg);
          } else {
            const err: ServerEvent = {
              type: 'ERROR',
              payload: { message: '无法对自己创建的卡片投票' },
            };
            socket.emit('message', err);
          }
          break;
        }
      }
    } catch (e) {
      const err: ServerEvent = {
        type: 'ERROR',
        payload: { message: e instanceof Error ? e.message : 'Unknown error' },
      };
      socket.emit('message', err);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[socket] user disconnected: ${userId}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});
