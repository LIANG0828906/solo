import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

interface MindMapNode {
  id: string;
  title: string;
  subtitle?: string;
  parentId: string | null;
  children: string[];
  x: number;
  y: number;
  color: string;
  borderStyle: 'solid' | 'dashed' | 'double';
  fontSize: number;
  icon?: string;
}

interface MindMap {
  rootId: string;
  nodes: Record<string, MindMapNode>;
}

interface User {
  id: string;
  nickname: string;
  roomId: string;
  color: string;
  cursorX?: number;
  cursorY?: number;
}

interface RoomState {
  roomId: string;
  mindMap: MindMap;
  users: User[];
}

type WSMessageType =
  | 'join_room'
  | 'leave_room'
  | 'room_state'
  | 'user_list'
  | 'node_add'
  | 'node_update'
  | 'node_delete'
  | 'node_move'
  | 'tree_update'
  | 'cursor_update'
  | 'history_undo'
  | 'history_redo';

interface WSMessage {
  type: WSMessageType;
  payload: any;
  senderId?: string;
  timestamp: number;
}

interface ClientConnection {
  ws: WebSocket;
  userId: string;
  roomId: string;
  nickname: string;
}

interface Room {
  roomId: string;
  mindMap: MindMap;
  clients: Map<string, ClientConnection>;
  history: ServerHistoryEntry[];
}

interface ServerHistoryEntry {
  id: string;
  type: WSMessageType;
  payload: any;
  previousState?: any;
  userId: string;
  timestamp: number;
}

const USER_COLORS = ['#ff6b6b', '#4dabf7', '#69db7c', '#ffa94d', '#9775fa', '#f783ac', '#38d9a9', '#ffd43b', '#748ffc', '#e599f7'];

const rooms = new Map<string, Room>();

const app = express();
app.use(cors());
app.use(express.json());

const server = createServer(app);
const wss = new WebSocketServer({ server });

const createInitialMindMap = (): MindMap => {
  const rootId = uuidv4();
  const rootNode: MindMapNode = {
    id: rootId,
    title: '中心主题',
    subtitle: '双击编辑',
    parentId: null,
    children: [],
    x: 0,
    y: 0,
    color: '#ffffff',
    borderStyle: 'solid',
    fontSize: 18,
    icon: '🎯'
  };

  const child1Id = uuidv4();
  const child1: MindMapNode = {
    id: child1Id,
    title: '子主题 1',
    subtitle: '可以继续添加',
    parentId: rootId,
    children: [],
    x: -250,
    y: -100,
    color: '#4dabf7',
    borderStyle: 'solid',
    fontSize: 16,
    icon: '💡'
  };

  const child2Id = uuidv4();
  const child2: MindMapNode = {
    id: child2Id,
    title: '子主题 2',
    subtitle: '拖动节点',
    parentId: rootId,
    children: [],
    x: 250,
    y: -100,
    color: '#69db7c',
    borderStyle: 'solid',
    fontSize: 16,
    icon: '⭐'
  };

  const child3Id = uuidv4();
  const child3: MindMapNode = {
    id: child3Id,
    title: '子主题 3',
    subtitle: 'Tab 创建子节点',
    parentId: rootId,
    children: [],
    x: 0,
    y: 200,
    color: '#ffa94d',
    borderStyle: 'solid',
    fontSize: 16,
    icon: '🚀'
  };

  rootNode.children = [child1Id, child2Id, child3Id];

  return {
    rootId,
    nodes: {
      [rootId]: rootNode,
      [child1Id]: child1,
      [child2Id]: child2,
      [child3Id]: child3
    }
  };
};

const broadcastToRoom = (roomId: string, message: WSMessage, excludeUserId?: string) => {
  const room = rooms.get(roomId);
  if (!room) return;
  room.clients.forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN && client.userId !== excludeUserId) {
      client.ws.send(JSON.stringify(message));
    }
  });
};

