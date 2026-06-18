export type WallType = 'rectangle' | 'L-shape';

export type ArtworkOrientation = 'portrait' | 'landscape' | 'square';

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

export interface Artwork {
  id: string;
  name: string;
  thumbnail: string;
  width: number;
  height: number;
  orientation: ArtworkOrientation;
  description: string;
  createdAt: string;
  tags: string[];
  notes: string;
}

export interface ArtworkOnWall {
  artworkId: string;
  positionOnWall: number;
}

export interface CanvasViewport {
  offsetX: number;
  offsetY: number;
  scale: number;
}

export type WallResizeCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface DragState {
  isDragging: boolean;
  type: 'wall' | 'wall-resize' | 'wall-rotate' | 'canvas' | 'artwork' | null;
  targetId: string | null;
  startX: number;
  startY: number;
  startWallX?: number;
  startWallY?: number;
  startWidth?: number;
  startHeight?: number;
  startRotation?: number;
  corner?: WallResizeCorner;
  artworkId?: string;
}
