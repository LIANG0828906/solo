import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import http from 'http';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = 3002;

interface Point {
  x: number;
  y: number;
}

interface StickyNote {
  id: string;
  x: number;
  y: number;
  content: string;
  color: string;
  sidebarColor: string;
  creator: string;
  votes: string[];
  createdAt: number;
}

interface Drawing {
  id: string;
  points: Point[];
  color: string;
  lineWidth: number;
  creator: string;
}

interface RoomState {
  notes: Map<string, StickyNote>;
  drawings: Drawing[];
  clients: Map<string, WebSocket>;
}

const rooms = new Map<string, RoomState>();

interface Message {
  type: string;
  roomId: string;
  payload: any;
  clientId?: string;
}

function getRoom(roomId: string): RoomState {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      notes: new Map(),
      drawings: [],
      clients: new Map(),
    });
  }
  return rooms.get(roomId)!;
}

function broadcast(room: RoomState, message: Message, excludeId?: string) {
  const data = JSON.stringify(message);
  room.clients.forEach((ws, clientId) => {
    if (clientId !== excludeId && ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  });
}

function serializeRoomState(room: RoomState) {
  return {
    notes: Array.from(room.notes.values()),
    drawings: room.drawings,
    onlineCount: room.clients.size,
  };
}

wss.on('connection', (ws) => {
  const clientId = uuidv4();
  let currentRoomId: string | null = null;

  ws.on('message', (data) => {
    try {
      const message: Message = JSON.parse(data.toString());
      const { type, roomId, payload } = message;

      if (!roomId) return;

      const room = getRoom(roomId);
      currentRoomId = roomId;

      switch (type) {
        case 'join': {
          room.clients.set(clientId, ws);
          ws.send(JSON.stringify({
            type: 'init',
            payload: serializeRoomState(room),
            clientId,
          }));
          broadcast(room, {
            type: 'onlineCount',
            roomId,
            payload: { onlineCount: room.clients.size },
          });
          break;
        }

        case 'addNote': {
          const note: StickyNote = {
            id: uuidv4(),
            x: payload.x,
            y: payload.y,
            content: payload.content || '',
            color: payload.color || '#FFF8DC',
            sidebarColor: payload.sidebarColor || '#888888',
            creator: clientId,
            votes: [],
            createdAt: Date.now(),
          };
          room.notes.set(note.id, note);
          broadcast(room, { type: 'noteAdded', roomId, payload: note }, clientId);
          ws.send(JSON.stringify({ type: 'noteAdded', roomId, payload: note, clientId }));
          break;
        }

        case 'updateNote': {
          const note = room.notes.get(payload.id);
          if (note) {
            Object.assign(note, payload);
            broadcast(room, { type: 'noteUpdated', roomId, payload: note }, clientId);
          }
          break;
        }

        case 'deleteNote': {
          if (room.notes.has(payload.id)) {
            room.notes.delete(payload.id);
            broadcast(room, { type: 'noteDeleted', roomId, payload }, clientId);
          }
          break;
        }

        case 'voteNote': {
          const note = room.notes.get(payload.noteId);
          if (note) {
            const voterId = payload.voterId || clientId;
            const voteIndex = note.votes.indexOf(voterId);
            if (voteIndex === -1) {
              note.votes.push(voterId);
            } else {
              note.votes.splice(voteIndex, 1);
            }
            broadcast(room, { type: 'noteVoted', roomId, payload: { noteId: note.id, votes: note.votes } });
          }
          break;
        }

        case 'addDrawing': {
          const drawing: Drawing = {
            id: uuidv4(),
            points: payload.points,
            color: payload.color,
            lineWidth: payload.lineWidth,
            creator: clientId,
          };
          room.drawings.push(drawing);
          broadcast(room, { type: 'drawingAdded', roomId, payload: drawing }, clientId);
          break;
        }

        case 'undoDrawing': {
          const lastDrawing = room.drawings.pop();
          if (lastDrawing) {
            broadcast(room, { type: 'drawingUndone', roomId, payload: { id: lastDrawing.id } });
          }
          break;
        }

        case 'ping': {
          ws.send(JSON.stringify({ type: 'pong', roomId, payload: { timestamp: Date.now() } }));
          break;
        }
      }
    } catch (e) {
      console.error('Error parsing message:', e);
    }
  });

  ws.on('close', () => {
    if (currentRoomId) {
      const room = rooms.get(currentRoomId);
      if (room) {
        room.clients.delete(clientId);
        broadcast(room, {
          type: 'onlineCount',
          roomId: currentRoomId,
          payload: { onlineCount: room.clients.size },
        });
        if (room.clients.size === 0 && room.notes.size === 0 && room.drawings.length === 0) {
          rooms.delete(currentRoomId);
        }
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