const buildUserList = (room: Room): User[] => {
  const users: User[] = [];
  let idx = 0;
  room.clients.forEach((client) => {
    users.push({
      id: client.userId,
      nickname: client.nickname,
      roomId: client.roomId,
      color: USER_COLORS[idx % USER_COLORS.length]
    });
    idx++;
  });
  return users;
};

const sendUserList = (roomId: string) => {
  const room = rooms.get(roomId);
  if (!room) return;
  const users = buildUserList(room);
  const message: WSMessage = { type: 'user_list', payload: users, timestamp: Date.now() };
  room.clients.forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  });
};

const handleJoinRoom = (ws: WebSocket, payload: { roomId: string; nickname: string }) => {
  const { roomId, nickname } = payload;

  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      roomId,
      mindMap: createInitialMindMap(),
      clients: new Map(),
      history: []
    });
  }

  const room = rooms.get(roomId)!;
  const userId = uuidv4();
  room.clients.set(userId, { ws, userId, roomId, nickname });

  const users = buildUserList(room);
  const roomState: RoomState = { roomId, mindMap: room.mindMap, users };
  const joinMessage: WSMessage = { type: 'room_state', payload: { ...roomState, yourUserId: userId }, timestamp: Date.now() };
  ws.send(JSON.stringify(joinMessage));

  setTimeout(() => sendUserList(roomId), 100);
};

const handleNodeAdd = (roomId: string, payload: any, senderId: string) => {
  const room = rooms.get(roomId);
  if (!room) return;
  const { node, parentId } = payload;
  room.mindMap.nodes[node.id] = node;
  if (parentId && room.mindMap.nodes[parentId]) {
    if (!room.mindMap.nodes[parentId].children.includes(node.id)) {
      room.mindMap.nodes[parentId].children.push(node.id);
    }
  }
  room.history.push({ id: uuidv4(), type: 'node_add', payload: { nodeId: node.id, parentId }, previousState: null, userId: senderId, timestamp: Date.now() });
  if (room.history.length > 50) room.history.shift();
  broadcastToRoom(roomId, { type: 'node_add', payload, senderId, timestamp: Date.now() }, senderId);
};

const handleNodeUpdate = (roomId: string, payload: any, senderId: string) => {
  const room = rooms.get(roomId);
  if (!room) return;
  const { nodeId, updates } = payload;
  if (room.mindMap.nodes[nodeId]) {
    const prev = { ...room.mindMap.nodes[nodeId] };
    room.mindMap.nodes[nodeId] = { ...room.mindMap.nodes[nodeId], ...updates };
    room.history.push({ id: uuidv4(), type: 'node_update', payload: { nodeId, updates }, previousState: { nodeId, previousNode: prev }, userId: senderId, timestamp: Date.now() });
    if (room.history.length > 50) room.history.shift();
  }
  broadcastToRoom(roomId, { type: 'node_update', payload, senderId, timestamp: Date.now() }, senderId);
};

const handleNodeDelete = (roomId: string, payload: any, senderId: string) => {
  const room = rooms.get(roomId);
  if (!room) return;
  const { nodeId } = payload;
  const node = room.mindMap.nodes[nodeId];
  if (!node) return;

  const collectSubtreeIds = (id: string): string[] => {
    const ids = [id];
    const n = room.mindMap.nodes[id];
    if (n) n.children.forEach((childId) => ids.push(...collectSubtreeIds(childId)));
    return ids;
  };

  const subtreeIds = collectSubtreeIds(nodeId);
  const previousNodes: Record<string, MindMapNode> = {};
  subtreeIds.forEach((id) => { previousNodes[id] = { ...room.mindMap.nodes[id] }; });

  const parentId = node.parentId;
  if (parentId && room.mindMap.nodes[parentId]) {
    room.mindMap.nodes[parentId].children = room.mindMap.nodes[parentId].children.filter((id) => id !== nodeId);
  }
  subtreeIds.forEach((id) => { delete room.mindMap.nodes[id]; });

  if (nodeId === room.mindMap.rootId) {
    const newRootId = Object.keys(room.mindMap.nodes)[0];
    if (newRootId) {
      room.mindMap.rootId = newRootId;
      room.mindMap.nodes[newRootId].parentId = null;
    }
  }

  room.history.push({ id: uuidv4(), type: 'node_delete', payload: { nodeId, subtreeIds, parentId }, previousState: { nodes: previousNodes, rootId: room.mindMap.rootId }, userId: senderId, timestamp: Date.now() });
  if (room.history.length > 50) room.history.shift();
  broadcastToRoom(roomId, { type: 'node_delete', payload, senderId, timestamp: Date.now() }, senderId);
};

