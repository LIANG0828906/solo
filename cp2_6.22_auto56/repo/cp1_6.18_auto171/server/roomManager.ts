import { v4 as uuidv4 } from 'uuid';

interface PathPoint {
  x: number;
  y: number;
}

interface BoardElement {
  id: string;
  type: 'path' | 'sticky' | 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  strokeWidth?: number;
  points?: PathPoint[];
  text?: string;
  dataUrl?: string;
  opacity: number;
  zIndex: number;
  createdAt: number;
  updatedAt: number;
}

interface Snapshot {
  id: string;
  timestamp: number;
  elements: BoardElement[];
  expired: boolean;
}

interface Room {
  roomId: string;
  elements: BoardElement[];
  snapshots: Snapshot[];
  users: Set<string>;
  lastSnapshotTime: number;
}

const rooms = new Map<string, Room>();

function deepCloneElements(elements: BoardElement[]): BoardElement[] {
  return JSON.parse(JSON.stringify(elements));
}

export function getOrCreateRoom(roomId: string): Room {
  let room = rooms.get(roomId);
  if (!room) {
    room = {
      roomId,
      elements: [],
      snapshots: [],
      users: new Set(),
      lastSnapshotTime: Date.now(),
    };
    rooms.set(roomId, room);
  }
  return room;
}

export function addUserToRoom(roomId: string, userId: string): void {
  const room = getOrCreateRoom(roomId);
  room.users.add(userId);
}

export function removeUserFromRoom(roomId: string, userId: string): void {
  const room = rooms.get(roomId);
  if (room) {
    room.users.delete(userId);
    if (room.users.size === 0) {
      rooms.delete(roomId);
    }
  }
}

export function addElementToRoom(roomId: string, element: BoardElement): void {
  const room = getOrCreateRoom(roomId);
  room.elements.push(element);
}

export function updateElementInRoom(roomId: string, element: BoardElement): void {
  const room = rooms.get(roomId);
  if (!room) return;
  const index = room.elements.findIndex((e) => e.id === element.id);
  if (index !== -1) {
    room.elements[index] = element;
  }
}

export function deleteElementFromRoom(roomId: string, elementId: string): void {
  const room = rooms.get(roomId);
  if (!room) return;
  room.elements = room.elements.filter((e) => e.id !== elementId);
}

export function clearRoom(roomId: string): BoardElement[] {
  const room = rooms.get(roomId);
  if (!room) return [];
  const cleared = room.elements;
  room.elements = [];
  return cleared;
}

export function createSnapshot(roomId: string): Snapshot {
  const room = getOrCreateRoom(roomId);
  const snapshot: Snapshot = {
    id: uuidv4(),
    timestamp: Date.now(),
    elements: deepCloneElements(room.elements),
    expired: false,
  };
  room.snapshots.push(snapshot);
  room.lastSnapshotTime = Date.now();
  return snapshot;
}

export function rollbackToSnapshot(
  roomId: string,
  snapshotId: string
): { elements: BoardElement[]; expiredSnapshotIds: string[] } | null {
  const room = rooms.get(roomId);
  if (!room) return null;
  const snapshotIndex = room.snapshots.findIndex((s) => s.id === snapshotId);
  if (snapshotIndex === -1) return null;
  const snapshot = room.snapshots[snapshotIndex];
  if (snapshot.expired) return null;
  const expiredSnapshotIds: string[] = [];
  for (let i = snapshotIndex + 1; i < room.snapshots.length; i++) {
    room.snapshots[i].expired = true;
    expiredSnapshotIds.push(room.snapshots[i].id);
  }
  room.elements = deepCloneElements(snapshot.elements);
  return { elements: deepCloneElements(snapshot.elements), expiredSnapshotIds };
}

export function getRoomState(
  roomId: string
): { elements: BoardElement[]; snapshots: Snapshot[] } | null {
  const room = rooms.get(roomId);
  if (!room) return null;
  return {
    elements: deepCloneElements(room.elements),
    snapshots: deepCloneElements(room.snapshots as unknown as BoardElement[]) as unknown as Snapshot[],
  };
}

export function shouldCreateSnapshot(roomId: string): boolean {
  const room = rooms.get(roomId);
  if (!room) return false;
  return Date.now() - room.lastSnapshotTime >= 5 * 60 * 1000;
}

export function getAllRoomIds(): string[] {
  return Array.from(rooms.keys());
}
