import { v4 as uuidv4 } from 'uuid';
import type { Wall, ArtworkOnWall, Artwork, WallType, ResizeCorner, Point } from './types';

export class LayoutEngine {
  private walls: Wall[] = [];
  private artworks: Map<string, Artwork> = new Map();

  setWalls(walls: Wall[]): void {
    this.walls = walls;
  }

  getWalls(): Wall[] {
    return this.walls;
  }

  setArtworks(artworks: Artwork[]): void {
    this.artworks.clear();
    artworks.forEach((a) => this.artworks.set(a.id, a));
  }

  getArtworks(): Artwork[] {
    return Array.from(this.artworks.values());
  }

  getArtworkById(id: string): Artwork | undefined {
    return this.artworks.get(id);
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

  removeWall(wallId: string): boolean {
    const index = this.walls.findIndex((w) => w.id === wallId);
    if (index !== -1) {
      this.walls.splice(index, 1);
      return true;
    }
    return false;
  }

  moveWall(wallId: string, x: number, y: number): Wall | null {
    const wall = this.walls.find((w) => w.id === wallId);
    if (wall) {
      wall.x = x;
      wall.y = y;
      return wall;
    }
    return null;
  }

  resizeWall(wallId: string, corner: ResizeCorner, deltaX: number, deltaY: number): Wall | null {
    const wall = this.walls.find((w) => w.id === wallId);
    if (!wall) return null;

    const cos = Math.cos(wall.rotation);
    const sin = Math.sin(wall.rotation);

    let scaleX = 1;
    let scaleY = 1;
    let offsetX = 0;
    let offsetY = 0;

    const halfW = wall.width / 2;
    const halfH = wall.height / 2;

    if (corner === 'se') {
      scaleX = (halfW + deltaX * cos + deltaY * sin) / halfW;
      scaleY = (halfH - deltaX * sin + deltaY * cos) / halfH;
    } else if (corner === 'sw') {
      scaleX = (halfW - deltaX * cos - deltaY * sin) / halfW;
      scaleY = (halfH - deltaX * sin + deltaY * cos) / halfH;
      offsetX = deltaX;
      offsetY = deltaY;
    } else if (corner === 'ne') {
      scaleX = (halfW + deltaX * cos + deltaY * sin) / halfW;
      scaleY = (halfH + deltaX * sin - deltaY * cos) / halfH;
      offsetX = -deltaX * cos * 0;
    } else if (corner === 'nw') {
      scaleX = (halfW - deltaX * cos - deltaY * sin) / halfW;
      scaleY = (halfH + deltaX * sin - deltaY * cos) / halfH;
    }

    wall.width = Math.max(20, wall.width * scaleX);
    wall.height = Math.max(20, wall.height * scaleY);

    const centerDeltaX = (deltaX * cos + deltaY * sin) / 2;
    const centerDeltaY = (-deltaX * sin + deltaY * cos) / 2;

    if (corner === 'nw') {
      wall.x += centerDeltaX;
      wall.y += centerDeltaY;
    } else if (corner === 'ne') {
      wall.x -= centerDeltaX;
      wall.y += centerDeltaY;
    } else if (corner === 'sw') {
      wall.x += centerDeltaX;
      wall.y -= centerDeltaY;
    }

    return wall;
  }

  rotateWall(wallId: string, angle: number): Wall | null {
    const wall = this.walls.find((w) => w.id === wallId);
    if (wall) {
      wall.rotation = angle;
      return wall;
    }
    return null;
  }

  adhereArtwork(wallId: string, artworkId: string, positionOnWall: number): Wall | null {
    const wall = this.walls.find((w) => w.id === wallId);
    if (!wall) return null;

    const existing = wall.artworks.find((a) => a.artworkId === artworkId);
    if (existing) {
      existing.positionOnWall = positionOnWall;
    } else {
      wall.artworks.push({
        id: uuidv4(),
        artworkId,
        positionOnWall,
      });
    }

    this.distributeArtworks(wallId);
    return wall;
  }

  removeArtworkFromWall(wallId: string, artworkOnWallId: string): boolean {
    const wall = this.walls.find((w) => w.id === wallId);
    if (!wall) return false;

    const index = wall.artworks.findIndex((a) => a.id === artworkOnWallId);
    if (index !== -1) {
      wall.artworks.splice(index, 1);
      this.distributeArtworks(wallId);
      return true;
    }
    return false;
  }

  distributeArtworks(wallId: string): void {
    const wall = this.walls.find((w) => w.id === wallId);
    if (!wall || wall.artworks.length === 0) return;

    const count = wall.artworks.length;
    if (count === 1) {
      wall.artworks[0].positionOnWall = 0.5;
      return;
    }

    wall.artworks.sort((a, b) => a.positionOnWall - b.positionOnWall);

    const padding = 0.05;
    const usableRange = 1 - 2 * padding;
    const step = usableRange / (count - 1);

    wall.artworks.forEach((artwork, index) => {
      artwork.positionOnWall = padding + step * index;
    });
  }

  getWallCorners(wall: Wall): Point[] {
    const hw = wall.width / 2;
    const hh = wall.height / 2;
    const cos = Math.cos(wall.rotation);
    const sin = Math.sin(wall.rotation);

    const corners: Point[] = [
      { x: -hw, y: -hh },
      { x: hw, y: -hh },
      { x: hw, y: hh },
      { x: -hw, y: hh },
    ];

    return corners.map((c) => ({
      x: wall.x + c.x * cos - c.y * sin,
      y: wall.y + c.x * sin + c.y * cos,
    }));
  }

  getWallBoundingBox(wall: Wall): { minX: number; maxX: number; minY: number; maxY: number } {
    const corners = this.getWallCorners(wall);
    const xs = corners.map((c) => c.x);
    const ys = corners.map((c) => c.y);
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys),
    };
  }

  pointInWall(px: number, py: number, wall: Wall): boolean {
    const cos = Math.cos(-wall.rotation);
    const sin = Math.sin(-wall.rotation);

    const localX = (px - wall.x) * cos - (py - wall.y) * sin;
    const localY = (px - wall.x) * sin + (py - wall.y) * cos;

    const hw = wall.width / 2;
    const hh = wall.height / 2;

    return Math.abs(localX) <= hw && Math.abs(localY) <= hh;
  }

  getClosestPointOnWall(px: number, py: number, wall: Wall): { point: Point; positionOnWall: number; distance: number } {
    const cos = Math.cos(-wall.rotation);
    const sin = Math.sin(-wall.rotation);

    const localX = (px - wall.x) * cos - (py - wall.y) * sin;
    const localY = (px - wall.x) * sin + (py - wall.y) * cos;

    const hw = wall.width / 2;
    const hh = wall.height / 2;

    let closestLocal: Point;
    let positionOnWall: number;

    if (Math.abs(localX) <= hw && Math.abs(localY) <= hh) {
      const distTop = Math.abs(localY + hh);
      const distBottom = Math.abs(localY - hh);
      const distLeft = Math.abs(localX + hw);
      const distRight = Math.abs(localX - hw);

      const minDist = Math.min(distTop, distBottom, distLeft, distRight);

      if (minDist === distTop) {
        closestLocal = { x: Math.max(-hw, Math.min(hw, localX)), y: -hh };
        positionOnWall = (localX + hw) / wall.width;
      } else if (minDist === distBottom) {
        closestLocal = { x: Math.max(-hw, Math.min(hw, localX)), y: hh };
        positionOnWall = (localX + hw) / wall.width;
      } else if (minDist === distLeft) {
        closestLocal = { x: -hw, y: Math.max(-hh, Math.min(hh, localY)) };
        positionOnWall = (localY + hh) / wall.height;
      } else {
        closestLocal = { x: hw, y: Math.max(-hh, Math.min(hh, localY)) };
        positionOnWall = (localY + hh) / wall.height;
      }
    } else {
      const clampedX = Math.max(-hw, Math.min(hw, localX));
      const clampedY = Math.max(-hh, Math.min(hh, localY));

      if (Math.abs(localX) > hw && Math.abs(localY) > hh) {
        closestLocal = { x: clampedX, y: clampedY };
        positionOnWall = clampedY < 0 ? 0 : 1;
      } else if (Math.abs(localX) > hw) {
        closestLocal = { x: clampedX, y: localY };
        positionOnWall = (localY + hh) / wall.height;
      } else {
        closestLocal = { x: localX, y: clampedY };
        positionOnWall = (localX + hw) / wall.width;
      }
    }

    const cosBack = Math.cos(wall.rotation);
    const sinBack = Math.sin(wall.rotation);
    const worldX = wall.x + closestLocal.x * cosBack - closestLocal.y * sinBack;
    const worldY = wall.y + closestLocal.x * sinBack + closestLocal.y * cosBack;

    const distance = Math.sqrt((px - worldX) ** 2 + (py - worldY) ** 2);

    return {
      point: { x: worldX, y: worldY },
      positionOnWall: Math.max(0, Math.min(1, positionOnWall)),
      distance,
    };
  }

  getArtworkPositionOnWall(wall: Wall, artworkOnWall: ArtworkOnWall): Point {
    const artwork = this.artworks.get(artworkOnWall.artworkId);
    if (!artwork) return { x: wall.x, y: wall.y };

    const hw = wall.width / 2;
    const position = artworkOnWall.positionOnWall;
    const offsetX = -hw + wall.width * position;

    const cos = Math.cos(wall.rotation);
    const sin = Math.sin(wall.rotation);

    return {
      x: wall.x + offsetX * cos - (-wall.height / 2 + 20) * sin,
      y: wall.y + offsetX * sin + (-wall.height / 2 + 20) * cos,
    };
  }

  findWallAtPoint(x: number, y: number): Wall | null {
    for (let i = this.walls.length - 1; i >= 0; i--) {
      if (this.pointInWall(x, y, this.walls[i])) {
        return this.walls[i];
      }
    }
    return null;
  }

  updateArtworkNote(artworkId: string, note: string): Artwork | undefined {
    const artwork = this.artworks.get(artworkId);
    if (artwork) {
      artwork.note = note;
    }
    return artwork;
  }
}
