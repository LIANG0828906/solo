import { Stone, LadderPath } from './board';

interface StoneAnimation {
  x: number;
  y: number;
  stone: Stone;
  startTime: number;
  duration: number;
}

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private cellSize: number;
  private boardPadding: number;
  private boardSize: number;
  private gridSize: number;
  private stoneAnimations: StoneAnimation[];
  private animationFrameId: number | null;
  private ladderPath: LadderPath | null;
  private animationStartTime: number;

  constructor(canvas: HTMLCanvasElement, cellSize: number = 48) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get canvas context');
    this.ctx = ctx;
    this.cellSize = cellSize;
    this.boardPadding = 60;
    this.boardSize = 19;
    this.gridSize = (this.boardSize - 1) * this.cellSize;
    this.stoneAnimations = [];
    this.animationFrameId = null;
    this.ladderPath = null;
    this.animationStartTime = performance.now();
    
    this.resizeCanvas();
  }

  resize(newCellSize?: number): void {
    if (newCellSize !== undefined) {
      this.cellSize = newCellSize;
      this.gridSize = (this.boardSize - 1) * this.cellSize;
    }
    this.resizeCanvas();
  }

  private resizeCanvas(): void {
    const totalSize = this.gridSize + this.boardPadding * 2;
    const dpr = window.devicePixelRatio || 1;
    
    this.canvas.width = totalSize * dpr;
    this.canvas.height = totalSize * dpr;
    this.canvas.style.width = `${totalSize}px`;
    this.canvas.style.height = `${totalSize}px`;
    
    this.ctx.scale(dpr, dpr);
  }

  getCellSize(): number {
    return this.cellSize;
  }

  getBoardPadding(): number {
    return this.boardPadding;
  }

  screenToGrid(screenX: number, screenY: number): [number, number] | null {
    const rect = this.canvas.getBoundingClientRect();
    const x = screenX - rect.left - this.boardPadding;
    const y = screenY - rect.top - this.boardPadding;

    const gx = Math.round(x / this.cellSize);
    const gy = Math.round(y / this.cellSize);

    if (gx < 0 || gx >= this.boardSize || gy < 0 || gy >= this.boardSize) {
      return null;
    }

    const distX = Math.abs(x - gx * this.cellSize);
    const distY = Math.abs(y - gy * this.cellSize);
    const maxDist = this.cellSize * 0.45;

    if (distX > maxDist || distY > maxDist) {
      return null;
    }

    return [gx, gy];
  }

  gridToScreen(gx: number, gy: number): [number, number] {
    return [
      this.boardPadding + gx * this.cellSize,
      this.boardPadding + gy * this.cellSize
    ];
  }

  setLadderPath(path: LadderPath | null): void {
    this.ladderPath = path;
  }

  addStoneAnimation(x: number, y: number, stone: Stone): void {
    this.stoneAnimations.push({
      x,
      y,
      stone,
      startTime: performance.now(),
      duration: 150
    });
  }

  render(grid: Stone[][], lastMove: [number, number] | null): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.drawBoardBackground();
    this.drawGridLines();
    this.drawStarPoints();
    this.drawStones(grid, lastMove);
    this.drawLadderPath();
  }

  startAnimationLoop(grid: Stone[][], lastMove: [number, number] | null): void {
    if (this.animationFrameId !== null) return;

    const animate = () => {
      this.render(grid, lastMove);
      this.cleanupAnimations();
      this.animationFrameId = requestAnimationFrame(animate);
    };
    
    this.animationFrameId = requestAnimationFrame(animate);
  }

  stopAnimationLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private cleanupAnimations(): void {
    const now = performance.now();
    this.stoneAnimations = this.stoneAnimations.filter(
      anim => now - anim.startTime < anim.duration
    );
  }

  private drawBoardBackground(): void {
    const totalSize = this.gridSize + this.boardPadding * 2;
    
    const gradient = this.ctx.createRadialGradient(
      totalSize / 2, totalSize / 2, 0,
      totalSize / 2, totalSize / 2, totalSize / 2
    );
    gradient.addColorStop(0, '#D4A055');
    gradient.addColorStop(1, '#C18A44');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, totalSize, totalSize);

    this.ctx.save();
    this.ctx.globalAlpha = 0.08;
    for (let i = 0; i < totalSize; i += 8) {
      this.ctx.strokeStyle = '#8B4513';
      this.ctx.lineWidth = 0.5;
      this.ctx.beginPath();
      this.ctx.moveTo(0, i + Math.random() * 4);
      this.ctx.lineTo(totalSize, i + Math.random() * 4);
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  private drawGridLines(): void {
    this.ctx.strokeStyle = '#2B2B2B';
    this.ctx.lineWidth = 1;

    for (let i = 0; i < this.boardSize; i++) {
      const pos = i * this.cellSize;
      
      this.ctx.beginPath();
      this.ctx.moveTo(this.boardPadding, this.boardPadding + pos);
      this.ctx.lineTo(this.boardPadding + this.gridSize, this.boardPadding + pos);
      this.ctx.stroke();

      this.ctx.beginPath();
      this.ctx.moveTo(this.boardPadding + pos, this.boardPadding);
      this.ctx.lineTo(this.boardPadding + pos, this.boardPadding + this.gridSize);
      this.ctx.stroke();
    }
  }

  private drawStarPoints(): void {
    const starPoints = [
      [3, 3], [9, 3], [15, 3],
      [3, 9], [9, 9], [15, 9],
      [3, 15], [9, 15], [15, 15]
    ];

    this.ctx.fillStyle = '#2B2B2B';
    
    for (const [gx, gy] of starPoints) {
      const [x, y] = this.gridToScreen(gx, gy);
      this.ctx.beginPath();
      this.ctx.arc(x, y, this.cellSize * 0.12, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private drawStones(grid: Stone[][], lastMove: [number, number] | null): void {
    for (let x = 0; x < this.boardSize; x++) {
      for (let y = 0; y < this.boardSize; y++) {
        if (grid[x][y] !== Stone.Empty) {
          const anim = this.getStoneAnimation(x, y);
          let offsetY = 0;
          let opacity = 1;

          if (anim) {
            const progress = (performance.now() - anim.startTime) / anim.duration;
            const eased = 1 - Math.pow(1 - progress, 3);
            offsetY = (1 - eased) * -8;
            opacity = 0.3 + eased * 0.7;
          }

          this.drawStone(x, y, grid[x][y], offsetY, opacity);

          if (lastMove && lastMove[0] === x && lastMove[1] === y) {
            this.drawLastMoveMarker(x, y, grid[x][y]);
          }
        }
      }
    }
  }

  private getStoneAnimation(x: number, y: number): StoneAnimation | undefined {
    return this.stoneAnimations.find(
      anim => anim.x === x && anim.y === y
    );
  }

  private drawStone(gx: number, gy: number, stone: Stone, offsetY: number = 0, opacity: number = 1): void {
    const [x, y] = this.gridToScreen(gx, gy);
    const radius = this.cellSize * 0.45;
    const drawY = y + offsetY;

    this.ctx.save();
    this.ctx.globalAlpha = opacity;

    this.ctx.beginPath();
    this.ctx.arc(x + 2, drawY + 3, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.fill();

    const gradient = this.ctx.createRadialGradient(
      x - radius * 0.3,
      drawY - radius * 0.3,
      0,
      x,
      drawY,
      radius
    );

    if (stone === Stone.Black) {
      gradient.addColorStop(0, '#4A4A4A');
      gradient.addColorStop(0.3, '#2A2A2A');
      gradient.addColorStop(1, '#1A1A1A');
    } else {
      gradient.addColorStop(0, '#FFFFFF');
      gradient.addColorStop(0.5, '#F5F5F5');
      gradient.addColorStop(1, '#E0E0E0');
    }

    this.ctx.beginPath();
    this.ctx.arc(x, drawY, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = gradient;
    this.ctx.fill();

    const highlightGradient = this.ctx.createRadialGradient(
      x - radius * 0.3,
      drawY - radius * 0.4,
      0,
      x - radius * 0.2,
      drawY - radius * 0.3,
      radius * 0.4
    );
    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    this.ctx.beginPath();
    this.ctx.arc(x, drawY, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = highlightGradient;
    this.ctx.fill();

    this.ctx.restore();
  }

  private drawLastMoveMarker(gx: number, gy: number, stone: Stone): void {
    const [x, y] = this.gridToScreen(gx, gy);
    const markerSize = this.cellSize * 0.12;

    this.ctx.beginPath();
    if (stone === Stone.Black) {
      this.ctx.strokeStyle = '#FFFFFF';
    } else {
      this.ctx.strokeStyle = '#1A1A1A';
    }
    this.ctx.lineWidth = 2;
    this.ctx.arc(x, y, markerSize, 0, Math.PI * 2);
    this.ctx.stroke();
  }

  private drawLadderPath(): void {
    if (!this.ladderPath || this.ladderPath.points.length < 2) return;

    const now = performance.now();
    const elapsed = now - this.animationStartTime;
    const cyclePeriod = 500;
    const cyclePos = (elapsed % cyclePeriod) / cyclePeriod;
    const opacity = 0.4 + Math.abs(Math.sin(cyclePos * Math.PI)) * 0.6;

    this.ctx.save();
    this.ctx.strokeStyle = `rgba(220, 20, 60, ${opacity})`;
    this.ctx.lineWidth = 3;
    this.ctx.setLineDash([8, 4]);
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    this.ctx.beginPath();
    const firstPoint = this.ladderPath.points[0];
    const [startX, startY] = this.gridToScreen(firstPoint[0], firstPoint[1]);
    this.ctx.moveTo(startX, startY);

    for (let i = 1; i < this.ladderPath.points.length; i++) {
      const [gx, gy] = this.ladderPath.points[i];
      const [sx, sy] = this.gridToScreen(gx, gy);
      this.ctx.lineTo(sx, sy);
    }

    this.ctx.stroke();

    const lastPoint = this.ladderPath.points[this.ladderPath.points.length - 1];
    const [lastX, lastY] = this.gridToScreen(lastPoint[0], lastPoint[1]);
    
    this.ctx.fillStyle = `rgba(220, 20, 60, ${opacity})`;
    this.ctx.beginPath();
    this.ctx.arc(lastX, lastY, 6, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
}
