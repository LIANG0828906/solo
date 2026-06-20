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

const MIN_ROOM_SIZE = 3;
const MIN_SPLIT_SIZE = 5;

function createNode(x: number, y: number, width: number, height: number): BSPNode {
  return { x, y, width, height, left: null, right: null, room: null };
}

function splitBSP(node: BSPNode, depth: number): void {
  if (depth <= 0) return;
  if (node.width < MIN_SPLIT_SIZE * 2 && node.height < MIN_SPLIT_SIZE * 2) return;

  const canSplitH = node.height >= MIN_SPLIT_SIZE * 2;
  const canSplitV = node.width >= MIN_SPLIT_SIZE * 2;

  if (!canSplitH && !canSplitV) return;

  let splitH: boolean;
  if (canSplitH && canSplitV) {
    splitH = node.width < node.height ? true : node.height < node.width ? false : Math.random() > 0.5;
  } else {
    splitH = canSplitH;
  }

  if (splitH) {
    const minSplit = MIN_SPLIT_SIZE;
    const maxSplit = node.height - MIN_SPLIT_SIZE;
    const split = minSplit + Math.floor(Math.random() * (maxSplit - minSplit + 1));
    node.left = createNode(node.x, node.y, node.width, split);
    node.right = createNode(node.x, node.y + split, node.width, node.height - split);
  } else {
    const minSplit = MIN_SPLIT_SIZE;
    const maxSplit = node.width - MIN_SPLIT_SIZE;
    const split = minSplit + Math.floor(Math.random() * (maxSplit - minSplit + 1));
    node.left = createNode(node.x, node.y, split, node.height);
    node.right = createNode(node.x + split, node.y, node.width - split, node.height);
  }

  splitBSP(node.left, depth - 1);
  splitBSP(node.right, depth - 1);
}

function createRoom(node: BSPNode): void {
  if (node.left && node.right) {
    createRoom(node.left);
    createRoom(node.right);
    return;
  }

  const maxWidth = node.width - 2;
  const maxHeight = node.height - 2;
  if (maxWidth < MIN_ROOM_SIZE || maxHeight < MIN_ROOM_SIZE) return;

  const roomW = MIN_ROOM_SIZE + Math.floor(Math.random() * (maxWidth - MIN_ROOM_SIZE + 1));
  const roomH = MIN_ROOM_SIZE + Math.floor(Math.random() * (maxHeight - MIN_ROOM_SIZE + 1));
  const roomX = node.x + 1 + Math.floor(Math.random() * (node.width - roomW - 2 + 1));
  const roomY = node.y + 1 + Math.floor(Math.random() * (node.height - roomH - 2 + 1));

  node.room = {
    x: roomX,
    y: roomY,
    width: roomW,
    height: roomH,
    centerX: Math.floor(roomX + roomW / 2),
    centerY: Math.floor(roomY + roomH / 2),
  };
}

function getRoom(node: BSPNode): Room | null {
  if (node.room) return node.room;
  if (node.left) {
    const leftRoom = getRoom(node.left);
    if (leftRoom) return leftRoom;
  }
  if (node.right) {
    const rightRoom = getRoom(node.right);
    if (rightRoom) return rightRoom;
  }
  return null;
}

function connectRooms(grid: number[][], roomA: Room, roomB: Room): void {
  let x = roomA.centerX;
  let y = roomA.centerY;

  while (x !== roomB.centerX) {
    if (grid[y] && grid[y][x] === 1) grid[y][x] = 0;
    x += x < roomB.centerX ? 1 : -1;
  }
  while (y !== roomB.centerY) {
    if (grid[y] && grid[y][x] === 1) grid[y][x] = 0;
    y += y < roomB.centerY ? 1 : -1;
  }
}

function connectBSP(grid: number[][], node: BSPNode): void {
  if (!node.left || !node.right) return;

  connectBSP(grid, node.left);
  connectBSP(grid, node.right);

  const leftRoom = getRoom(node.left);
  const rightRoom = getRoom(node.right);

  if (leftRoom && rightRoom) {
    connectRooms(grid, leftRoom, rightRoom);
  }
}

function getAllRooms(node: BSPNode): Room[] {
  const rooms: Room[] = [];
  if (node.room) rooms.push(node.room);
  if (node.left) rooms.push(...getAllRooms(node.left));
  if (node.right) rooms.push(...getAllRooms(node.right));
  return rooms;
}

function carveRooms(grid: number[][], rooms: Room[]): void {
  for (const room of rooms) {
    for (let y = room.y; y < room.y + room.height; y++) {
      for (let x = room.x; x < room.x + room.width; x++) {
        if (y >= 0 && y < grid.length && x >= 0 && x < grid[0].length) {
          grid[y][x] = 0;
        }
      }
    }
  }
}

export function generateMap(theme: MapTheme, rows: number, cols: number): MapData {
  const grid: number[][] = Array.from({ length: rows }, () => Array(cols).fill(1));

  const root = createNode(0, 0, cols, rows);
  const maxDepth = Math.max(2, Math.floor(Math.log2(Math.min(rows, cols))) + 1);
  splitBSP(root, maxDepth);
  createRoom(root);

  const rooms = getAllRooms(root);
  carveRooms(grid, rooms);
  connectBSP(grid, root);

  return { grid, rooms, rows, cols, theme };
}
