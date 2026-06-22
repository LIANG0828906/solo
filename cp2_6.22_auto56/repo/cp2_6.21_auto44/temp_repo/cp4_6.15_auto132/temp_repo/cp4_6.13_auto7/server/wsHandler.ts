import { WebSocketServer, WebSocket } from 'ws';

interface ChatMessage {
  id: string;
  senderId: string;
  type: 'text' | 'emoji' | 'image';
  content: string;
  createdAt: number;
  readBy: string[];
}

interface Chat {
  id: string;
  requestId: string;
  participants: string[];
  expiresAt: number;
  messages: ChatMessage[];
}

interface Stores {
  users: Map<string, any>;
  meals: Map<string, any>;
  chats: Map<string, Chat>;
  matchRequests: Map<string, any>;
  wsConnections: Map<string, WebSocket>;
}

type WSClientMessage =
  | { type: 'CONNECT_USER'; userId: string }
  | { type: 'JOIN_CHAT'; chatId: string; userId: string }
  | { type: 'SEND_MESSAGE'; chatId: string; senderId: string; content: { type: 'text' | 'emoji' | 'image'; text?: string; emoji?: string; imageUrl?: string } }
  | { type: 'MARK_READ'; chatId: string; userId: string; messageId: string }
  | { type: 'LEAVE_CHAT'; chatId: string; userId: string };

type WSServerMessage =
  | { type: 'MEAL_PUSH'; meal: any; matchScore: number }
  | { type: 'NEW_MESSAGE'; chatId: string; message: ChatMessage }
  | { type: 'MESSAGE_READ'; chatId: string; messageId: string; readerId: string }
  | { type: 'MATCH_REQUEST'; request: any }
  | { type: 'REQUEST_ACCEPTED'; chatId: string; partner: any }
  | { type: 'NOTIFICATION'; title: string; body: string };

export function setupWebSocket(server: any, stores: Stores) {
  const wss = new WebSocketServer({ server });
  const userConnections = new Map<string, WebSocket>();
  const chatRooms = new Map<string, Set<string>>();
  const heartbeatInterval = new Map<WebSocket, NodeJS.Timeout>();

  function sendToUser(userId: string, messageObj: WSServerMessage) {
    const ws = userConnections.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(messageObj));
    }
  }

  function broadcastToChat(chatId: string, messageObj: WSServerMessage, excludeUserId?: string) {
    const room = chatRooms.get(chatId);
    if (!room) return;
    for (const userId of room) {
      if (excludeUserId && userId === excludeUserId) continue;
      sendToUser(userId, messageObj);
    }
  }

  function startHeartbeat(ws: WebSocket) {
    const interval = setInterval(() => {
      if (ws.readyState !== WebSocket.OPEN) {
        clearInterval(interval);
        heartbeatInterval.delete(ws);
        return;
      }
      ws.ping();
    }, 30000);
    heartbeatInterval.set(ws, interval);
  }

  function handleDisconnect(ws: WebSocket) {
    const interval = heartbeatInterval.get(ws);
    if (interval) {
      clearInterval(interval);
      heartbeatInterval.delete(ws);
    }
    for (const [userId, conn] of userConnections) {
      if (conn === ws) {
        userConnections.delete(userId);
        stores.wsConnections.delete(userId);
        for (const [chatId, room] of chatRooms) {
          room.delete(userId);
        }
        break;
      }
    }
  }

  function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  wss.on('connection', (ws) => {
    startHeartbeat(ws);

    ws.on('message', (data) => {
      let message: WSClientMessage;
      try {
        message = JSON.parse(data.toString());
      } catch {
        return;
      }

      switch (message.type) {
        case 'CONNECT_USER': {
          userConnections.set(message.userId, ws);
          stores.wsConnections.set(message.userId, ws);
          break;
        }
        case 'JOIN_CHAT': {
          const { chatId, userId } = message;
          if (!chatRooms.has(chatId)) {
            chatRooms.set(chatId, new Set());
          }
          chatRooms.get(chatId)!.add(userId);
          break;
        }
        case 'SEND_MESSAGE': {
          const { chatId, senderId, content } = message;
          const chat = stores.chats.get(chatId);
          if (!chat) break;

          let messageContent = '';
          let messageType: 'text' | 'emoji' | 'image' = 'text';
          if (content.type === 'text' && content.text) {
            messageContent = content.text;
            messageType = 'text';
          } else if (content.type === 'emoji' && content.emoji) {
            messageContent = content.emoji;
            messageType = 'emoji';
          } else if (content.type === 'image' && content.imageUrl) {
            messageContent = content.imageUrl;
            messageType = 'image';
          }

          const newMessage: ChatMessage = {
            id: generateUUID(),
            senderId,
            type: messageType,
            content: messageContent,
            createdAt: Date.now(),
            readBy: [senderId],
          };

          chat.messages.push(newMessage);

          broadcastToChat(chatId, {
            type: 'NEW_MESSAGE',
            chatId,
            message: newMessage,
          });
          break;
        }
        case 'MARK_READ': {
          const { chatId, userId, messageId } = message;
          const chat = stores.chats.get(chatId);
          if (!chat) break;

          const msg = chat.messages.find((m) => m.id === messageId);
          if (msg && !msg.readBy.includes(userId)) {
            msg.readBy.push(userId);
            sendToUser(msg.senderId, {
              type: 'MESSAGE_READ',
              chatId,
              messageId,
              readerId: userId,
            });
          }
          break;
        }
        case 'LEAVE_CHAT': {
          const { chatId, userId } = message;
          const room = chatRooms.get(chatId);
          if (room) {
            room.delete(userId);
          }
          break;
        }
      }
    });

    ws.on('close', () => {
      handleDisconnect(ws);
    });

    ws.on('error', () => {
      handleDisconnect(ws);
    });

    ws.on('pong', () => {});
  });

  return {
    sendToUser,
    broadcastToChat,
    userConnections,
    chatRooms,
  };
}

export type { WSServerMessage, WSClientMessage };
