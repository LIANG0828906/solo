import { DungeonMap, Room, Tile } from '@/types';

class BSPNode {
  x: number;
  y: number;
  width: number;
  height: number;
  left: BSPNode | null = null;
  right: BSPNode | null = null;
  room: Room | null = null;

  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  isLeaf(): boolean {
    return this.left === null && this.right === null;
  }
}

export class DungeonGenerator {
  private mapWidth: number;
  private mapHeight: number;
  private roomIdCounter: number = 0;
  private difficulty: number;

  private readonly MIN_ROOM_SIZE = 5;
  private readonly MAX_ROOM_SIZE = 10;
  private readonly MIN_LEAF_SIZE = 12;

  constructor(difficulty: number = 1) {
    this.difficulty = difficulty;
    this.mapWidth = 48;
    this.mapHeight = 48;
  }

  generate(): DungeonMap {
    this.roomIdCounter = 0;
    const tiles: Tile[][] = this.createEmptyTiles();
    const root = this.buildBSPTree();
    const rooms: Room[] = [];

    this.createRoomsInLeaves(root, rooms);
    this.drawRooms(tiles, rooms);
    this.connectRooms(tiles, root);

    const sortedRooms = this.sortRoomsByPosition(rooms);
    const startRoom = sortedRooms[0];
    const endRoom = sortedRooms[sortedRooms.length - 1];

    return {
      width: this.mapWidth,
      height: this.mapHeight,
      tiles,
      rooms: sortedRooms,
      startRoom,
      endRoom,
    };
  }

  private createEmptyTiles(): Tile[][] {
    const tiles: Tile[][] = [];
    for (let y = 0; y < this.mapHeight; y++) {
      tiles[y] = [];
      for (let x = 0; x < this.mapWidth; x++) {
        tiles[y][x] = { x, y, type: 'wall' };
      }
    }
    return tiles;
  }

  private buildBSPTree(): BSPNode {
    const root = new BSPNode(0, 0, this.mapWidth, this.mapHeight);
    const queue: BSPNode[] = [root];

    while (queue.length > 0) {
      const node = queue.shift()!;

      if (this.shouldSplit(node)) {
        this.splitNode(node);
        if (node.left) queue.push(node.left);
        if (node.right) queue.push(node.right);
      }
    }

    return root;
  }

  private shouldSplit(node: BSPNode): boolean {
    if (node.width <= this.MIN_LEAF_SIZE && node.height <= this.MIN_LEAF_SIZE) {
      return false;
    }
    if (node.width < this.MIN_ROOM_SIZE + 4 && node.height < this.MIN_ROOM_SIZE + 4) {
      return false;
    }
    return true;
  }

  private splitNode(node: BSPNode): void {
    const splitHorizontally = this.chooseSplitDirection(node);

    if (splitHorizontally) {
      const minSplit = this.MIN_LEAF_SIZE;
      const maxSplit = node.height - this.MIN_LEAF_SIZE;
      if (maxSplit <= minSplit) return;

      const splitY = node.y + minSplit + Math.floor(Math.random() * (maxSplit - minSplit));
      node.left = new BSPNode(node.x, node.y, node.width, splitY - node.y);
      node.right = new BSPNode(node.x, splitY, node.width, node.y + node.height - splitY);
    } else {
      const minSplit = this.MIN_LEAF_SIZE;
      const maxSplit = node.width - this.MIN_LEAF_SIZE;
      if (maxSplit <= minSplit) return;

      const splitX = node.x + minSplit + Math.floor(Math.random() * (maxSplit - minSplit));
      node.left = new BSPNode(node.x, node.y, splitX - node.x, node.height);
      node.right = new BSPNode(splitX, node.y, node.x + node.width - splitX, node.height);
    }
  }

  private chooseSplitDirection(node: BSPNode): boolean {
    if (node.width > node.height * 1.25) {
      return false;
    }
    if (node.height > node.width * 1.25) {
      return true;
    }
    return Math.random() < 0.5;
  }

  private createRoomsInLeaves(node: BSPNode, rooms: Room[]): void {
    if (node.isLeaf()) {
      const room = this.createRoomInNode(node);
      if (room) {
        node.room = room;
        rooms.push(room);
      }
    } else {
      if (node.left) this.createRoomsInLeaves(node.left, rooms);
      if (node.right) this.createRoomsInLeaves(node.right, rooms);
    }
  }

