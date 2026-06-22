import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { ClientMessage, ServerMessage, ChordOp, LyricOp, CursorPosition, User } from '../types';
import * as songStore from '../store/songStore';
import * as songService from './songService';

const USER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F8B500', '#00CED1'
];

function generateRandomColor(): string {
  return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
}

function broadcast(songId: string, message: ServerMessage, excludeUserId?: string): void {
  const connections = songStore.getConnections(songId);
  connections.forEach(({ ws }, userId) => {
    if (userId !== excludeUserId && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  });
}

function handleJoin(ws: WebSocket, data: { songId: string; userId: string; userName: string }): void {
  const { songId, userId, userName } = data;
  
  const songResult = songService.getSong(songId);
  if (!songResult.success) {
    ws.send(JSON.stringify({
      type: 'error',
      message: songResult.error
    }));
    return;
  }
  
  const color = generateRandomColor();
  const user: User = {
    id: userId,
    name: userName,
    color,
    songId
  };
  
  const success = songStore.addConnection(songId, userId, ws, user);
  if (!success) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Maximum users reached (4)'
    }));
    return;
  }
  
  songService.addMember(songId, userId);
  
  const currentUsers = songStore.getConnectedUsers(songId);
  currentUsers.forEach(u => {
    if (u.id !== userId) {
      ws.send(JSON.stringify({
        type: 'user_joined',
        user: u
      }));
    }
  });
  
  broadcast(songId, {
    type: 'user_joined',
    user
  }, userId);
  
  console.log(`User ${userName} joined song ${songId}`);
}

function handleLeave(data: { songId: string; userId: string }): void {
  const { songId, userId } = data;
  
  songStore.removeConnection(songId, userId);
  
  broadcast(songId, {
    type: 'user_left',
    userId
  });
  
  console.log(`User ${userId} left song ${songId}`);
}

function handleChordAdd(data: { songId: string; payload: ChordOp & { userId: string } }): void {
  const { songId, payload } = data;
  const { userId, ...op } = payload;
  
  const result = songService.addChord(songId, op, userId);
  if (result.success) {
    broadcast(songId, {
      type: 'chord_added',
      payload: { ...op, userId }
    });
  }
}

function handleChordRemove(data: { songId: string; payload: ChordOp & { userId: string } }): void {
  const { songId, payload } = data;
  const { userId, ...op } = payload;
  
  const result = songService.removeChord(songId, op, userId);
  if (result.success) {
    broadcast(songId, {
      type: 'chord_removed',
      payload: { ...op, userId }
    });
  }
}

function handleLyricUpdate(data: { songId: string; payload: LyricOp & { userId: string } }): void {
  const { songId, payload } = data;
  const { userId, ...op } = payload;
  
  const result = songService.updateLyric(songId, op, userId);
  if (result.success) {
    broadcast(songId, {
      type: 'lyric_updated',
      payload: { ...op, userId }
    });
  }
}

function handleCursorMove(data: { songId: string; payload: CursorPosition & { userId: string; userName: string } }): void {
  const { songId, payload } = data;
  const { userId, userName, ...position } = payload;
  
  const connections = songStore.getConnections(songId);
  const userConn = connections.get(userId);
  if (!userConn) return;
  
  broadcast(songId, {
    type: 'cursor_moved',
    payload: {
      ...position,
      userId,
      userName,
      color: userConn.user.color
    }
  }, userId);
}

export function setupWebSocketServer(wss: WebSocketServer): void {
  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    console.log('New WebSocket connection');
    
    ws.on('message', (data: Buffer) => {
      try {
        const message: ClientMessage = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'join':
            handleJoin(ws, message);
            break;
          case 'leave':
            handleLeave(message);
            break;
          case 'chord_add':
            handleChordAdd({ songId: message.songId, payload: message.payload as ChordOp & { userId: string } });
            break;
          case 'chord_remove':
            handleChordRemove({ songId: message.songId, payload: message.payload as ChordOp & { userId: string } });
            break;
          case 'lyric_update':
            handleLyricUpdate({ songId: message.songId, payload: message.payload as LyricOp & { userId: string } });
            break;
          case 'cursor_move':
            handleCursorMove({ songId: message.songId, payload: message.payload as CursorPosition & { userId: string; userName: string } });
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket connection closed');
      songStore.connections.forEach((users, songId) => {
        users.forEach((_, userId) => {
          songStore.removeConnection(songId, userId);
          broadcast(songId, {
            type: 'user_left',
            userId
          });
        });
      });
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });
  
  console.log('WebSocket server running');
}

export function createWebSocketServer(port: number): WebSocketServer {
  const wss = new WebSocketServer({ port });
  setupWebSocketServer(wss);
  return wss;
}
