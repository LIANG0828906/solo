import { v4 as uuidv4 } from 'uuid';
import { Wall, Artwork, WallType, WallResizeCorner, ArtworkOnWall } from './types';

export class LayoutEngine {
  private walls: Wall[] = [];
  private artworks: Artwork[] = [];

  constructor(walls: Wall[] = [], artworks: Artwork[] = []) {
    this.walls = walls;
    this.artworks = artworks;
  }

  getWalls(): Wall[] {
    return [...this.walls];
  }

  getArtworks(): Artwork[] {
    return [...this.artworks];
  }

  getWallById(id: string): Wall | undefined {
    return this.walls.find((w) => w.id === id);
  }

  getArtworkById(id: string): Artwork | undefined {
    return this.artworks.find((a) => a.id === id);
  }

  addWall(type: WallType, x: number, y: number, width: number, height: number): Wall {
    const wall: Wall = {
      id: uuidv4(),
      type,
      x,
      y,
      width,
      height,
      rotation: 0,
      artworks: [],
    };
    this.walls.push(wall);
    return wall;
  }

  removeWall(id: string): boolean {
    const index = this.walls.findIndex((w) => w.id === id);
    if (index !== -1) {
      this.walls.splice(index, 1);
      return true;
    }
    return false;
  }

  moveWall(id: string, x: number, y: number): Wall | undefined {
    const wall = this.walls.find((w) => w.id === id);
    if (wall) {
      wall.x = x;
      wall.y = y;
      return { ...wall };
    }
    return undefined;
  }

  getWallCenter(wall: Wall): { x: number; y: number } {
    return {
      x: wall.x + wall.width / 2,
      y: wall.y + wall.height / 2,
    };
  }

  rotateWall(id: string, angle: number): Wall | undefined {
    const wall = this.walls.find((w) => w.id === id);
    if (wall) {
      wall.rotation = angle % 360;
      if (wall.rotation < 0) wall.rotation += 360;
      return { ...wall };
    }
    return undefined;
  }

