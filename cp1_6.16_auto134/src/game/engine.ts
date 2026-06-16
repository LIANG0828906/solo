import { v4 as uuidv4 } from 'uuid';

export interface Position { x: number; y: number; }
export interface Room { x: number; y: number; w: number; h: number; }
export interface Cell { type: 'wall' | 'floor' | 'pipe' | 'door'; tileId: number; }
export interface Pipe { id: string; pos: Position; lit: boolean; connectedValveId?: string; }
export interface Valve {
  id: string;
  pos: Position;
  currentAngle: number;
  targetAngle: number;
  isOpen: boolean;
  connectedPipeIds: string[];
}
export interface MazeData {
  width: number;
  height: number;
  cells: Cell[][];
  rooms: Room[];
  valves: Valve[];
  pipes: Pipe[];
  startPos: Position;
  doorPos: Position;
  doorOpen: boolean;
}
export type Direction8 = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export interface PlayerState {
  pos: Position;
  targetPos: Position;
  moveProgress: number;
  direction: Direction8;
  stamina: number;
  maxStamina: number;
  gearRotation: number;
}

const DIR_VECTORS: Record<Direction8, [number, number]> = {
  0: [0, -1],
  1: [1, -1],
  2: [1, 0],
  3: [1, 1],
  4: [0, 1],
  5: [-1, 1],
  6: [-1, 0],
  7: [-1, -1],
};

function createEmptyMaze(width: number, height: number): Cell[][] {
  const cells: Cell[][] = [];
  for (let y = 0; y < height; y++) {
    cells[y] = [];
    for (let x = 0; x < width; x++) {
      cells[y][x] = { type: 'wall', tileId: Math.floor(Math.random() * 4) };
    }
  }
  return cells;
}

function carveRoom(cells: Cell[][], room: Room): void {
  for (let y = room.y; y < room.y + room.h; y++) {
    for (let x = room.x; x < room.x + room.w; x++) {
      if (y >= 0 && y < cells.length && x >= 0 && x < cells[0].length) {
        cells[y][x] = { type: 'floor', tileId: Math.floor(Math.random() * 4) };
      }
    }
  }
}

function carveCorridor(cells: Cell[][], from: Position, to: Position): void {
  let cx = from.x;
  let cy = from.y;
  const ex = to.x;
  const ey = to.y;

  while (cx !== ex) {
    if (cy >= 0 && cy < cells.length && cx >= 0 && cx < cells[0].length) {
      cells[cy][cx] = { type: 'floor', tileId: Math.floor(Math.random() * 4) };
    }
    if (cy + 1 < cells.length && cells[cy + 1] && cx >= 0 && cx < cells[0].length) {
      cells[cy + 1][cx] = { type: 'floor', tileId: Math.floor(Math.random() * 4) };
    }
    cx += cx < ex ? 1 : -1;
  }
  while (cy !== ey) {
    if (cy >= 0 && cy < cells.length && cx >= 0 && cx < cells[0].length) {
      cells[cy][cx] = { type: 'floor', tileId: Math.floor(Math.random() * 4) };
    }
    if (cx + 1 < cells[0].length && cy >= 0 && cy < cells.length) {
      cells[cy][cx + 1] = { type: 'floor', tileId: Math.floor(Math.random() * 4) };
    }
    cy += cy < ey ? 1 : -1;
  }
  if (ey >= 0 && ey < cells.length && ex >= 0 && ex < cells[0].length) {
    cells[ey][ex] = { type: 'floor', tileId: Math.floor(Math.random() * 4) };
  }
}

function splitRoom(room: Room, numRooms: number): { rooms: Room[]; connections: [number, number][] } {
  if (numRooms <= 1) {
    return { rooms: [room], connections: [] };
  }
  const isHorizontal = room.w < room.h;
  const splitRatio = 0.4 + Math.random() * 0.2;
  const rooms: Room[] = [];
  const connections: [number, number][] = [];
  if (isHorizontal) {
    const splitY = Math.floor(room.y + room.h * splitRatio);
    const h1 = splitY - room.y;
    const h2 = room.y + room.h - splitY;
    if (h1 < 4 || h2 < 4) {
      return { rooms: [room], connections: [] };
    }
    const n1 = Math.max(1, Math.floor(numRooms * splitRatio));
    const n2 = numRooms - n1;
    const r1 = { x: room.x, y: room.y, w: room.w, h: h1 };
    const r2 = { x: room.x, y: splitY, w: room.w, h: h2 };
    const res1 = splitRoom(r1, n1);
    const res2 = splitRoom(r2, n2);
    rooms.push(...res1.rooms);
    rooms.push(...res2.rooms);
    connections.push(...res1.connections);
    connections.push(...res2.connections);
    connections.push([res1.rooms.length - 1, res1.rooms.length]);
  } else {
    const splitX = Math.floor(room.x + room.w * splitRatio);
    const w1 = splitX - room.x;
    const w2 = room.x + room.w - splitX;
    if (w1 < 4 || w2 < 4) {
      return { rooms: [room], connections: [] };
    }
    const n1 = Math.max(1, Math.floor(numRooms * splitRatio));
    const n2 = numRooms - n1;
    const r1 = { x: room.x, y: room.y, w: w1, h: room.h };
    const r2 = { x: splitX, y: room.y, w: w2, h: room.h };
    const res1 = splitRoom(r1, n1);
    const res2 = splitRoom(r2, n2);
    rooms.push(...res1.rooms);
    rooms.push(...res2.rooms);
    connections.push(...res1.connections);
    connections.push(...res2.connections);
    connections.push([res1.rooms.length - 1, res1.rooms.length]);
  }
  return { rooms, connections };
}

