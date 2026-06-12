import type { Position, TileType } from '../../store/types';
import { useGameStore } from '../../store/gameStore';

const CELL_SIZE = 28;
const VISIBLE_RADIUS = 3;

export class MapManager {
  public getCellSize(): number {
    return CELL_SIZE;
  }

  public getVisibleRadius(): number {
    return VISIBLE_RADIUS;
  }

  public getMapSize(): number {
    return useGameStore.getState().mapSize;
  }

  public getTile(x: number, y: number): TileType | null {
    const state = useGameStore.getState();
    if (x < 0 || x >= state.mapSize || y < 0 || y >= state.mapSize) {
      return null;
    }
    return state.mapData[y][x];
  }

  public isFogged(x: number, y: number): boolean {
    const state = useGameStore.getState();
    if (x < 0 || x >= state.mapSize || y < 0 || y >= state.mapSize) {
      return true;
    }
    return state.fog[y][x];
  }

  public getPlayerPosition(): Position {
    return useGameStore.getState().playerPosition;
  }

  public getVisibleArea(): { startX: number; startY: number; endX: number; endY: number } {
    const player = this.getPlayerPosition();
    const mapSize = this.getMapSize();
    return {
      startX: Math.max(0, player.x - VISIBLE_RADIUS),
      startY: Math.max(0, player.y - VISIBLE_RADIUS),
      endX: Math.min(mapSize - 1, player.x + VISIBLE_RADIUS),
      endY: Math.min(mapSize - 1, player.y + VISIBLE_RADIUS),
    };
  }

  public getTileColor(tile: TileType): string {
    switch (tile) {
      case 'ocean':
        return '#0d3b66';
      case 'wreck':
        return '#6b4423';
      case 'trench':
        return '#0a0a0a';
      default:
        return '#0d3b66';
    }
  }

  public getTileLabel(tile: TileType): string {
    switch (tile) {
      case 'ocean':
        return '海洋';
      case 'wreck':
        return '沉船残骸';
      case 'trench':
        return '深海沟';
      default:
        return '';
    }
  }

  public isPlayerAt(x: number, y: number): boolean {
    const pos = this.getPlayerPosition();
    return pos.x === x && pos.y === y;
  }

  public isWreckSearched(x: number, y: number): boolean {
    return useGameStore.getState().isWreckSearched(x, y);
  }

  public isClickableTile(x: number, y: number): boolean {
    if (this.isFogged(x, y)) return false;
    const tile = this.getTile(x, y);
    return tile === 'wreck';
  }

  public canMoveTo(x: number, y: number): boolean {
    const tile = this.getTile(x, y);
    if (tile === null) return false;
    if (tile === 'trench') return false;
    return true;
  }

  public getGridPixelSize(): { width: number; height: number } {
    const mapSize = this.getMapSize();
    return {
      width: mapSize * CELL_SIZE,
      height: mapSize * CELL_SIZE,
    };
  }

  public getVisiblePixelSize(): { width: number; height: number } {
    const visibleCount = VISIBLE_RADIUS * 2 + 1;
    return {
      width: visibleCount * CELL_SIZE,
      height: visibleCount * CELL_SIZE,
    };
  }

  public screenToGrid(screenX: number, screenY: number, viewportOffset: { x: number; y: number }): Position | null {
    const gridX = Math.floor((screenX - viewportOffset.x) / CELL_SIZE);
    const gridY = Math.floor((screenY - viewportOffset.y) / CELL_SIZE);
    const mapSize = this.getMapSize();
    if (gridX < 0 || gridX >= mapSize || gridY < 0 || gridY >= mapSize) {
      return null;
    }
    return { x: gridX, y: gridY };
  }
}

export const mapManager = new MapManager();
