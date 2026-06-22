import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import { v4 as uuidv4 } from 'uuid';

interface OnlineUser {
  userId: string;
  nickname: string;
  status: 'working' | 'resting' | 'away';
  ws: WebSocket;
}

interface UserState {
  userId: string;
  nickname: string;
  status: 'working' | 'resting' | 'away';
}

interface WSMessage {
  type: 'join' | 'status_change' | 'user_list' | 'notification' | 'user_left';
  payload: {
    userId?: string;
    nickname?: string;
    status?: 'working' | 'resting' | 'away';
    users?: UserState[];
    message?: string;
  };
}

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

const onlineUsers = new Map<string, OnlineUser>();

const STATUS_LABELS: Record<string, string> = {
  working: '工作中',
  resting: '休息中',
  away: '离开中',
};

function broadcast(message: WSMessage, excludeUserId?: string) {
  const data = JSON.stringify(message);
  onlineUsers.forEach((user) => {
    if (user.userId !== excludeUserId && user.ws.readyState === WebSocket.OPEN) {
      user.ws.send(data);
    }
  });
}

function sendUserList(ws: WebSocket) {
  const users: UserState[] = Array.from(onlineUsers.values()).map((u) => ({
    userId: u.userId,
    nickname: u.nickname,
    status: u.status,
  }));
  const msg: WSMessage = { type: 'user_list', payload: { users } };
  ws.send(JSON.stringify(msg));
}

wss.on('connection', (ws) => {
  let currentUserId: string | null = null;

  ws.on('message', (raw) => {
    try {
      const message: WSMessage = JSON.parse(raw.toString());

      if (message.type === 'join') {
        const nickname = message.payload.nickname?.trim() || '匿名用户';
        const userId = uuidv4();
        currentUserId = userId;

        onlineUsers.set(userId, {
          userId,
          nickname,
          status: 'working',
          ws,
        });

        const welcome: WSMessage = {
          type: 'join',
          payload: { userId, nickname, status: 'working' },
        };
        ws.send(JSON.stringify(welcome));

        sendUserList(ws);

        const notify: WSMessage = {
          type: 'notification',
          payload: { message: `${nickname} 加入了面板` },
        };
        broadcast(notify, userId);

        broadcast(
          {
            type: 'user_list',
            payload: {
              users: Array.from(onlineUsers.values()).map((u) => ({
                userId: u.userId,
                nickname: u.nickname,
                status: u.status,
              })),
            },
          },
          userId,
        );
      }

      if (message.type === 'status_change' && currentUserId) {
        const user = onlineUsers.get(currentUserId);
        if (user && message.payload.status) {
          user.status = message.payload.status;

          broadcast({
            type: 'user_list',
            payload: {
              users: Array.from(onlineUsers.values()).map((u) => ({
                userId: u.userId,
                nickname: u.nickname,
                status: u.status,
              })),
            },
          });

          broadcast({
            type: 'notification',
            payload: {
              message: `${user.nickname} 切换到了 ${STATUS_LABELS[user.status]} 状态`,
            },
          });
        }
      }
    } catch (err) {
      console.error('Parse message error:', err);
    }
  });

  ws.on('close', () => {
    if (currentUserId && onlineUsers.has(currentUserId)) {
      const user = onlineUsers.get(currentUserId);
      onlineUsers.delete(currentUserId);

      broadcast({
        type: 'user_left',
        payload: { userId: currentUserId },
      });

      if (user) {
        broadcast({
          type: 'notification',
          payload: { message: `${user.nickname} 离开了面板` },
        });
      }

      broadcast({
        type: 'user_list',
        payload: {
          users: Array.from(onlineUsers.values()).map((u) => ({
            userId: u.userId,
            nickname: u.nickname,
            status: u.status,
          })),
        },
      });
    }
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`WebSocket on ws://localhost:${PORT}/ws`);
});