  private createRoomInNode(node: BSPNode): Room | null {
    const padding = 2;
    const availableWidth = node.width - padding * 2;
    const availableHeight = node.height - padding * 2;

    if (availableWidth < this.MIN_ROOM_SIZE || availableHeight < this.MIN_ROOM_SIZE) {
      return null;
    }

    const roomWidth = Math.min(
      this.MAX_ROOM_SIZE,
      this.MIN_ROOM_SIZE + Math.floor(Math.random() * Math.min(availableWidth - this.MIN_ROOM_SIZE + 1, 6))
    );
    const roomHeight = Math.min(
      this.MAX_ROOM_SIZE,
      this.MIN_ROOM_SIZE + Math.floor(Math.random() * Math.min(availableHeight - this.MIN_ROOM_SIZE + 1, 6))
    );

    const roomX = node.x + padding + Math.floor(Math.random() * (availableWidth - roomWidth + 1));
    const roomY = node.y + padding + Math.floor(Math.random() * (availableHeight - roomHeight + 1));

    this.roomIdCounter++;

    return {
      x: roomX,
      y: roomY,
      width: roomWidth,
      height: roomHeight,
      centerX: Math.floor(roomX + roomWidth / 2),
      centerY: Math.floor(roomY + roomHeight / 2),
      id: this.roomIdCounter,
    };
  }

  private drawRooms(tiles: Tile[][], rooms: Room[]): void {
    for (const room of rooms) {
      for (let y = room.y; y < room.y + room.height; y++) {
        for (let x = room.x; x < room.x + room.width; x++) {
          if (y >= 0 && y < this.mapHeight && x >= 0 && x < this.mapWidth) {
            tiles[y][x].type = 'floor';
          }
        }
      }
    }
  }

  private connectRooms(tiles: Tile[][], node: BSPNode): void {
    if (node.isLeaf() || !node.left || !node.right) return;

    this.connectRooms(tiles, node.left);
    this.connectRooms(tiles, node.right);

    const leftRoom = this.getRoomFromNode(node.left);
    const rightRoom = this.getRoomFromNode(node.right);

    if (leftRoom && rightRoom) {
      this.createCorridor(tiles, leftRoom, rightRoom);
    }
  }

  private getRoomFromNode(node: BSPNode): Room | null {
    if (node.room) return node.room;
    let leftRoom: Room | null = null;
    let rightRoom: Room | null = null;
    if (node.left) leftRoom = this.getRoomFromNode(node.left);
    if (node.right) rightRoom = this.getRoomFromNode(node.right);
    return leftRoom || rightRoom;
  }

  private createCorridor(tiles: Tile[][], roomA: Room, roomB: Room): void {
    const x1 = roomA.centerX;
    const y1 = roomA.centerY;
    const x2 = roomB.centerX;
    const y2 = roomB.centerY;

    if (Math.random() < 0.5) {
      this.drawHorizontalCorridor(tiles, x1, x2, y1);
      this.drawVerticalCorridor(tiles, y1, y2, x2);
    } else {
      this.drawVerticalCorridor(tiles, y1, y2, x1);
      this.drawHorizontalCorridor(tiles, x1, x2, y2);
    }
  }

  private drawHorizontalCorridor(tiles: Tile[][], x1: number, x2: number, y: number): void {
    const startX = Math.min(x1, x2);
    const endX = Math.max(x1, x2);

    for (let x = startX; x <= endX; x++) {
      this.setCorridorTile(tiles, x, y);
      this.setCorridorTile(tiles, x, y + 1);
    }
  }

  private drawVerticalCorridor(tiles: Tile[][], y1: number, y2: number, x: number): void {
    const startY = Math.min(y1, y2);
    const endY = Math.max(y1, y2);

    for (let y = startY; y <= endY; y++) {
      this.setCorridorTile(tiles, x, y);
      this.setCorridorTile(tiles, x + 1, y);
    }
  }

  private setCorridorTile(tiles: Tile[][], x: number, y: number): void {
    if (y >= 0 && y < this.mapHeight && x >= 0 && x < this.mapWidth) {
      if (tiles[y][x].type === 'wall') {
        tiles[y][x].type = 'corridor';
      }
    }
  }

  private sortRoomsByPosition(rooms: Room[]): Room[] {
    return [...rooms].sort((a, b) => {
      const aDist = a.x + a.y;
      const bDist = b.x + b.y;
      return aDist - bDist;
    });
  }

  getMiddleRooms(rooms: Room[]): Room[] {
    if (rooms.length <= 2) return rooms.slice(1);

    const midIndex = Math.floor(rooms.length / 2);
    const result: Room[] = [];
    const count = Math.min(3, Math.floor(rooms.length / 3));

    for (let i = midIndex - count; i <= midIndex + count && i < rooms.length; i++) {
      if (i >= 0) {
        result.push(rooms[i]);
      }
    }

    return result.slice(0, 2);
  }
}
