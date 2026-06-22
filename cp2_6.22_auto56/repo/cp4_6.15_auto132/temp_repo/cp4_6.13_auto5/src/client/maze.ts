import Phaser from 'phaser';
import { MazeData, MAZE_SIZE, CELL_WALL, COLORS } from './types/game.js';

export class MazeRenderer {
  private scene: Phaser.Scene;
  private maze: MazeData | null = null;
  private cellSize: number = 0;
  private offsetX: number = 0;
  private offsetY: number = 0;
  private wallGraphics: Phaser.GameObjects.Graphics | null = null;
  private floorGraphics: Phaser.GameObjects.Graphics | null = null;
  private pulseTween: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  setMaze(maze: MazeData): void {
    this.maze = maze;
    this.calculateDimensions();
  }

  calculateDimensions(): void {
    const { width, height } = this.scene.scale;
    const maxMazeWidth = width * 0.85;
    const maxMazeHeight = height * 0.75;

    this.cellSize = Math.floor(Math.min(maxMazeWidth / MAZE_SIZE, maxMazeHeight / MAZE_SIZE));
    this.cellSize = Math.max(20, Math.min(50, this.cellSize));

    const mazePixelWidth = this.cellSize * MAZE_SIZE;
    const mazePixelHeight = this.cellSize * MAZE_SIZE;

    this.offsetX = (width - mazePixelWidth) / 2;
    this.offsetY = (height - mazePixelHeight) / 2 + height * 0.05;
  }

  render(): void {
    if (!this.maze) return;

    this.clear();
    this.renderFloor();
    this.renderWalls();
    this.renderStartEndMarkers();
    this.startPulseAnimation();
  }

  private renderFloor(): void {
    this.floorGraphics = this.scene.add.graphics();

    this.floorGraphics.fillStyle(COLORS.FLOOR, 0.6);

    for (let y = 0; y < MAZE_SIZE; y++) {
      for (let x = 0; x < MAZE_SIZE; x++) {
        if (this.maze![y][x] !== CELL_WALL) {
          const px = this.offsetX + x * this.cellSize;
          const py = this.offsetY + y * this.cellSize;

          this.floorGraphics.fillRect(px, py, this.cellSize, this.cellSize);

          this.floorGraphics.lineStyle(1, COLORS.NEON_BLUE, 0.1);
          this.floorGraphics.strokeRect(px, py, this.cellSize, this.cellSize);
        }
      }
    }
  }

  private renderWalls(): void {
    this.wallGraphics = this.scene.add.graphics();

    for (let y = 0; y < MAZE_SIZE; y++) {
      for (let x = 0; x < MAZE_SIZE; x++) {
        if (this.maze![y][x] === CELL_WALL) {
          this.drawWall(x, y);
        }
      }
    }
  }

  private drawWall(x: number, y: number): void {
    if (!this.wallGraphics) return;

    const px = this.offsetX + x * this.cellSize;
    const py = this.offsetY + y * this.cellSize;
    const padding = 1;

    const isLeftPath = x > 0 && this.maze![y][x - 1] !== CELL_WALL;
    const isRightPath = x < MAZE_SIZE - 1 && this.maze![y][x + 1] !== CELL_WALL;
    const isTopPath = y > 0 && this.maze![y - 1][x] !== CELL_WALL;
    const isBottomPath = y < MAZE_SIZE - 1 && this.maze![y + 1][x] !== CELL_WALL;

    const lineWidth = 3;
    const glowIntensity = 0.8;

    if (x < MAZE_SIZE / 2) {
      this.wallGraphics.lineStyle(lineWidth, COLORS.NEON_BLUE, glowIntensity);
    } else if (x > MAZE_SIZE / 2) {
      this.wallGraphics.lineStyle(lineWidth, COLORS.NEON_PINK, glowIntensity);
    } else {
      const gradient = (y / MAZE_SIZE) > 0.5 ? COLORS.NEON_PINK : COLORS.NEON_BLUE;
      this.wallGraphics.lineStyle(lineWidth, gradient, glowIntensity);
    }

    if (!isLeftPath) {
      this.wallGraphics.beginPath();
      this.wallGraphics.moveTo(px, py + padding);
      this.wallGraphics.lineTo(px, py + this.cellSize - padding);
      this.wallGraphics.stroke();
    }

    if (!isRightPath) {
      this.wallGraphics.beginPath();
      this.wallGraphics.moveTo(px + this.cellSize, py + padding);
      this.wallGraphics.lineTo(px + this.cellSize, py + this.cellSize - padding);
      this.wallGraphics.stroke();
    }

    if (!isTopPath) {
      this.wallGraphics.beginPath();
      this.wallGraphics.moveTo(px + padding, py);
      this.wallGraphics.lineTo(px + this.cellSize - padding, py);
      this.wallGraphics.stroke();
    }

    if (!isBottomPath) {
      this.wallGraphics.beginPath();
      this.wallGraphics.moveTo(px + padding, py + this.cellSize);
      this.wallGraphics.lineTo(px + this.cellSize - padding, py + this.cellSize);
      this.wallGraphics.stroke();
    }
  }

