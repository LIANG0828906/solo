import { WebSocketServer, WebSocket } from 'ws';
import { Server as HttpServer } from 'http';
import { MindMapNode, UserInfo, WSMessage, NodeEventMessage } from '../shared/types';
import { saveMindMap, loadMindMap, generateRoomCode } from './mindmapService';
import { v4 as uuidv4 } from 'uuid';

const USER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
];

interface RoomState {
  roomCode: string;
  users: Map<string, { socket: WebSocket; info: UserInfo }>;
  mindmapData: MindMapNode | null;
}

const rooms = new Map<string, RoomState>();

function getRandomColor(): string {
  return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
}

function generateUserId(): string {
  return uuidv4().replace(/-/g, '').substring(0, 10);
}

function sendMessage(ws: WebSocket, type: string, data: any): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type, data }));
  }
}

function broadcastToRoom(roomCode: string, type: string, data: any, excludeId?: string): void {
  const room = rooms.get(roomCode);
  if (!room) return;

  for (const [userId, user] of room.users) {
    if (userId !== excludeId) {
      sendMessage(user.socket, type, data);
    }
  }
}

function getUsersList(room: RoomState): UserInfo[] {
  const users: UserInfo[] = [];
  for (const [, user] of room.users) {
    users.push(user.info);
  }
  return users;
}

function handleJoinRoom(ws: WebSocket, data: { roomCode?: string; nickname?: string }): void {
  let roomCode = data.roomCode?.toUpperCase() || generateRoomCode();
  const nickname = data.nickname || `用户${Math.floor(Math.random() * 1000)}`;
  const userId = generateUserId();
  const color = getRandomColor();

  let room = rooms.get(roomCode);
  if (!room) {
    const savedData = loadMindMap(roomCode);
    room = {
      roomCode,
      users: new Map(),
      mindmapData: savedData,
    };
    rooms.set(roomCode, room);
  }

  const userInfo: UserInfo = { id: userId, nickname, color };
  room.users.set(userId, { socket: ws, info: userInfo });

  (ws as any).userId = userId;
  (ws as any).roomCode = roomCode;

  sendMessage(ws, 'room_joined', {
    roomCode,
    userId,
    userInfo,
    mindmapData: room.mindmapData,
    users: getUsersList(room),
  });

  broadcastToRoom(roomCode, 'user_joined', { user: userInfo, users: getUsersList(room) }, userId);
}

function handleLeaveRoom(ws: WebSocket): void {
  const userId = (ws as any).userId as string;
  const roomCode = (ws as any).roomCode as string;

  if (!roomCode || !userId) return;

  const room = rooms.get(roomCode);
  if (!room) return;

  room.users.delete(userId);

  broadcastToRoom(roomCode, 'user_left', { userId, users: getUsersList(room) });

  if (room.users.size === 0 && room.mindmapData) {
    saveMindMap(roomCode, room.mindmapData);
  }

  if (room.users.size === 0) {
    setTimeout(() => {
      const currentRoom = rooms.get(roomCode);
      if (currentRoom && currentRoom.users.size === 0) {
        rooms.delete(roomCode);
      }
    }, 60000);
  }
}

function updateNodeInTree(root: MindMapNode, nodeId: string, updates: Partial<MindMapNode>): boolean {
  if (root.id === nodeId) {
    Object.assign(root, updates);
    return true;
  }
  for (const child of root.children) {
    if (updateNodeInTree(child, nodeId, updates)) {
      return true;
    }
  }
  return false;
}

function deleteNodeFromTree(root: MindMapNode, nodeId: string): boolean {
  for (let i = 0; i < root.children.length; i++) {
    if (root.children[i].id === nodeId) {
      root.children.splice(i, 1);
      return true;
    }
    if (deleteNodeFromTree(root.children[i], nodeId)) {
      return true;
    }
  }
  return false;
}

function addNodeToTree(root: MindMapNode, parentId: string, newNode: MindMapNode): boolean {
  if (root.id === parentId) {
    root.children.push(newNode);
    return true;
  }
  for (const child of root.children) {
    if (addNodeToTree(child, parentId, newNode)) {
      return true;
    }
  }
  return false;
}

function handleNodeEvent(ws: WebSocket, eventData: NodeEventMessage): void {
  const userId = (ws as any).userId as string;
  const roomCode = (ws as any).roomCode as string;

  if (!roomCode || !userId) return;

  const room = rooms.get(roomCode);
  if (!room || !room.mindmapData) return;

  let updated = false;

  switch (eventData.type) {
    case 'drag':
      if (eventData.x !== undefined && eventData.y !== undefined) {
        updated = updateNodeInTree(room.mindmapData, eventData.nodeId, {
          x: eventData.x,
          y: eventData.y,
        });
      }
      break;
    case 'text_update':
      if (eventData.text !== undefined) {
        updated = updateNodeInTree(room.mindmapData, eventData.nodeId, {
          text: eventData.text,
        });
      }
      break;
    case 'delete':
      updated = deleteNodeFromTree(room.mindmapData, eventData.nodeId);
      break;
    case 'create':
      if (eventData.node && eventData.parentId) {
        updated = addNodeToTree(room.mindmapData, eventData.parentId, eventData.node);
      }
      break;
    case 'update':
      if (eventData.node) {
        updated = updateNodeInTree(room.mindmapData, eventData.nodeId, eventData.node);
      }
      break;
  }

  if (updated) {
    saveMindMap(roomCode, room.mindmapData);
    broadcastToRoom(roomCode, 'node_event', { ...eventData, fromUser: userId }, userId);
  }
}

function handleFullMindmapUpdate(ws: WebSocket, data: { mindmapData: MindMapNode }): void {
  const userId = (ws as any).userId as string;
  const roomCode = (ws as any).roomCode as string;

  if (!roomCode || !userId) return;

  const room = rooms.get(roomCode);
  if (!room) return;

  room.mindmapData = data.mindmapData;
  saveMindMap(roomCode, room.mindmapData);

  broadcastToRoom(roomCode, 'mindmap_updated', { mindmapData: data.mindmapData, fromUser: userId }, userId);
}

export function createWebSocketServer(httpServer: HttpServer): WebSocketServer {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    console.log('New WebSocket connection');

    ws.on('message', (message: string) => {
      try {
        const parsed: WSMessage = JSON.parse(message.toString());
        const { type, data } = parsed;

        switch (type) {
          case 'join_room':
            handleJoinRoom(ws, data);
            break;
          case 'leave_room':
            handleLeaveRoom(ws);
            break;
          case 'node_event':
            handleNodeEvent(ws, data);
            break;
          case 'mindmap_full_update':
            handleFullMindmapUpdate(ws, data);
            break;
          default:
            console.log('Unknown message type:', type);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
      handleLeaveRoom(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  return wss;
}
