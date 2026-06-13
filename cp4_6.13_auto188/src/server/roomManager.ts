export interface MindMapNode {
  id: string;
  text: string;
  level: number;
  x: number;
  y: number;
  parentId: string | null;
  children: string[];
  note?: string;
  icon?: string;
}

export interface User {
  id: string;
  name: string;
  socketId: string;
  roomCode: string;
}

export interface Room {
  code: string;
  nodes: Record<string, MindMapNode>;
  users: Record<string, User>;
  createdAt: number;
}

const rooms: Record<string, Room> = {};

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function createRoom(): Room {
  let code: string;
  do {
    code = generateRoomCode();
  } while (rooms[code]);

  const room: Room = {
    code,
    nodes: {},
    users: {},
    createdAt: Date.now(),
  };

  rooms[code] = room;
  return room;
}

export function getRoom(code: string): Room | undefined {
  return rooms[code];
}

export function addUser(roomCode: string, user: User): Room | undefined {
  const room = rooms[roomCode];
  if (!room) return undefined;

  room.users[user.id] = user;
  return room;
}

export function removeUser(roomCode: string, userId: string): Room | undefined {
  const room = rooms[roomCode];
  if (!room) return undefined;

  delete room.users[userId];
  return room;
}

export function getUsers(roomCode: string): User[] | undefined {
  const room = rooms[roomCode];
  if (!room) return undefined;

  return Object.values(room.users);
}

export function updateNodes(roomCode: string, nodes: Record<string, MindMapNode>): Room | undefined {
  const room = rooms[roomCode];
  if (!room) return undefined;

  room.nodes = nodes;
  return room;
}

export function updateNodePosition(
  roomCode: string,
  nodeId: string,
  x: number,
  y: number
): Room | undefined {
  const room = rooms[roomCode];
  if (!room || !room.nodes[nodeId]) return undefined;

  room.nodes[nodeId].x = x;
  room.nodes[nodeId].y = y;
  return room;
}

export function updateNodeContent(
  roomCode: string,
  nodeId: string,
  text?: string,
  note?: string,
  icon?: string
): Room | undefined {
  const room = rooms[roomCode];
  if (!room || !room.nodes[nodeId]) return undefined;

  const node = room.nodes[nodeId];
  if (text !== undefined) node.text = text;
  if (note !== undefined) node.note = note;
  if (icon !== undefined) node.icon = icon;

  return room;
}