  private renderStartEndMarkers(): void {
    const graphics = this.scene.add.graphics();

    const startPx = this.offsetX + 0.5 * this.cellSize;
    const startPy = this.offsetY + 0.5 * this.cellSize;

    graphics.fillStyle(COLORS.NEON_BLUE, 0.3);
    graphics.fillCircle(startPx, startPy, this.cellSize * 0.4);

    graphics.lineStyle(2, COLORS.NEON_BLUE, 1);
    graphics.strokeCircle(startPx, startPy, this.cellSize * 0.4);

    const endPx = this.offsetX + (MAZE_SIZE - 0.5) * this.cellSize;
    const endPy = this.offsetY + (MAZE_SIZE - 0.5) * this.cellSize;

    graphics.fillStyle(COLORS.NEON_PINK, 0.3);
    graphics.fillCircle(endPx, endPy, this.cellSize * 0.4);

    graphics.lineStyle(2, COLORS.NEON_PINK, 1);
    graphics.strokeCircle(endPx, endPy, this.cellSize * 0.4);

    const startText = this.scene.add.text(startPx, startPy - this.cellSize * 0.6, 'START', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: `${Math.max(10, this.cellSize * 0.25)}px`,
      color: COLORS.NEON_BLUE
    });
    startText.setOrigin(0.5);
    startText.setShadow(0, 0, COLORS.NEON_BLUE, 10);

    const endText = this.scene.add.text(endPx, endPy - this.cellSize * 0.6, 'END', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: `${Math.max(10, this.cellSize * 0.25)}px`,
      color: COLORS.NEON_PINK
    });
    endText.setOrigin(0.5);
    endText.setShadow(0, 0, COLORS.NEON_PINK, 10);
  }

  private startPulseAnimation(): void {
    if (this.pulseTween) {
      this.pulseTween.remove();
    }

    let pulsePhase = 0;

    this.pulseTween = this.scene.tweens.addCounter({
      from: 0,
      to: Math.PI * 2,
      duration: 3000,
      repeat: -1,
      onUpdate: (tween) => {
        const val = tween.getValue();
        pulsePhase = val !== null ? val : pulsePhase;
        if (this.wallGraphics) {
          const alpha = 0.6 + Math.sin(pulsePhase) * 0.2;
          this.wallGraphics.setAlpha(alpha);
        }
      }
    });
  }

  gridToPixel(gridX: number, gridY: number): { x: number; y: number } {
    return {
      x: this.offsetX + (gridX + 0.5) * this.cellSize,
      y: this.offsetY + (gridY + 0.5) * this.cellSize
    };
  }

  getCellSize(): number {
    return this.cellSize;
  }

  clear(): void {
    if (this.wallGraphics) {
      this.wallGraphics.destroy();
      this.wallGraphics = null;
    }
    if (this.floorGraphics) {
      this.floorGraphics.destroy();
      this.floorGraphics = null;
    }
    if (this.pulseTween) {
      this.pulseTween.remove();
      this.pulseTween = null;
    }
  }

  destroy(): void {
    this.clear();
  }
}
