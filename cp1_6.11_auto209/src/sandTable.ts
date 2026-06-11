'use strict';

interface TerrainArea {
  type: 'mountain' | 'forest' | 'river';
  color: string;
  contains: (x: number, y: number) => boolean;
}

interface CameraState {
  x: number;
  y: number;
  scale: number;
}

interface AnimationState {
  startScale: number;
  targetScale: number;
  startTime: number;
  duration: number;
  isAnimating: boolean;
}

class SandTable {
  private readonly width: number = 1000;
  private readonly height: number = 700;
  private readonly baseSpeed: number = 100;
  private readonly minScale: number = 0.5;
  private readonly maxScale: number = 2.0;
  private readonly scaleEaseDuration: number = 300;
  private readonly gridSize: number = 50;

  private terrainAreas: TerrainArea[] = [];
  private camera: CameraState = { x: 0, y: 0, scale: 1 };
  private targetCamera: CameraState = { x: 0, y: 0, scale: 1 };
  private animation: AnimationState = {
    startScale: 1,
    targetScale: 1,
    startTime: 0,
    duration: 0,
    isAnimating: false,
  };

  private isDragging: boolean = false;
  private lastMousePos: { x: number; y: number } = { x: 0, y: 0 };
  private canvas: HTMLCanvasElement | null = null;

  constructor() {
    this.initTerrainAreas();
  }

  private initTerrainAreas(): void {
    const mountainPoints: [number, number][] = [
      [0, 0], [400, 0], [380, 80], [420, 150], [350, 220], [300, 180],
      [250, 250], [180, 200], [120, 280], [60, 240], [0, 300]
    ];

    const forestCenterX = this.width * 0.5;
    const forestCenterY = this.height * 0.45;
    const forestRadiusX = 200;
    const forestRadiusY = 120;

    const riverWidth = 30;
    const riverControlPoints: [number, number][] = [
      [300, 500], [450, 480], [550, 520], [650, 500], [750, 550], [850, 530], [1000, 600], [1050, 700]
    ];

    this.terrainAreas = [
      {
        type: 'mountain',
        color: '#696969',
        contains: (x: number, y: number): boolean => {
          return this.pointInPolygon(x, y, mountainPoints);
        },
      },
      {
        type: 'forest',
        color: '#228B22',
        contains: (x: number, y: number): boolean => {
          const dx = (x - forestCenterX) / forestRadiusX;
          const dy = (y - forestCenterY) / forestRadiusY;
          const noise = Math.sin(x * 0.05) * Math.cos(y * 0.05) * 0.2;
          return dx * dx + dy * dy + noise <= 1;
        },
      },
      {
        type: 'river',
        color: '#4682B4',
        contains: (x: number, y: number): boolean => {
          return this.distanceToCurve(x, y, riverControlPoints) < riverWidth / 2;
        },
      },
    ];
  }