const handleNodeMove = (roomId: string, payload: any, senderId: string) => {
  const room = rooms.get(roomId);
  if (!room) return;
  const { moves } = payload;
  moves.forEach((move: { nodeId: string; x: number; y: number }) => {
    if (room.mindMap.nodes[move.nodeId]) {
      room.mindMap.nodes[move.nodeId].x = move.x;
      room.mindMap.nodes[move.nodeId].y = move.y;
    }
  });
  broadcastToRoom(roomId, { type: 'node_move', payload, senderId, timestamp: Date.now() }, senderId);
};

const handleTreeUpdate = (roomId: string, payload: any, senderId: string) => {
  const room = rooms.get(roomId);
  if (!room) return;
  room.mindMap = payload.mindMap;
  broadcastToRoom(roomId, { type: 'tree_update', payload, senderId, timestamp: Date.now() }, senderId);
};

wss.on('connection', (ws: WebSocket) => {
  let currentUserId: string | null = null;
  let currentRoomId: string | null = null;

  ws.on('message', (data) => {
    try {
      const message: WSMessage = JSON.parse(data.toString());

      switch (message.type) {
        case 'join_room': {
          handleJoinRoom(ws, message.payload);
          currentRoomId = message.payload.roomId;
          if (currentRoomId) {
            const room = rooms.get(currentRoomId);
            if (room) {
              const client = Array.from(room.clients.values()).find((c) => c.ws === ws);
              if (client) currentUserId = client.userId;
            }
          }
          break;
        }
        case 'node_add':
          if (currentRoomId && currentUserId) handleNodeAdd(currentRoomId, message.payload, currentUserId);
          break;
        case 'node_update':
          if (currentRoomId && currentUserId) handleNodeUpdate(currentRoomId, message.payload, currentUserId);
          break;
        case 'node_delete':
          if (currentRoomId && currentUserId) handleNodeDelete(currentRoomId, message.payload, currentUserId);
          break;
        case 'node_move':
          if (currentRoomId && currentUserId) handleNodeMove(currentRoomId, message.payload, currentUserId);
          break;
        case 'tree_update':
          if (currentRoomId && currentUserId) handleTreeUpdate(currentRoomId, message.payload, currentUserId);
          break;
        case 'cursor_update':
          if (currentRoomId && currentUserId) {
            broadcastToRoom(currentRoomId, { type: 'cursor_update', payload: { ...message.payload, userId: currentUserId }, senderId: currentUserId, timestamp: Date.now() }, currentUserId);
          }
          break;
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', () => {
    if (currentRoomId) {
      const room = rooms.get(currentRoomId);
      if (room && currentUserId) {
        room.clients.delete(currentUserId);
        if (room.clients.size === 0) {
          setTimeout(() => {
            const r = rooms.get(currentRoomId!);
            if (r && r.clients.size === 0) rooms.delete(currentRoomId!);
          }, 30000);
        } else {
          sendUserList(currentRoomId);
        }
      }
    }
  });
});

app.get('/api/room/:roomId/exists', (req, res) => {
  const { roomId } = req.params;
  res.json({ exists: rooms.has(roomId), userCount: rooms.get(roomId)?.clients.size || 0 });
});

app.post('/api/room/generate', (_req, res) => {
  let roomId = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  do {
    roomId = '';
    for (let i = 0; i < 6; i++) roomId += chars.charAt(Math.floor(Math.random() * chars.length));
  } while (rooms.has(roomId));
  res.json({ roomId });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
