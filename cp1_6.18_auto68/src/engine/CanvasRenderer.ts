import { COLORS, GRID, ROAM } from '@/shared/styles';
import { pixelToGrid, gridToCenter, normalizeAngle, getCellKey } from '@/shared/coord';
import { CollisionDetector } from './CollisionDetector';
import type { CellType } from '@/store';

interface WallInfo {
  id: string;
  col: number;
  row: number;
  orientation: 'horizontal' | 'vertical';
}

interface PlatformInfo {
  id: string;
  col: number;
  row: number;
}

interface WorkInfo {
  id: string;
  wallId: string;
  imageUrl: string;
  title: string;
  description: string;
  likes: number;
  liked: boolean;
}

interface PlayerPosition {
  x: number;
  y: number;
  angle: number;
}

interface RenderData {
  grid: CellType[][];
  walls: WallInfo[];
  platforms: PlatformInfo[];
  works: WorkInfo[];
  selectedCell: { col: number; row: number } | null;
  collisionFlash: boolean;
  playerPos: PlayerPosition;
  hoveredCell: { col: number; row: number } | null;
}

interface RayHitResult {
  hit: boolean;
  distance: number;
  side: number;
  mapX: number;
  mapY: number;
  wallX: number;
}

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private collisionDetector: CollisionDetector;
  private imageCache: Map<string, HTMLImageElement> = new Map();
  private scale = 1;
  private offsetX = 0;
  private offsetY = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.collisionDetector = new CollisionDetector();
  }

  updateCollisionGrid(grid: CellType[][]): void {
    this.collisionDetector.updateGrid(grid);
  }

  getCollisionDetector(): CollisionDetector {
    return this.collisionDetector;
  }

  hitTest(
    canvasX: number,
    canvasY: number,
    cellSize: number
  ): { col: number; row: number } | null {
    const x = canvasX - this.offsetX;
    const y = canvasY - this.offsetY;
    const grid = pixelToGrid(x, y, cellSize);
    const cols = Math.ceil(this.canvas.width / (cellSize * this.scale));
    const rows = Math.ceil(this.canvas.height / (cellSize * this.scale));
    if (grid.col < 0 || grid.col >= cols || grid.row < 0 || grid.row >= rows) return null;
    return grid;
  }

  resize(width: number, height: number): void {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  renderEdit(data: RenderData): void {
    const { grid } = data;
    if (!grid.length) return;

    const isMobile = window.innerWidth < 768;
    const cellSize = isMobile ? GRID.cellSize / 2 : GRID.cellSize;
    const cols = grid[0].length;
    const rows = grid.length;
    const gridWidth = cols * cellSize;
    const gridHeight = rows * cellSize;
    const viewWidth = parseFloat(this.canvas.style.width);
    const viewHeight = parseFloat(this.canvas.style.height);

    this.offsetX = Math.max(0, (viewWidth - gridWidth) / 2);
    this.offsetY = Math.max(0, (viewHeight - gridHeight) / 2);
    this.scale = 1;

    const ctx = this.ctx;
    ctx.clearRect(0, 0, viewWidth, viewHeight);
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, viewWidth, viewHeight);

    ctx.save();
    ctx.translate(this.offsetX, this.offsetY);

    this.drawGridBackground(ctx, cols, rows, cellSize);
    this.drawGridLines(ctx, cols, rows, cellSize);
    this.drawPlatforms(ctx, data, cellSize);
    this.drawWalls(ctx, data, cellSize);
    this.drawWorksOnWalls(ctx, data, cellSize);
    this.drawHoverCell(ctx, data, cellSize);
    this.drawSelection(ctx, data, cellSize);

    ctx.restore();
  }

  private drawGridBackground(
    ctx: CanvasRenderingContext2D,
    cols: number,
    rows: number,
    cellSize: number
  ): void {
    ctx.fillStyle = COLORS.gridBg;
    ctx.fillRect(0, 0, cols * cellSize, rows * cellSize);
  }

  private drawGridLines(
    ctx: CanvasRenderingContext2D,
    cols: number,
    rows: number,
    cellSize: number
  ): void {
    ctx.strokeStyle = COLORS.gridLine;
    ctx.lineWidth = 1;
    for (let c = 0; c <= cols; c++) {
      ctx.beginPath();
      ctx.moveTo(c * cellSize, 0);
      ctx.lineTo(c * cellSize, rows * cellSize);
      ctx.stroke();
    }
    for (let r = 0; r <= rows; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * cellSize);
      ctx.lineTo(cols * cellSize, r * cellSize);
      ctx.stroke();
    }
  }

  private drawWalls(
    ctx: CanvasRenderingContext2D,
    data: RenderData,
    cellSize: number
  ): void {
    const { grid } = data;
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        if (grid[row][col] !== 'wall') continue;

        const center = gridToCenter(col, row, cellSize);
        const wallW = (GRID.wallWidth / GRID.cellSize) * cellSize;
        const wallH = wallW;
        const shadowOffset = cellSize * 0.08;

        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(
          center.x - wallW / 2 + shadowOffset,
          center.y - wallH / 2 + shadowOffset,
          wallW,
          wallH
        );

        ctx.fillStyle = COLORS.wallSide;
        ctx.fillRect(center.x - wallW / 2, center.y - wallH / 2, wallW, wallH);

        const grad = ctx.createLinearGradient(
          center.x - wallW / 2,
          center.y - wallH / 2,
          center.x - wallW / 2,
          center.y + wallH / 2
        );
        grad.addColorStop(0, COLORS.wallTop);
        grad.addColorStop(1, COLORS.wallBg);
        ctx.fillStyle = grad;
        ctx.fillRect(center.x - wallW / 2, center.y - wallH / 2, wallW, wallH);

        ctx.strokeStyle = COLORS.wallBorder;
        ctx.lineWidth = 2;
        ctx.strokeRect(center.x - wallW / 2, center.y - wallH / 2, wallW, wallH);

        ctx.fillStyle = COLORS.wallTop;
        ctx.fillRect(
          center.x - wallW / 2 + 2,
          center.y - wallH / 2 + 2,
          wallW - 4,
          wallH * 0.15
        );
      }
    }
  }

  private drawPlatforms(
    ctx: CanvasRenderingContext2D,
    data: RenderData,
    cellSize: number
  ): void {
    const { grid } = data;
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        if (grid[row][col] !== 'platform') continue;

        const center = gridToCenter(col, row, cellSize);
        const radius = (GRID.platformRadius / GRID.cellSize) * cellSize;

        ctx.beginPath();
        ctx.arc(center.x + 2, center.y + 2, radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fill();

        const grad = ctx.createRadialGradient(
          center.x - radius * 0.3,
          center.y - radius * 0.3,
          0,
          center.x,
          center.y,
          radius
        );
        grad.addColorStop(0, COLORS.platformHighlight);
        grad.addColorStop(1, COLORS.platformBg);
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.strokeStyle = COLORS.wallBorder;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
  }

  private drawWorksOnWalls(
    ctx: CanvasRenderingContext2D,
    data: RenderData,
    cellSize: number
  ): void {
    for (const work of data.works) {
      const [colStr, rowStr] = work.wallId.split(',');
      const col = parseInt(colStr);
      const row = parseInt(rowStr);
      if (isNaN(col) || isNaN(row)) continue;
      if (data.grid[row]?.[col] !== 'wall') continue;

      const center = gridToCenter(col, row, cellSize);
      const wallW = (GRID.wallWidth / GRID.cellSize) * cellSize;
      const imgW = wallW - 8;
      const imgH = imgW * 0.75;
      const imgX = center.x - imgW / 2;
      const imgY = center.y - imgH / 2 - cellSize * 0.05;

      const cachedImg = this.imageCache.get(work.imageUrl);
      if (cachedImg && cachedImg.complete) {
        ctx.save();
        this.roundRect(ctx, imgX, imgY, imgW, imgH, 4);
        ctx.clip();
        ctx.drawImage(cachedImg, imgX, imgY, imgW, imgH);
        ctx.restore();
      } else {
        ctx.fillStyle = '#2A2A4E';
        this.roundRect(ctx, imgX, imgY, imgW, imgH, 4);
        ctx.fill();
        if (!cachedImg) {
          this.preloadImage(work.imageUrl);
        }
      }

      ctx.strokeStyle = COLORS.wallBorder;
      ctx.lineWidth = 1;
      this.roundRect(ctx, imgX, imgY, imgW, imgH, 4);
      ctx.stroke();

      const fontSize = Math.max(8, cellSize * 0.12);
      ctx.fillStyle = COLORS.text;
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(work.title, center.x, imgY + imgH + fontSize + 2, wallW);

      ctx.fillStyle = COLORS.textSecondary;
      ctx.font = `${fontSize * 0.85}px sans-serif`;
      ctx.fillText(
        work.description.substring(0, 12) + (work.description.length > 12 ? '...' : ''),
        center.x,
        imgY + imgH + fontSize * 2 + 4,
        wallW
      );
    }
  }

  private drawHoverCell(
    ctx: CanvasRenderingContext2D,
    data: RenderData,
    cellSize: number
  ): void {
    if (!data.hoveredCell) return;
    const { col, row } = data.hoveredCell;
    ctx.fillStyle = 'rgba(78, 205, 196, 0.15)';
    ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
    ctx.strokeStyle = COLORS.highlight;
    ctx.lineWidth = 2;
    ctx.strokeRect(col * cellSize + 1, row * cellSize + 1, cellSize - 2, cellSize - 2);
  }

  private drawSelection(
    ctx: CanvasRenderingContext2D,
    data: RenderData,
    cellSize: number
  ): void {
    if (!data.selectedCell) return;
    const { col, row } = data.selectedCell;
    ctx.strokeStyle = COLORS.selection;
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(col * cellSize + 2, row * cellSize + 2, cellSize - 4, cellSize - 4);
    ctx.setLineDash([]);
  }

  renderRoam(data: RenderData): void {
    const { grid, playerPos } = data;
    if (!grid.length) return;

    const viewWidth = parseFloat(this.canvas.style.width);
    const viewHeight = parseFloat(this.canvas.style.height);
    const ctx = this.ctx;

    ctx.clearRect(0, 0, viewWidth, viewHeight);

    const skyGrad = ctx.createLinearGradient(0, 0, 0, viewHeight / 2);
    skyGrad.addColorStop(0, '#050510');
    skyGrad.addColorStop(1, COLORS.ceiling);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, viewWidth, viewHeight / 2);

    const floorGrad = ctx.createLinearGradient(0, viewHeight / 2, 0, viewHeight);
    floorGrad.addColorStop(0, COLORS.floor);
    floorGrad.addColorStop(1, '#1A1A2E');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, viewWidth / 2, viewWidth, viewHeight / 2);

    const numRays = Math.floor(viewWidth);
    const fov = ROAM.fov;

    for (let i = 0; i < numRays; i++) {
      const rayAngle =
        playerPos.angle - fov / 2 + (i / numRays) * fov;
      const ray = this.castRay(playerPos, rayAngle, grid);

      if (ray.hit) {
        const perpDist = ray.distance * Math.cos(rayAngle - playerPos.angle);
        if (perpDist <= 0) continue;

        const wallHeight = viewHeight / perpDist;
        const wallTop = (viewHeight - wallHeight) / 2;

        const shade = Math.min(1, 2.5 / perpDist);
        let wallColor: string;

        const cellType = grid[ray.mapY]?.[ray.mapX];
        if (cellType === 'platform') {
          wallColor = ray.side === 0 ? '#3D3D5C' : '#33335A';
        } else {
          wallColor = ray.side === 0 ? COLORS.wallTop : COLORS.wallBg;
        }

        ctx.fillStyle = wallColor;
        ctx.fillRect(i, wallTop, 1, wallHeight);

        ctx.fillStyle = `rgba(0,0,0,${1 - shade})`;
        ctx.fillRect(i, wallTop, 1, wallHeight);

        const wallKey = getCellKey(ray.mapX, ray.mapY);
        const hasWork = data.works.some((w) => w.wallId === wallKey);
        if (hasWork) {
          const glowIntensity = Math.max(0, shade - 0.3);
          if (glowIntensity > 0) {
            ctx.fillStyle = `rgba(107, 203, 119, ${glowIntensity * 0.3})`;
            const glowH = Math.min(wallHeight * 0.4, 40);
            ctx.fillRect(i, viewHeight / 2 - glowH / 2, 1, glowH);
          }
        }
      }
    }

    if (data.collisionFlash) {
      ctx.fillStyle = 'rgba(255, 71, 87, 0.25)';
      ctx.fillRect(0, 0, viewWidth, viewHeight);
    }

    this.drawMinimap(ctx, data, viewWidth, viewHeight);

    this.drawCrosshair(ctx, viewWidth, viewHeight);
  }

  private castRay(
    player: PlayerPosition,
    angle: number,
    grid: CellType[][]
  ): RayHitResult {
    const dirX = Math.cos(angle);
    const dirY = Math.sin(angle);

    let mapX = Math.floor(player.x);
    let mapY = Math.floor(player.y);

    const deltaDistX = Math.abs(1 / (dirX || 0.00001));
    const deltaDistY = Math.abs(1 / (dirY || 0.00001));

    let stepX: number, stepY: number;
    let sideDistX: number, sideDistY: number;

    if (dirX < 0) {
      stepX = -1;
      sideDistX = (player.x - mapX) * deltaDistX;
    } else {
      stepX = 1;
      sideDistX = (mapX + 1 - player.x) * deltaDistX;
    }
    if (dirY < 0) {
      stepY = -1;
      sideDistY = (player.y - mapY) * deltaDistY;
    } else {
      stepY = 1;
      sideDistY = (mapY + 1 - player.y) * deltaDistY;
    }

    let side = 0;
    let steps = 0;
    const maxSteps = 50;

    while (steps < maxSteps) {
      if (sideDistX < sideDistY) {
        sideDistX += deltaDistX;
        mapX += stepX;
        side = 0;
      } else {
        sideDistY += deltaDistY;
        mapY += stepY;
        side = 1;
      }
      steps++;

      if (
        mapY < 0 ||
        mapY >= grid.length ||
        mapX < 0 ||
        mapX >= grid[0].length
      ) {
        const dist = side === 0 ? sideDistX - deltaDistX : sideDistY - deltaDistY;
        return { hit: true, distance: dist, side, mapX, mapY, wallX: 0 };
      }

      if (grid[mapY][mapX] !== 'empty') {
        const dist = side === 0 ? sideDistX - deltaDistX : sideDistY - deltaDistY;
        let wallX: number;
        if (side === 0) {
          wallX = player.y + dist * dirY;
        } else {
          wallX = player.x + dist * dirX;
        }
        wallX -= Math.floor(wallX);
        return { hit: true, distance: dist, side, mapX, mapY, wallX };
      }
    }

    return { hit: false, distance: maxSteps, side: 0, mapX, mapY, wallX: 0 };
  }

  private drawMinimap(
    ctx: CanvasRenderingContext2D,
    data: RenderData,
    viewWidth: number,
    viewHeight: number
  ): void {
    const { grid, playerPos } = data;
    const size = ROAM.minimapSize;
    const padding = 12;
    const mx = padding;
    const my = viewHeight - size - padding;
    const cols = grid[0]?.length ?? 0;
    const rows = grid.length;
    const cellW = size / cols;
    const cellH = size / rows;

    ctx.fillStyle = '#00000066';
    this.roundRect(ctx, mx, my, size, size, 8);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    this.roundRect(ctx, mx, my, size, size, 8);
    ctx.clip();

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] === 'empty') continue;
        ctx.fillStyle = grid[r][c] === 'wall' ? '#3A3A5A' : '#4A4A6A';
        ctx.fillRect(mx + c * cellW, my + r * cellH, cellW, cellH);
      }
    }

    const px = mx + playerPos.x * cellW;
    const py = my + playerPos.y * cellH;

    const dirLen = 6;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(
      px + Math.cos(playerPos.angle) * dirLen,
      py + Math.sin(playerPos.angle) * dirLen
    );
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    ctx.restore();

    ctx.strokeStyle = '#3A3A5C';
    ctx.lineWidth = 1;
    this.roundRect(ctx, mx, my, size, size, 8);
    ctx.stroke();
  }

  private drawCrosshair(
    ctx: CanvasRenderingContext2D,
    viewWidth: number,
    viewHeight: number
  ): void {
    const cx = viewWidth / 2;
    const cy = viewHeight / 2;
    const size = 8;

    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(cx - size, cy);
    ctx.lineTo(cx - size / 3, cy);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx + size / 3, cy);
    ctx.lineTo(cx + size, cy);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx, cy - size);
    ctx.lineTo(cx, cy - size / 3);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx, cy + size / 3);
    ctx.lineTo(cx, cy + size);
    ctx.stroke();
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  private preloadImage(url: string): void {
    if (this.imageCache.has(url)) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      this.imageCache.set(url, img);
    };
    img.src = url;
  }

  findWorkInSight(
    playerPos: PlayerPosition,
    grid: CellType[][],
    works: WorkInfo[]
  ): WorkInfo | null {
    const ray = this.castRay(playerPos, playerPos.angle, grid);
    if (!ray.hit) return null;
    const wallKey = getCellKey(ray.mapX, ray.mapY);
    if (ray.distance < 3) {
      return works.find((w) => w.wallId === wallKey) ?? null;
    }
    return null;
  }
}