  private pointInPolygon(x: number, y: number, polygon: [number, number][]): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [xi, yi] = polygon[i];
      const [xj, yj] = polygon[j];
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    return inside;
  }

  private distanceToCurve(px: number, py: number, points: [number, number][]): number {
    let minDist = Infinity;
    for (let i = 0; i < points.length - 1; i++) {
      const [x1, y1] = points[i];
      const [x2, y2] = points[i + 1];
      const dist = this.pointToSegmentDistance(px, py, x1, y1, x2, y2);
      if (dist < minDist) minDist = dist;
    }
    return minDist;
  }

  private pointToSegmentDistance(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
    let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
  }

  public getTerrainSpeedMultiplier(x: number, y: number): number {
    for (const area of this.terrainAreas) {
      if (area.contains(x, y)) {
        switch (area.type) {
          case 'mountain':
            return 0.5;
          case 'forest':
            return 0.7;
          case 'river':
            return 0.3;
        }
      }
    }
    return 1;
  }

  public getTerrainSpeed(x: number, y: number): number {
    return this.baseSpeed * this.getTerrainSpeedMultiplier(x, y);
  }

  public bindCanvas(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.canvas) return;

    this.canvas.addEventListener('contextmenu', this.handleContextMenu.bind(this));
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
  }

  private handleContextMenu(e: MouseEvent): void {
    e.preventDefault();
  }

  private handleMouseDown(e: MouseEvent): void {
    if (e.button === 2) {
      this.isDragging = true;
      this.lastMousePos = { x: e.clientX, y: e.clientY };
    }
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.isDragging) return;

    const dx = e.clientX - this.lastMousePos.x;
    const dy = e.clientY - this.lastMousePos.y;

    this.targetCamera.x += dx;
    this.targetCamera.y += dy;
    this.camera.x += dx;
    this.camera.y += dy;

    this.lastMousePos = { x: e.clientX, y: e.clientY };
  }

  private handleMouseUp(e: MouseEvent): void {
    if (e.button === 2) {
      this.isDragging = false;
    }
  }

  private handleWheel(e: WheelEvent): void {
    e.preventDefault();

    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(
      this.minScale,
      Math.min(this.maxScale, this.targetCamera.scale * zoomFactor)
    );

    this.startScaleAnimation(newScale);
  }

  private startScaleAnimation(targetScale: number): void {
    this.animation = {
      startScale: this.camera.scale,
      targetScale: targetScale,
      startTime: performance.now(),
      duration: this.scaleEaseDuration,
      isAnimating: true,
    };
    this.targetCamera.scale = targetScale;
  }

  private updateAnimation(): void {
    if (!this.animation.isAnimating) return;

    const now = performance.now();
    const elapsed = now - this.animation.startTime;
    const progress = Math.min(1, elapsed / this.animation.duration);
    const easedProgress = this.easeInOutCubic(progress);

    this.camera.scale =
      this.animation.startScale +
      (this.animation.targetScale - this.animation.startScale) * easedProgress;

    if (progress >= 1) {
      this.animation.isAnimating = false;
      this.camera.scale = this.animation.targetScale;
    }
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  public render(ctx: CanvasRenderingContext2D): void {
    this.updateAnimation();

    ctx.save();
    ctx.translate(this.camera.x, this.camera.y);
    ctx.scale(this.camera.scale, this.camera.scale);

    this.drawBackground(ctx);
    this.drawTerrain(ctx);
    this.drawGrid(ctx);

    ctx.restore();
  }

  private drawBackground(ctx: CanvasRenderingContext2D): void {
    const gradient = ctx.createLinearGradient(0, 0, this.width, this.height);
    gradient.addColorStop(0, '#BDB76B');
    gradient.addColorStop(1, '#8FBC8F');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);
  }

  private drawTerrain(ctx: CanvasRenderingContext2D): void {
    for (const area of this.terrainAreas) {
      ctx.fillStyle = area.color;

      if (area.type === 'mountain') {
        this.drawMountain(ctx, area);
      } else if (area.type === 'forest') {
        this.drawForest(ctx, area);
      } else if (area.type === 'river') {
        this.drawRiver(ctx, area);
      }
    }
  }

  private drawMountain(ctx: CanvasRenderingContext2D, _area: TerrainArea): void {
    const mountainWidth = this.width * 0.45;
    const mountainHeight = this.height * 0.45;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(mountainWidth, 0);
    ctx.lineTo(mountainWidth, mountainHeight * 0.3);
    ctx.lineTo(mountainWidth * 0.8, mountainHeight * 0.5);
    ctx.lineTo(mountainWidth * 0.6, mountainHeight * 0.4);
    ctx.lineTo(mountainWidth * 0.4, mountainHeight * 0.7);
    ctx.lineTo(mountainWidth * 0.2, mountainHeight * 0.5);
    ctx.lineTo(0, mountainHeight * 0.8);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#808080';
    ctx.beginPath();
    ctx.moveTo(mountainWidth * 0.1, mountainHeight * 0.1);
    ctx.lineTo(mountainWidth * 0.3, mountainHeight * 0.25);
    ctx.lineTo(mountainWidth * 0.2, mountainHeight * 0.35);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#5A5A5A';
    ctx.beginPath();
    ctx.moveTo(mountainWidth * 0.5, mountainHeight * 0.1);
    ctx.lineTo(mountainWidth * 0.75, mountainHeight * 0.3);
    ctx.lineTo(mountainWidth * 0.6, mountainHeight * 0.4);
    ctx.closePath();
    ctx.fill();
  }

  private drawForest(ctx: CanvasRenderingContext2D, area: TerrainArea): void {
    const forestStartX = this.width * 0.25;
    const forestEndX = this.width * 0.75;
    const forestStartY = this.height * 0.3;
    const forestEndY = this.height * 0.6;

    ctx.fillStyle = area.color;
    ctx.fillRect(forestStartX, forestStartY, forestEndX - forestStartX, forestEndY - forestStartY);

    ctx.fillStyle = '#1E7B1E';
    const treeRows = 4;
    const treeCols = 8;
    const cellWidth = (forestEndX - forestStartX) / treeCols;
    const cellHeight = (forestEndY - forestStartY) / treeRows;

    for (let row = 0; row < treeRows; row++) {
      for (let col = 0; col < treeCols; col++) {
        const cx = forestStartX + col * cellWidth + cellWidth / 2;
        const cy = forestStartY + row * cellHeight + cellHeight / 2;
        const treeSize = Math.min(cellWidth, cellHeight) * 0.4;

        ctx.beginPath();
        ctx.moveTo(cx, cy - treeSize);
        ctx.lineTo(cx - treeSize * 0.6, cy + treeSize * 0.5);
        ctx.lineTo(cx + treeSize * 0.6, cy + treeSize * 0.5);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.moveTo(cx, cy - treeSize * 0.6);
        ctx.lineTo(cx - treeSize * 0.4, cy + treeSize * 0.2);
        ctx.lineTo(cx + treeSize * 0.4, cy + treeSize * 0.2);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#1E7B1E';
      }
    }
  }

  private drawRiver(ctx: CanvasRenderingContext2D, area: TerrainArea): void {
    const riverStartX = this.width * 0.3;
    const riverEndX = this.width + 50;
    const riverStartY = this.height * 0.65;
    const riverWidth = 30;

    ctx.fillStyle = area.color;
    ctx.beginPath();

    const segments = 30;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = riverStartX + t * (riverEndX - riverStartX);
      const centerY = riverStartY + t * (this.height * 0.25);
      const y = centerY - riverWidth / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    for (let i = segments; i >= 0; i--) {
      const t = i / segments;
      const x = riverStartX + t * (riverEndX - riverStartX);
      const centerY = riverStartY + t * (this.height * 0.25);
      const y = centerY + riverWidth / 2;
      ctx.lineTo(x, y);
    }

    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#5A9BD4';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = riverStartX + t * (riverEndX - riverStartX);
      const y = riverStartY + t * (this.height * 0.25);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  private drawGrid(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1;

    for (let x = 0; x <= this.width; x += this.gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }

    for (let y = 0; y <= this.height; y += this.gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }
  }

  public getWidth(): number {
    return this.width;
  }

  public getHeight(): number {
    return this.height;
  }

  public getCamera(): CameraState {
    return { ...this.camera };
  }
}

export { SandTable };
