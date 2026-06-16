export enum TileType {
  WALL = 0,
  FLOOR = 1,
  CORRIDOR = 2,
}

export type RoomType = 'normal' | 'chest' | 'exit' | 'start';

export interface Room {
  x: number;
  y: number;
  gridX: number;
  gridY: number;
  width: number;
  height: number;
  type: RoomType;
  visited: boolean;
  corridors: {
    north?: boolean;
    south?: boolean;
    east?: boolean;
    west?: boolean;
  };
}

export interface MapData {
  width: number;
  height: number;
  tileSize: number;
  tiles: TileType[][];
  rooms: Room[];
  gridSize: number;
  roomSize: number;
}

export interface Position {
  x: number;
  y: number;
}
