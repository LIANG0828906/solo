import { WebSocketServer, WebSocket } from 'ws';
import { roomManager } from './roomManager';
import { StrokeData } from '../src/components/Canvas';

interface IncomingMessage {
  type: string;
  userId: string;
  roomCode?: string;
  data?: StrokeData;
  targetUserId?: string;
}

const PORT = 8080;

const wss = new WebSocketServer({ port: PORT });

console.log(`[RhythmCanvas] WebSocket server running on ws://localhost:${PORT}`);

wss.on('connection', (ws: WebSocket) => {
  console.log('[RhythmCanvas] Client connected');

  ws.on('message', (raw) => {
    let msg: IncomingMessage;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    switch (msg.type) {
      case 'create_room': {
        const code = roomManager.createRoom(msg.userId, ws);
        ws.send(JSON.stringify({
          type: 'room_created',
          roomCode: code,
          isHost: true,
        }));
        console.log(`[RhythmCanvas] Room created: ${code} by ${msg.userId}`);
        break;
      }

      case 'join_room': {
        if (!msg.roomCode) return;
        const result = roomManager.joinRoom(msg.roomCode, msg.userId, ws);
        if (!result.success) {
          ws.send(JSON.stringify({
            type: 'error',
            message: result.error,
          }));
          return;
        }
        ws.send(JSON.stringify({
          type: 'room_joined',
          roomCode: msg.roomCode,
          users: result.users,
          isHost: false,
        }));
        roomManager.broadcast(msg.roomCode, msg.userId, {
          type: 'user_joined',
          userId: msg.userId,
        });
        console.log(`[RhythmCanvas] User ${msg.userId} joined room ${msg.roomCode}`);
        break;
      }

      case 'stroke': {
        if (!msg.roomCode || !msg.data) return;
        roomManager.broadcast(msg.roomCode, msg.userId, {
          type: 'remote_stroke',
          userId: msg.userId,
          data: msg.data,
        });
        break;
      }

      case 'stroke_end': {
        if (!msg.roomCode) return;
        roomManager.broadcast(msg.roomCode, msg.userId, {
          type: 'remote_stroke_end',
          userId: msg.userId,
        });
        break;
      }

      case 'clear_canvas': {
        if (!msg.roomCode) return;
        const ok = roomManager.clearCanvas(msg.roomCode, msg.userId);
        if (ok) {
          roomManager.broadcast(msg.roomCode, null, {
            type: 'canvas_cleared',
          });
          console.log(`[RhythmCanvas] Canvas cleared in room ${msg.roomCode}`);
        }
        break;
      }

      case 'kick_user': {
        if (!msg.roomCode || !msg.targetUserId) return;
        const ok = roomManager.kickUser(msg.roomCode, msg.userId, msg.targetUserId);
        if (ok) {
          roomManager.broadcast(msg.roomCode, null, {
            type: 'user_left',
            userId: msg.targetUserId,
          });
          console.log(`[RhythmCanvas] User ${msg.targetUserId} kicked from room ${msg.roomCode}`);
        }
        break;
      }
    }
  });

  ws.on('close', () => {
    const { roomCode, userId } = roomManager.removeUserByWs(ws);
    if (roomCode && userId) {
      roomManager.broadcast(roomCode, null, {
        type: 'user_left',
        userId,
      });
      console.log(`[RhythmCanvas] User ${userId} disconnected from room ${roomCode}`);
    } else {
      console.log('[RhythmCanvas] Client disconnected');
    }
  });
});
