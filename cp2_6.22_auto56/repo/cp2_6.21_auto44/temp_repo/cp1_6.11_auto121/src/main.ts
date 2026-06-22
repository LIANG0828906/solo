import { Maze, TILE_SIZE, MAZE_WIDTH, MAZE_HEIGHT } from './Maze';
import { Player } from './Player';
import { Collectible } from './Collectible';
import { Door } from './Door';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 800;
const TOTAL_COLLECTIBLES = 8;
const ENERGY_PER_DOOR = 5;

class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private maze: Maze;
  private player: Player;
  private collectibles: Collectible[] = [];
  private doors: Door[] = [];
  private collectedCount: number = 0;
  private startTime: number = performance.now();
  private lastFrameTime: number = 0;

  constructor() {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;

    this.maze = new Maze();

    let startGridX = 1;
    let startGridY = 1;
    for (let y = 1; y < this.maze.height - 1; y++) {
      for (let x = 1; x < this.maze.width - 1; x++) {
        if (this.maze.grid[y][x] === 0) {
          startGridX = x;
          startGridY = y;
          break;
        }
      }
    }

    const startX = startGridX * TILE_SIZE + TILE_SIZE / 2;
    const startY = startGridY * TILE_SIZE + TILE_SIZE / 2;
    this.player = new Player(startX, startY);

    this.collectibles = Collectible.generate(TOTAL_COLLECTIBLES, this.maze, this.player);

    this.doors = this.generateDoors();

    this.bindResize();
    this.start();
  }

  private generateDoors(): Door[] {
    const doors: Door[] = [];
    const emptyCells = this.maze.getEmptyCells();

    const startGridX = Math.floor(this.player.x / TILE_SIZE);
    const startGridY = Math.floor(this.player.y / TILE_SIZE);

    const farCells = emptyCells
      .map(cell => ({
        ...cell,
        dist: Math.abs(cell.x - startGridX) + Math.abs(cell.y - startGridY)
      }))
      .sort((a, b) => b.dist - a.dist);

    const doorPositions: { x: number; y: number }[] = [];

    for (const cell of farCells) {
      if (doorPositions.length >= 2) break;

      const directions = [
        { dx: 1, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 },
        { dx: 0, dy: -1 }
      ];

      let placed = false;
      for (const dir of directions) {
        const doorX = cell.x + dir.dx;
        const doorY = cell.y + dir.dy;

        if (doorX < 1 || doorX >= this.maze.width - 2 || doorY < 1 || doorY >= this.maze.height - 2) continue;

        const tooClose = doorPositions.some(p => {
          const d = Math.abs(p.x - doorX) + Math.abs(p.y - doorY);
          return d < 5;
        });
        if (tooClose) continue;

        if (this.maze.grid[doorY] && this.maze.grid[doorY][doorX] !== undefined) {
          doorPositions.push({ x: doorX, y: doorY });
          placed = true;
          break;
        }
      }
      if (placed) continue;
    }

    while (doorPositions.length < 2) {
      const cell = farCells[doorPositions.length] || farCells[0];
      doorPositions.push({ x: cell.x, y: cell.y });
    }

    for (const pos of doorPositions) {
      doors.push(new Door(pos.x, pos.y));
    }

    return doors;
  }

  private bindResize(): void {
    const resize = () => {
      const size = Math.min(window.innerWidth - 80, window.innerHeight - 160);
      const canvasSize = Math.max(600, Math.min(800, size));
      this.canvas.style.width = `${canvasSize}px`;
      this.canvas.style.height = `${canvasSize}px`;
    };
    window.addEventListener('resize', resize);
    resize();
  }

  private start(): void {
    this.startTime = performance.now();
    this.lastFrameTime = this.startTime;
    this.loop();
  }

  private loop = (): void => {
    const now = performance.now();
    const time = (now - this.startTime) / 1000;
    this.lastFrameTime = now;

    this.update(time);
    this.render(time);

    requestAnimationFrame(this.loop);
  };

  private update(time: number): void {
    const prevX = this.player.x;
    const prevY = this.player.y;

    this.player.update(this.maze);

    for (const door of this.doors) {
      if (door.checkCollision(this.player)) {
        this.player.x = prevX;
        this.player.y = prevY;
        break;
      }
    }

    for (const collectible of this.collectibles) {
      collectible.update(time, this.player, () => {
        this.collectedCount++;
      });
    }

    this.collectibles = this.collectibles.filter(c => !c.isDead());

    for (const door of this.doors) {
      door.update(this.player, this.collectedCount);
    }
  }

  private render(time: number): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    this.maze.render(ctx);

    for (const door of this.doors) {
      door.render(ctx, time);
    }

    for (const collectible of this.collectibles) {
      collectible.render(ctx, time);
    }

    this.player.renderGlow(ctx);
    this.player.render(ctx);

    this.renderVignette();
    this.renderMinimap();
    this.renderEnergyBar();
    this.renderCollectibleCount();
  }

  private renderVignette(): void {
    const ctx = this.ctx;
    const gradient = ctx.createRadialGradient(
      this.player.x, this.player.y, this.player.glowRadius * 0.5,
      this.player.x, this.player.y, CANVAS_WIDTH * 0.7
    );
    gradient.addColorStop(0, 'rgba(11, 12, 16, 0)');
    gradient.addColorStop(0.5, 'rgba(11, 12, 16, 0.4)');
    gradient.addColorStop(1, 'rgba(11, 12, 16, 0.95)');

    ctx.save();
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.restore();
  }

  private renderMinimap(): void {
    const ctx = this.ctx;
    const mapSize = 240;
    const mapX = 20;
    const mapY = 20;
    const cellSize = mapSize / MAZE_WIDTH;

    ctx.save();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(mapX - 2, mapY - 2, mapSize + 4, mapSize + 4);

    ctx.strokeStyle = '#2C2F33';
    ctx.lineWidth = 2;
    ctx.strokeRect(mapX - 2, mapY - 2, mapSize + 4, mapSize + 4);

    for (let y = 0; y < this.maze.height; y++) {
      for (let x = 0; x < this.maze.width; x++) {
        if (this.maze.grid[y][x] === 1) {
          ctx.fillStyle = '#1A1C20';
        } else {
          ctx.fillStyle = '#3A3E44';
        }
        ctx.fillRect(mapX + x * cellSize, mapY + y * cellSize, cellSize, cellSize);
      }
    }

    for (const collectible of this.collectibles) {
      if (collectible.collected) continue;
      const gx = collectible.x / TILE_SIZE;
      const gy = collectible.y / TILE_SIZE;
      ctx.fillStyle = '#00E5FF';
      ctx.beginPath();
      ctx.arc(mapX + gx * cellSize, mapY + gy * cellSize, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const door of this.doors) {
      const gx = door.x / TILE_SIZE + 0.5;
      const gy = door.y / TILE_SIZE + 0.5;
      ctx.fillStyle = door.isOpen() ? '#00FF00' : '#FF4444';
      ctx.beginPath();
      ctx.arc(mapX + gx * cellSize, mapY + gy * cellSize, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    const pgx = this.player.x / TILE_SIZE;
    const pgy = this.player.y / TILE_SIZE;
    ctx.fillStyle = '#FFD700';
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(mapX + pgx * cellSize, mapY + pgy * cellSize, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore();
  }

  private renderEnergyBar(): void {
    const ctx = this.ctx;
    const barWidth = 200;
    const barHeight = 16;
    const barX = CANVAS_WIDTH - barWidth - 20;
    const barY = 20;
    const segmentCount = TOTAL_COLLECTIBLES;
    const segmentWidth = (barWidth - (segmentCount - 1) * 2) / segmentCount;

    ctx.save();

    ctx.fillStyle = '#1A1C20';
    ctx.beginPath();
    ctx.roundRect(barX - 3, barY - 3, barWidth + 6, barHeight + 6, 4);
    ctx.fill();

    ctx.strokeStyle = '#2C2F33';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(barX - 3, barY - 3, barWidth + 6, barHeight + 6, 4);
    ctx.stroke();

    for (let i = 0; i < segmentCount; i++) {
      const segX = barX + i * (segmentWidth + 2);
      const filled = i < this.collectedCount;

      if (filled) {
        const gradient = ctx.createLinearGradient(segX, barY, segX, barY + barHeight);
        gradient.addColorStop(0, '#80F4FF');
        gradient.addColorStop(0.5, '#00E5FF');
        gradient.addColorStop(1, '#00B8CC');
        ctx.fillStyle = gradient;

        ctx.shadowColor = '#00E5FF';
        ctx.shadowBlur = 6;
      } else {
        ctx.fillStyle = '#2C2F33';
        ctx.shadowBlur = 0;
      }

      ctx.beginPath();
      ctx.roundRect(segX, barY, segmentWidth, barHeight, 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.fillStyle = '#80F4FF';
    ctx.font = '10px "Fira Code", monospace';
    ctx.textAlign = 'right';
    ctx.fillText('能量', barX + barWidth, barY - 6);

    ctx.restore();
  }

  private renderCollectibleCount(): void {
    const ctx = this.ctx;
    const text = `碎片：${this.collectedCount}/${TOTAL_COLLECTIBLES}`;

    ctx.save();
    ctx.font = 'bold 18px "Fira Code", monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = '#00E5FF';
    ctx.shadowColor = '#00E5FF';
    ctx.shadowBlur = 8;
    ctx.fillText(text, CANVAS_WIDTH - 20, CANVAS_HEIGHT - 20);
    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