function roomCenter(room: Room): Position {
  return {
    x: Math.floor(room.x + room.w / 2),
    y: Math.floor(room.y + room.h / 2),
  };
}

export function generateMaze(level: number): MazeData {
  const width = 40 + level * 2;
  const height = 30 + level * 2;
  const cells = createEmptyMaze(width, height);
  const baseRoom = { x: 2, y: 2, w: width - 4, h: height - 4 };
  const numRooms = 5 + Math.min(level, 3);
  const { rooms, connections } = splitRoom(baseRoom, numRooms);
  rooms.forEach((room) => carveRoom(cells, room));
  connections.forEach(([a, b]) => {
    const ca = roomCenter(rooms[a]);
    const cb = roomCenter(rooms[b]);
    carveCorridor(cells, ca, cb);
  }));
  const startPos = roomCenter(rooms[0]);
  const lastRoom = rooms[rooms.length - 1];
  const doorCenter = roomCenter(lastRoom);
  const doorPos = { x: Math.min(doorCenter.x, width - 2), y: Math.min(doorCenter.y + 1, height - 2) };
  cells[doorPos.y][doorPos.x] = { type: 'door', tileId: 0 };
  const valves: Valve[] = [];
  const pipes: Pipe[] = [];
  const numValves = 2 + Math.min(level, 4);
  const valveRooms = rooms.slice(1, rooms.length - 1);
  const shuffledRooms = [...valveRooms].sort(() => Math.random() - 0.5).slice(0, Math.min(numValves, valveRooms.length));
  shuffledRooms.forEach((room) => {
    const c = roomCenter(room);
    const valveId = uuidv4();
    const pipeIds: string[] = [];
    const offsets: Position[] = [
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 },
    ];
    offsets.forEach((off, i) => {
      if (i < 2) {
        const pipePos = { x: c.x + off.x, y: c.y + off.y };
        if (pipePos.x >= 0 && pipePos.x < width && pipePos.y >= 0 && pipePos.y < height) {
          const pipeId = uuidv4();
          pipes.push({ id: pipeId, pos: pipePos, lit: false, connectedValveId: valveId });
          pipeIds.push(pipeId);
          if (cells[pipePos.y][pipePos.x].type === 'wall') {
            cells[pipePos.y][pipePos.x] = { type: 'pipe', tileId: 0 };
          }
        }
      }
    });
    valves.push({
      id: valveId,
      pos: c,
      currentAngle: Math.floor(Math.random() * 24) * 15,
      targetAngle: Math.floor(Math.random() * 24) * 15,
      isOpen: false,
      connectedPipeIds: pipeIds,
    });
  });
  return {
    width, height, cells, rooms, valves, pipes, startPos, doorPos, doorOpen: false,
  };
}

export function isWalkable(maze: MazeData, pos: Position): boolean {
  if (pos.x < 0 || pos.x >= maze.width || pos.y < 0 || pos.y >= maze.height) return false;
  const cell = maze.cells[pos.y][pos.x];
  return cell.type !== 'wall';
}

export function updateValveAngle(valve: Valve, deltaDeg: number): Valve {
  let newAngle = valve.currentAngle + deltaDeg;
  newAngle = Math.round(newAngle / 15) * 15;
  while (newAngle < 0) newAngle += 360;
  while (newAngle >= 360) newAngle -= 360;
  return { ...valve, currentAngle: newAngle };
}

export function checkValveOpen(valve: Valve): boolean {
  let diff = Math.abs(valve.currentAngle - valve.targetAngle);
  while (diff > 180) diff = Math.abs(diff - 360);
  return diff <= 7.5;
}

export function checkAllValvesOpen(valves: Valve[]): boolean {
  if (valves.length === 0) return true;
  return valves.every((v) => v.isOpen);
}

export function movePlayer(
  player: PlayerState,
  maze: MazeData,
  direction: Direction8,
  deltaTime: number
): { player: PlayerState; moved: boolean; collided: boolean } {
  const [dx, dy] = DIR_VECTORS[direction];
  const targetX = player.pos.x + dx;
  const targetY = player.pos.y + dy;
  const targetPos = { x: targetX, y: targetY };

  let canMove = isWalkable(maze, targetPos);
  if (direction === 1 || direction === 3 || direction === 5 || direction === 7) {
    const horiz = { x: player.pos.x + dx, y: player.pos.y };
    const vert = { x: player.pos.x, y: player.pos.y + dy };
    canMove = canMove && isWalkable(maze, horiz) && isWalkable(maze, vert);
  }
  if (!canMove) {
    return { player: { ...player, direction }, moved: false, collided: true };
  }
  const newPlayer: PlayerState = {
    ...player,
    pos: targetPos,
    targetPos,
    moveProgress: 0,
    direction,
    stamina: Math.max(0, player.stamina - 1),
    gearRotation: (player.gearRotation + 45) % 360,
  };
  return { player: newPlayer, moved: true, collided: false };
}
