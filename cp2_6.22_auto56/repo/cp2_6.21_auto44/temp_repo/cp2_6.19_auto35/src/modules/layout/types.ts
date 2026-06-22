export type WallType = 'rectangle' | 'l-shape';

export interface Point {
  x: number;
  y: number;
}

export interface Wall {
  id: string;
  type: WallType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  artworks: ArtworkOnWall[];
}

export interface ArtworkOnWall {
  id: string;
  artworkId: string;
  positionOnWall: number;
}

export type Orientation = 'portrait' | 'landscape' | 'square';

export interface Artwork {
  id: string;
  name: string;
  thumbnail: string;
  width: number;
  height: number;
  orientation: Orientation;
  description: string;
  createdAt: string;
  tags: string[];
  note: string;
}

export type ResizeCorner = 'nw' | 'ne' | 'sw' | 'se';

export interface CanvasViewport {
  offsetX: number;
  offsetY: number;
  scale: number;
}
