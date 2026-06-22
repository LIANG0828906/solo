import express, { Request, Response } from 'express';
import { createServer, Server as HTTPServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import type {
  WSMessage,
  Presentation,
  Slide,
  Collaborator,
  WSMessageType,
} from '../src/types';
import { COLLABORATOR_COLORS } from '../src/types';

const app = express();
const server: HTTPServer = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

const PORT = process.env.PORT || 3001;

interface Room {
  id: string;
  presentation: Presentation;
  clients: Map<string, WebSocket>;
  collaborators: Map<string, Collaborator>;
}

const rooms = new Map<string, Room>();

function createInitialPresentation(): Presentation {
  const slide1Id = uuidv4();
  const slide2Id = uuidv4();
  return {
    id: uuidv4(),
    slides: [
      { id: slide1Id, elements: [], backgroundColor: '#FFFFFF' },
      { id: slide2Id, elements: [], backgroundColor: '#FFFFFF' },
    ],
    currentSlideId: slide1Id,
  };
}

function getOrCreateRoom(roomId: string): Room {
  let room = rooms.get(roomId);
  if (!room) {
    room = {
      id: roomId,
      presentation: createInitialPresentation(),
      clients: new Map(),
      collaborators: new Map(),
    };
    rooms.set(roomId, room);
  }
  return room;
}

function broadcastToRoom(room: Room, message: WSMessage, excludeId?: string): void {
  room.clients.forEach((ws, clientId) => {
    if (clientId !== excludeId && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  });
}

function sendToClient(ws: WebSocket, type: WSMessageType, payload: any, senderId: string = 'server'): void {
  const message: WSMessage = {
    type,
    payload,
    senderId,
    timestamp: Date.now(),
  };
  ws.send(JSON.stringify(message));
}

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', rooms: rooms.size });
});

wss.on('connection', (ws: WebSocket) => {
  let clientId = uuidv4();
  let currentRoomId: string | null = null;

  ws.on('message', (data: string) => {
    try {
      const message: WSMessage = JSON.parse(data);

      switch (message.type) {
        case 'join': {
          const { presentationId, userName } = message.payload;
          currentRoomId = presentationId || 'default-room';
          const room = getOrCreateRoom(currentRoomId as string);

          const colorIndex = room.collaborators.size % COLLABORATOR_COLORS.length;
          const collaborator: Collaborator = {
            id: clientId,
            name: userName || `用户${room.collaborators.size + 1}`,
            color: COLLABORATOR_COLORS[colorIndex],
            selectedElementId: null,
          };

          room.clients.set(clientId, ws);
          room.collaborators.set(clientId, collaborator);

          sendToClient(ws, 'join-ack', {
            collaboratorId: clientId,
            presentation: room.presentation,
            collaborators: Array.from(room.collaborators.values()),
          });

          broadcastToRoom(
            room,
            {
              type: 'collaborator-join',
              payload: { collaborator },
              senderId: 'server',
              timestamp: Date.now(),
            },
            clientId
          );
          break;
        }

        case 'addElement':
        case 'updateElement':
        case 'deleteElement':
        case 'selectElement':
        case 'addSlide':
        case 'updateSlide': {
          if (!currentRoomId) break;
          const room = rooms.get(currentRoomId);
          if (!room) break;

          if (message.type === 'addElement') {
            const { slideId, element } = message.payload;
            const slide = room.presentation.slides.find((s) => s.id === slideId);
            if (slide && !slide.elements.find((e) => e.id === element.id)) {
              slide.elements.push(element);
            }
          } else if (message.type === 'updateElement') {
            const { slideId, elementId, updates } = message.payload;
            const slide = room.presentation.slides.find((s) => s.id === slideId);
            if (slide) {
              const el = slide.elements.find((e) => e.id === elementId);
              if (el) Object.assign(el, updates);
            }
          } else if (message.type === 'deleteElement') {
            const { slideId, elementId } = message.payload;
            const slide = room.presentation.slides.find((s) => s.id === slideId);
            if (slide) {
              slide.elements = slide.elements.filter((e) => e.id !== elementId);
            }
          } else if (message.type === 'selectElement') {
            const collab = room.collaborators.get(message.senderId);
            if (collab) {
              collab.selectedElementId = message.payload.elementId;
            }
          } else if (message.type === 'addSlide') {
            const { slide }: { slide: Slide } = message.payload;
            if (!room.presentation.slides.find((s) => s.id === slide.id)) {
              room.presentation.slides.push(slide);
            }
          }

          broadcastToRoom(room, message, clientId);
          break;
        }

        case 'leave': {
          if (currentRoomId) {
            const room = rooms.get(currentRoomId);
            if (room) {
              room.clients.delete(clientId);
              room.collaborators.delete(clientId);
              broadcastToRoom(
                room,
                {
                  type: 'collaborator-leave',
                  payload: { collaboratorId: clientId },
                  senderId: 'server',
                  timestamp: Date.now(),
                }
              );
            }
          }
          break;
        }
      }
    } catch (e) {
      console.error('Failed to handle WS message:', e);
    }
  });

  ws.on('close', () => {
    if (currentRoomId) {
      const room = rooms.get(currentRoomId);
      if (room) {
        room.clients.delete(clientId);
        room.collaborators.delete(clientId);
        broadcastToRoom(
          room,
          {
            type: 'collaborator-leave',
            payload: { collaboratorId: clientId },
            senderId: 'server',
            timestamp: Date.now(),
          }
        );
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`[server] Server running on port ${PORT}`);
  console.log(`[server] WebSocket path: /ws`);
});
