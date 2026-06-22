export type MapTheme = 'catacomb' | 'ice_cave' | 'lava_cave';

export interface Room {
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export interface BSPNode {
  x: number;
  y: number;
  width: number;
  height: number;
  left: BSPNode | null;
  right: BSPNode | null;
  room: Room | null;
}

export interface MapData {
  grid: number[][];
  rooms: Room[];
  rows: number;
  cols: number;
  theme: MapTheme;
}

const MIN_ROOM_SIZE = 5;
const MIN_SPLIT_SIZE = MIN_ROOM_SIZE + 2;
const MAX_DEPTH = 6;

function createNode(x: number, y: number, width: number, height: number): BSPNode {
  return { x, y, width, height, left: null, right: null, room: null };
}

function splitNode(node: BSPNode, depth: number): void {
  if (depth >= MAX_DEPTH) return;

  const canSplitHorizontal = node.height >= MIN_SPLIT_SIZE * 2;
  const canSplitVertical = node.width >= MIN_SPLIT_SIZE * 2;

  if (!canSplitHorizontal && !canSplitVertical) return;

  let splitHorizontal: boolean;
  if (canSplitHorizontal && canSplitVertical) {
    splitHorizontal = Math.random() > 0.5;
  } else {
    splitHorizontal = canSplitHorizontal;
  }

  if (splitHorizontal) {
    const minSplitAt = MIN_SPLIT_SIZE;
    const maxSplitAt = node.height - MIN_SPLIT_SIZE;
    const splitAt = minSplitAt + Math.floor(Math.random() * (maxSplitAt - minSplitAt + 1));

    node.left = createNode(node.x, node.y, node.width, splitAt);
    node.right = createNode(node.x, node.y + splitAt, node.width, node.height - splitAt);
  } else {
    const minSplitAt = MIN_SPLIT_SIZE;
    const maxSplitAt = node.width - MIN_SPLIT_SIZE;
    const splitAt = minSplitAt + Math.floor(Math.random() * (maxSplitAt - minSplitAt + 1));

    node.left = createNode(node.x, node.y, splitAt, node.height);
    node.right = createNode(node.x + splitAt, node.y, node.width - splitAt, node.height);
  }

  splitNode(node.left, depth + 1);
  splitNode(node.right, depth + 1);
}

function carveRoomInLeaf(node: BSPNode): Room | null {
  if (node.width < MIN_ROOM_SIZE || node.height < MIN_ROOM_SIZE) return null;

  const availableW = node.width - 2;
  const availableH = node.height - 2;
  const maxW = Math.max(MIN_ROOM_SIZE, availableW);
  const maxH = Math.max(MIN_ROOM_SIZE, availableH);
  const roomW = MIN_ROOM_SIZE + Math.floor(Math.random() * Math.max(1, maxW - MIN_ROOM_SIZE + 1));
  const roomH = MIN_ROOM_SIZE + Math.floor(Math.random() * Math.max(1, maxH - MIN_ROOM_SIZE + 1));

  const maxOffsetX = Math.max(0, availableW - roomW);
  const maxOffsetY = Math.max(0, availableH - roomH);
  const offsetX = Math.floor(Math.random() * (maxOffsetX + 1));
  const offsetY = Math.floor(Math.random() * (maxOffsetY + 1));

  const roomX = node.x + 1 + offsetX;
  const roomY = node.y + 1 + offsetY;

  node.room = {
    x: roomX,
    y: roomY,
    width: Math.min(roomW, node.width - 2),
    height: Math.min(roomH, node.height - 2),
    centerX: Math.floor(roomX + Math.min(roomW, node.width - 2) / 2),
    centerY: Math.floor(roomY + Math.min(roomH, node.height - 2) / 2),
  };

  return node.room;
}

function carveAllRooms(node: BSPNode): void {
  if (node.left && node.right) {
    carveAllRooms(node.left);
    carveAllRooms(node.right);
    return;
  }
  carveRoomInLeaf(node);
}

function carveRoom(node: BSPNode): Room | null {
  carveAllRooms(node);
  return node.left
    ? getRightmostRoom(node.left) || getLeftmostRoom(node.right)
    : node.room;
}

function collectRooms(node: BSPNode, rooms: Room[]): void {
  if (node.room) rooms.push(node.room);
  if (node.left) collectRooms(node.left, rooms);
  if (node.right) collectRooms(node.right, rooms);
}

function getLeftmostRoom(node: BSPNode): Room | null {
  if (node.room) return node.room;
  if (node.left) {
    const left = getLeftmostRoom(node.left);
    if (left) return left;
  }
  if (node.right) {
    const right = getLeftmostRoom(node.right);
    if (right) return right;
  }
  return null;
}

function getRightmostRoom(node: BSPNode): Room | null {
  if (node.room) return node.room;
  if (node.right) {
    const right = getRightmostRoom(node.right);
    if (right) return right;
  }
  if (node.left) {
    const left = getRightmostRoom(node.left);
    if (left) return left;
  }
  return null;
}

function carveHorizontalCorridor(grid: number[][], y: number, x1: number, x2: number): void {
  const start = Math.min(x1, x2);
  const end = Math.max(x1, x2);
  for (let x = start; x <= end; x++) {
    if (grid[y] && grid[y][x] === 1) grid[y][x] = 0;
    if (grid[y + 1] && grid[y + 1][x] === 1) grid[y + 1][x] = 0;
  }
}

function carveVerticalCorridor(grid: number[][], x: number, y1: number, y2: number): void {
  const start = Math.min(y1, y2);
  const end = Math.max(y1, y2);
  for (let y = start; y <= end; y++) {
    if (grid[y] && grid[y][x] === 1) grid[y][x] = 0;
    if (grid[y] && grid[y][x + 1] === 1) grid[y][x + 1] = 0;
  }
}

function connectTwoRooms(grid: number[][], roomA: Room, roomB: Room): void {
  const ax = roomA.centerX;
  const ay = roomA.centerY;
  const bx = roomB.centerX;
  const by = roomB.centerY;

  if (Math.random() > 0.5) {
    carveHorizontalCorridor(grid, ay, ax, bx);
    carveVerticalCorridor(grid, bx, ay, by);
  } else {
    carveVerticalCorridor(grid, ax, ay, by);
    carveHorizontalCorridor(grid, by, ax, bx);
  }
}

function connectNodeRooms(grid: number[][], node: BSPNode): void {
  if (!node.left || !node.right) return;

  connectNodeRooms(grid, node.left);
  connectNodeRooms(grid, node.right);

  const leftRoom = getRightmostRoom(node.left);
  const rightRoom = getLeftmostRoom(node.right);

  if (leftRoom && rightRoom) {
    connectTwoRooms(grid, leftRoom, rightRoom);
  }
}

function carveRoomOntoGrid(grid: number[][], room: Room): void {
  for (let y = room.y; y < room.y + room.height; y++) {
    for (let x = room.x; x < room.x + room.width; x++) {
      if (y >= 0 && y < grid.length && x >= 0 && x < grid[0].length) {
        grid[y][x] = 0;
      }
    }
  }
}

export function generateMap(theme: MapTheme, rows: number, cols: number): MapData {
  const grid: number[][] = Array.from({ length: rows }, () => Array(cols).fill(1));

  const root = createNode(0, 0, cols, rows);
  splitNode(root, 0);
  carveRoom(root);

  const rooms: Room[] = [];
  collectRooms(root, rooms);

  for (const room of rooms) {
    carveRoomOntoGrid(grid, room);
  }

  connectNodeRooms(grid, root);

  return { grid, rooms, rows, cols, theme };
}
