import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { createServer } from 'http';

interface WordEntry {
  id: string;
  text: string;
  userId: string;
  likes: number;
  dislikes: number;
  hue: number;
  addedAt: number;
  removed: boolean;
}

interface User {
  id: string;
  nickname: string;
  online: boolean;
  wordCount: number;
}

interface ChatMessage {
  id: string;
  userId: string;
  nickname: string;
  text: string;
  timestamp: number;
}

interface Client {
  ws: WebSocket;
  userId: string;
  nickname: string;
}

const words: WordEntry[] = [];
const users: Map<string, User> = new Map();
const messages: ChatMessage[] = [];
const clients: Map<string, Client> = new Map();

const app = express();
app.use(express.static('dist'));

const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

function broadcast(data: object, exclude?: string) {
  const msg = JSON.stringify(data);
  for (const [id, client] of clients) {
    if (id !== exclude && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(msg);
    }
  }
}

function getUserWordCount(userId: string): number {
  return words.filter(w => w.userId === userId && !w.removed).length;
}

function broadcastUserList() {
  const userList = Array.from(users.values());
  broadcast({ type: 'user_list', users: userList });
}

wss.on('connection', (ws) => {
  let currentUserId = '';

  ws.on('message', (raw) => {
    let msg: any;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    switch (msg.type) {
      case 'join': {
        currentUserId = msg.userId || uuidv4();
        const nickname = msg.nickname || '诗友';

        clients.set(currentUserId, { ws, userId: currentUserId, nickname });

        const existing = users.get(currentUserId);
        if (existing) {
          existing.online = true;
          existing.nickname = nickname;
        } else {
          users.set(currentUserId, {
            id: currentUserId,
            nickname,
            online: true,
            wordCount: 0,
          });
        }

        ws.send(JSON.stringify({
          type: 'init',
          words: words.filter(w => !w.removed),
          users: Array.from(users.values()),
          messages: messages.slice(-50),
        }));

        broadcastUserList();
        break;
      }

      case 'add_word': {
        const text = (msg.text || '').trim();
        if (!text || text.length > 10) return;

        const wordId = msg.wordId || uuidv4();
        const hue = msg.hue ?? Math.floor(Math.random() * 360);

        const entry: WordEntry = {
          id: wordId,
          text,
          userId: msg.userId || currentUserId,
          likes: 0,
          dislikes: 0,
          hue,
          addedAt: Date.now(),
          removed: false,
        };
        words.push(entry);

        const uid = msg.userId || currentUserId;
        const user = users.get(uid);
        if (user) {
          user.wordCount = getUserWordCount(uid);
        }

        broadcast({ type: 'add_word', wordId, text, userId: uid, hue });
        broadcastUserList();
        break;
      }

      case 'like_word': {
        const word = words.find(w => w.id === msg.wordId && !w.removed);
        if (!word) return;
        word.likes++;
        broadcast({ type: 'word_update', word });
        break;
      }

      case 'dislike_word': {
        const word = words.find(w => w.id === msg.wordId && !w.removed);
        if (!word) return;
        word.dislikes++;

        if (word.dislikes >= 3) {
          word.removed = true;
          broadcast({ type: 'word_removed', wordId: word.id });

          const uid = word.userId;
          const user = users.get(uid);
          if (user) {
            user.wordCount = getUserWordCount(uid);
            broadcastUserList();
          }
        } else {
          broadcast({ type: 'word_update', word });
        }
        break;
      }

      case 'chat': {
        const text = (msg.text || '').trim();
        if (!text) return;

        const chatMsg: ChatMessage = {
          id: uuidv4(),
          userId: msg.userId || currentUserId,
          nickname: msg.nickname || '诗友',
          text,
          timestamp: Date.now(),
        };
        messages.push(chatMsg);
        if (messages.length > 100) messages.shift();

        broadcast({ type: 'new_chat', message: chatMsg });
        break;
      }
    }
  });

  ws.on('close', () => {
    if (currentUserId) {
      clients.delete(currentUserId);
      const user = users.get(currentUserId);
      if (user) {
        user.online = false;
      }
      broadcast({ type: 'leave', userId: currentUserId });
      broadcastUserList();
    }
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`🚀 词云诗会服务端已启动: ws://localhost:${PORT}/ws`);
  console.log(`📦 静态文件服务: http://localhost:${PORT}`);
});
