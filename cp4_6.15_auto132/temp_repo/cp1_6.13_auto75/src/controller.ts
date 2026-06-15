import type { HexCoord } from './types';
import { GameLoop } from './gameLoop';
import { HEX_SIZE, pixelToHex, getGridOffset, GRID_WIDTH, GRID_HEIGHT } from './config';

export class Controller {
  private canvas: HTMLCanvasElement;
  private gameLoop: GameLoop;
  private gridOffset: { x: number; y: number };

  constructor(canvas: HTMLCanvasElement, gameLoop: GameLoop) {
    this.canvas = canvas;
    this.gameLoop = gameLoop;
    this.gridOffset = getGridOffset();
    this.bindEvents();
  }

  private bindEvents(): void {
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave);
    this.canvas.addEventListener('click', this.handleClick);
  }

  public destroy(): void {
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mouseleave', this.handleMouseLeave);
    this.canvas.removeEventListener('click', this.handleClick);
  }

  private getCanvasCoords(e: MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  private screenToGrid(screenX: number, screenY: number): HexCoord | null {
    const x = screenX - this.gridOffset.x;
    const y = screenY - this.gridOffset.y;
    const hex = pixelToHex(x, y, HEX_SIZE);
    if (hex.q < 0 || hex.q >= GRID_WIDTH || hex.r < 0 || hex.r >= GRID_HEIGHT) {
      return null;
    }
    return hex;
  }

  private handleMouseMove = (e: MouseEvent): void => {
    const { x, y } = this.getCanvasCoords(e);
    const hex = this.screenToGrid(x, y);
    this.gameLoop.setHoveredCell(hex);
  };

  private handleMouseLeave = (): void => {
    this.gameLoop.setHoveredCell(null);
  };

  private handleClick = (e: MouseEvent): void => {
    const { x, y } = this.getCanvasCoords(e);
    const hex = this.screenToGrid(x, y);
    if (!hex) {
      this.gameLoop.selectTower(null);
      this.gameLoop.selectTowerType(null);
      return;
    }

    const state = this.gameLoop.getState();
    const clickedTower = state.towers.find(
      t => t.position.q === hex.q && t.position.r === hex.r
    );

    if (clickedTower) {
      this.gameLoop.selectTower(clickedTower);
      this.gameLoop.selectTowerType(null);
    } else if (state.selectedTowerType) {
      this.gameLoop.tryPlaceTower(hex);
    } else {
      this.gameLoop.selectTower(null);
    }
  };
}