  resizeWall(
    id: string,
    corner: WallResizeCorner,
    deltaX: number,
    deltaY: number
  ): Wall | undefined {
    const wall = this.walls.find((w) => w.id === id);
    if (!wall) return undefined;

    const minSize = 40;
    const center = this.getWallCenter(wall);
    const rad = (wall.rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const rotatedDeltaX = deltaX * cos + deltaY * sin;
    const rotatedDeltaY = -deltaX * sin + deltaY * cos;

    let newWidth = wall.width;
    let newHeight = wall.height;
    let newX = wall.x;
    let newY = wall.y;

    switch (corner) {
      case 'bottom-right':
        newWidth = Math.max(minSize, wall.width + rotatedDeltaX);
        newHeight = Math.max(minSize, wall.height + rotatedDeltaY);
        break;
      case 'bottom-left':
        newWidth = Math.max(minSize, wall.width - rotatedDeltaX);
        newHeight = Math.max(minSize, wall.height + rotatedDeltaY);
        newX = wall.x + (wall.width - newWidth);
        break;
      case 'top-right':
        newWidth = Math.max(minSize, wall.width + rotatedDeltaX);
        newHeight = Math.max(minSize, wall.height - rotatedDeltaY);
        newY = wall.y + (wall.height - newHeight);
        break;
      case 'top-left':
        newWidth = Math.max(minSize, wall.width - rotatedDeltaX);
        newHeight = Math.max(minSize, wall.height - rotatedDeltaY);
        newX = wall.x + (wall.width - newWidth);
        newY = wall.y + (wall.height - newHeight);
        break;
    }

    wall.x = newX;
    wall.y = newY;
    wall.width = newWidth;
    wall.height = newHeight;

    void center;

    return { ...wall };
  }

  adhereArtwork(wallId: string, artworkId: string, positionOnWall: number): boolean {
    const wall = this.walls.find((w) => w.id === wallId);
    const artwork = this.artworks.find((a) => a.id === artworkId);
    if (!wall || !artwork) return false;

    this.walls.forEach((w) => {
      w.artworks = w.artworks.filter((a) => a.artworkId !== artworkId);
    });

    const insertIndex = wall.artworks.findIndex(
      (a) => a.positionOnWall > positionOnWall
    );
    const newArtworkOnWall: ArtworkOnWall = {
      artworkId,
      positionOnWall,
    };

    if (insertIndex === -1) {
      wall.artworks.push(newArtworkOnWall);
    } else {
      wall.artworks.splice(insertIndex, 0, newArtworkOnWall);
    }

    this.recalculateArtworkPositions(wallId);
    return true;
  }

  removeArtworkFromWall(wallId: string, artworkId: string): boolean {
    const wall = this.walls.find((w) => w.id === wallId);
    if (!wall) return false;

    const initialLength = wall.artworks.length;
    wall.artworks = wall.artworks.filter((a) => a.artworkId !== artworkId);

    if (wall.artworks.length !== initialLength) {
      this.recalculateArtworkPositions(wallId);
      return true;
    }
    return false;
  }

  private recalculateArtworkPositions(wallId: string): void {
    const wall = this.walls.find((w) => w.id === wallId);
    if (!wall || wall.artworks.length === 0) return;

    const count = wall.artworks.length;
    const spacing = 1 / (count + 1);

    wall.artworks.forEach((artwork, index) => {
      artwork.positionOnWall = spacing * (index + 1);
    });
  }

  calculateSpacing(wallId: string): number[] {
    const wall = this.walls.find((w) => w.id === wallId);
    if (!wall || wall.artworks.length === 0) return [];

    return wall.artworks.map((a) => a.positionOnWall);
  }

  getSnapPoints(wallId: string): { x: number; y: number; position: number }[] {
    const wall = this.walls.find((w) => w.id === wallId);
    if (!wall) return [];

    const center = this.getWallCenter(wall);
    const rad = (wall.rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const points: { x: number; y: number; position: number }[] = [];
    const numPoints = 5;

    for (let i = 1; i <= numPoints; i++) {
      const t = i / (numPoints + 1);
      const localX = -wall.width / 2 + wall.width * t;
      const localY = -wall.height / 2;

      const worldX = center.x + localX * cos - localY * sin;
      const worldY = center.y + localX * sin + localY * cos;

      points.push({ x: worldX, y: worldY, position: t });
    }

    return points;
  }

  getArtworkPositionOnWall(
    wall: Wall,
    artwork: Artwork,
    positionOnWall: number
  ): { x: number; y: number; rotation: number } {
    const center = this.getWallCenter(wall);
    const rad = (wall.rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const localX = -wall.width / 2 + wall.width * positionOnWall;
    const localY = -wall.height / 2 - artwork.height / 2 - 10;

    const worldX = center.x + localX * cos - localY * sin;
    const worldY = center.y + localX * sin + localY * cos;

    return {
      x: worldX - artwork.width / 2,
      y: worldY - artwork.height / 2,
      rotation: wall.rotation,
    };
  }

  findWallAtPoint(x: number, y: number): Wall | undefined {
    for (let i = this.walls.length - 1; i >= 0; i--) {
      const wall = this.walls[i];
      if (this.isPointInWall(x, y, wall)) {
        return wall;
      }
    }
    return undefined;
  }

  private isPointInWall(x: number, y: number, wall: Wall): boolean {
    const center = this.getWallCenter(wall);
    const rad = (-wall.rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const localX = (x - center.x) * cos - (y - center.y) * sin;
    const localY = (x - center.x) * sin + (y - center.y) * cos;

    return (
      Math.abs(localX) <= wall.width / 2 &&
      Math.abs(localY) <= wall.height / 2
    );
  }

  findNearestSnapPoint(
    x: number,
    y: number,
    maxDistance: number = 30
  ): { wallId: string; position: number; distance: number } | null {
    let nearest: { wallId: string; position: number; distance: number } | null = null;

    for (const wall of this.walls) {
      const snapPoints = this.getSnapPoints(wall.id);
      for (const point of snapPoints) {
        const dist = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2);
        if (dist < maxDistance && (!nearest || dist < nearest.distance)) {
          nearest = { wallId: wall.id, position: point.position, distance: dist };
        }
      }
    }

    return nearest;
  }

  updateArtworkNotes(artworkId: string, notes: string): Artwork | undefined {
    const artwork = this.artworks.find((a) => a.id === artworkId);
    if (artwork) {
      artwork.notes = notes;
      return { ...artwork };
    }
    return undefined;
  }

  setWalls(walls: Wall[]): void {
    this.walls = walls.map((w) => ({ ...w, artworks: [...w.artworks] }));
  }

  setArtworks(artworks: Artwork[]): void {
    this.artworks = artworks.map((a) => ({ ...a, tags: [...a.tags] }));
  }
}
