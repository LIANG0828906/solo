import type {
  Tile,
  CollisionPolygon,
  LightSource,
  Character,
  Point,
  Material,
  TileAnimation,
  TileType,
} from '@/store/mapStore';

export interface RendererOptions {
  canvas: HTMLCanvasElement;
  gridSize: number;
  onTileClick?: (gridX: number, gridY: number) => void;
  onTileDrop?: (type: TileType, gridX: number, gridY: number) => void;
  onLightDrag?: (x: number, y: number) => void;
  onCanvasPan?: (deltaX: number, deltaY: number) => void;
  onCanvasZoom?: (zoom: number, centerX: number, centerY: number) => void;
  onPolygonDraw?: (point: Point) => void;
  onPolygonVertexDrag?: (polygonId: string, vertexIndex: number, x: number, y: number) => void;
  onPolygonClick?: (polygonId: string | null, vertexIndex?: number | null) => void;
}

interface TileColors {
  base: string;
  highlight: string;
  shadow: string;
  pattern: string;
}

const tileColorMap: Record<TileType, TileColors> = {
  grass: {
    base: '#4ade80',
    highlight: '#86efac',
    shadow: '#22c55e',
    pattern: '#16a34a',
  },
  stone: {
    base: '#9ca3af',
    highlight: '#d1d5db',
    shadow: '#6b7280',
    pattern: '#4b5563',
  },
  wall: {
    base: '#78716c',
    highlight: '#a8a29e',
    shadow: '#57534e',
    pattern: '#44403c',
  },
  water: {
    base: '#3b82f6',
    highlight: '#60a5fa',
    shadow: '#2563eb',
    pattern: '#1d4ed8',
  },
};

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private gridSize: number;
  private width: number;
  private height: number;

  private tiles: Tile[] = [];
  private collisionPolygons: CollisionPolygon[] = [];
  private lightSource: LightSource | null = null;
  private character: Character | null = null;
  private materials: Material[] = [];
  private tileAnimations: TileAnimation[] = [];
  private currentDrawingPolygon: Point[] = [];

  private zoom: number = 1;
  private panX: number = 0;
  private panY: number = 0;

  private isRunning: boolean = false;
  private animationFrameId: number | null = null;
  private lastTime: number = 0;
  private fps: number = 0;
  private frameCount: number = 0;
  private fpsUpdateTime: number = 0;

  private isDragging: boolean = false;
  private isDraggingLight: boolean = false;
  private isDraggingVertex: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private draggedPolygonId: string | null = null;
  private draggedVertexIndex: number | null = null;

  private mouseX: number = 0;
  private mouseY: number = 0;

  private appMode: 'editor' | 'preview' = 'editor';
  private editMode: 'tile' | 'collision' = 'tile';
  private isDrawingPolygon: boolean = false;
  private hoveredTile: Tile | null = null;
  private selectedPolygonId: string | null = null;

  private options: RendererOptions;
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D;
  private tilesDirty: boolean = true;

  private hoveredMaterial: Material | null = null;
  private dragPosition: Point | null = null;
  private dragAnimStartTime: number = 0;
  private dragAnimFrameId: number | null = null;

  constructor(options: RendererOptions) {
    this.canvas = options.canvas;
    this.ctx = this.canvas.getContext('2d')!;
    this.gridSize = options.gridSize;
    this.options = options;

    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCtx = this.offscreenCanvas.getContext('2d')!;

    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
    this.offscreenCanvas.width = this.width;
    this.offscreenCanvas.height = this.height;

    this.setupEventListeners();
    this.resize();
  }

  setAppMode(mode: 'editor' | 'preview'): void {
    this.appMode = mode;
  }

  setEditMode(mode: 'tile' | 'collision'): void {
    this.editMode = mode;
  }

  setTiles(tiles: Tile[]): void {
    if (JSON.stringify(tiles) !== JSON.stringify(this.tiles)) {
      this.tiles = tiles;
      this.tilesDirty = true;
    }
  }

  setCollisionPolygons(polygons: CollisionPolygon[]): void {
    this.collisionPolygons = polygons;
  }

  setLightSource(light: LightSource): void {
    this.lightSource = light;
  }

  setCharacter(character: Character): void {
    this.character = character;
  }

  setMaterials(materials: Material[]): void {
    this.materials = materials;
  }

  setTileAnimations(animations: TileAnimation[]): void {
    this.tileAnimations = animations;
  }

  setCurrentDrawingPolygon(points: Point[]): void {
    this.currentDrawingPolygon = points;
  }

  setIsDrawingPolygon(drawing: boolean): void {
    this.isDrawingPolygon = drawing;
  }

  setSelectedPolygonId(id: string | null): void {
    this.selectedPolygonId = id;
  }

  setZoom(zoom: number): void {
    this.zoom = zoom;
    this.tilesDirty = true;
  }

  setPan(x: number, y: number): void {
    this.panX = x;
    this.panY = y;
    this.tilesDirty = true;
  }

  setHoveredMaterial(material: Material | null): void {
    this.hoveredMaterial = material;
  }

  setDragPosition(pos: Point | null): void {
    this.dragPosition = pos;
    if (pos && !this.dragAnimFrameId) {
      this.dragAnimStartTime = performance.now();
      this.startDragAnimationLoop();
    } else if (!pos && this.dragAnimFrameId) {
      cancelAnimationFrame(this.dragAnimFrameId);
      this.dragAnimFrameId = null;
    }
  }

  private startDragAnimationLoop(): void {
    const animate = () => {
      if (!this.dragPosition) {
        this.dragAnimFrameId = null;
        return;
      } else {
        this.dragAnimFrameId = requestAnimationFrame(animate);
      }
    };
    this.dragAnimFrameId = requestAnimationFrame(animate);
  }

  private getDragElasticScale(): number {
    if (!this.dragPosition) return 1;
    const elapsed = (performance.now() - this.dragAnimStartTime) / 600;
    const t = elapsed % 1;
    return this.elasticBounceSequence(t);
  }

  private elasticBounceSequence(t: number): number {
    if (t < 0.3) {
      const p = t / 0.3;
      return 0.8 + 0.3 * Math.sin(p * Math.PI / 2);
    } else if (t < 0.5) {
      const p = (t - 0.3) / 0.2;
      return 1.1 - 0.1 * Math.sin(p * Math.PI / 2);
    } else if (t < 0.7) {
      const p = (t - 0.5) / 0.2;
      return 1.0 + 0.05 * Math.sin(p * Math.PI);
    } else {
      return 1.0;
    }
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.resize.bind(this));
    this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.canvas.addEventListener('mouseleave', this.onMouseUp.bind(this));
    this.canvas.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private resize(): void {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
    this.offscreenCanvas.width = this.width;
    this.offscreenCanvas.height = this.height;
    this.tilesDirty = true;
  }

  private onMouseDown(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const worldPos = this.screenToWorld(x, y);

    this.dragStartX = x;
    this.dragStartY = y;

    if (this.lightSource) {
      const lightScreenPos = this.worldToScreen(this.lightSource.x, this.lightSource.y);
      const dist = Math.sqrt(
        Math.pow(x - lightScreenPos.x, 2) + Math.pow(y - lightScreenPos.y, 2)
      );
      if (dist < 28) {
        this.isDraggingLight = true;
        this.canvas.style.cursor = 'grab';
        return;
      }
    }

    if (this.editMode === 'collision' && this.appMode === 'editor') {
      const hit = this.hitTestVertex(x, y);
      if (hit) {
        this.isDraggingVertex = true;
        this.draggedPolygonId = hit.polygonId;
        this.draggedVertexIndex = hit.vertexIndex;
        if (this.options.onPolygonClick) {
          this.options.onPolygonClick(hit.polygonId, hit.vertexIndex);
        }
        return;
      }

      const polygonHit = this.hitTestPolygon(x, y);
      if (polygonHit) {
        if (this.options.onPolygonClick) {
          this.options.onPolygonClick(polygonHit);
        }
        return;
      }

      if (this.isDrawingPolygon && e.button === 0) {
        if (this.options.onPolygonDraw) {
          this.options.onPolygonDraw(worldPos);
        }
        return;
      }
    }

    if (e.button === 2 || (e.button === 0 && !this.hoveredTile && this.editMode === 'tile')) {
      this.isDragging = true;
      this.canvas.style.cursor = 'grabbing';
      return;
    }

    if (this.editMode === 'tile' && this.hoveredTile && e.button === 0) {
      if (this.options.onTileClick) {
        const gridPos = this.worldToGrid(worldPos.x, worldPos.y);
        this.options.onTileClick(gridPos.x, gridPos.y);
      }
    }
  }

  private onMouseMove(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const worldPos = this.screenToWorld(x, y);

    this.mouseX = x;
    this.mouseY = y;

    if (this.isDraggingLight && this.lightSource && this.options.onLightDrag) {
      this.options.onLightDrag(worldPos.x, worldPos.y);
      this.canvas.style.cursor = 'grabbing';
      return;
    }

    if (this.isDraggingVertex && this.draggedPolygonId !== null && this.draggedVertexIndex !== null) {
      if (this.options.onPolygonVertexDrag) {
        this.options.onPolygonVertexDrag(
          this.draggedPolygonId,
          this.draggedVertexIndex,
          worldPos.x,
          worldPos.y
        );
      }
      this.canvas.style.cursor = 'move';
      return;
    }

    if (this.isDragging && this.options.onCanvasPan) {
      const deltaX = (x - this.dragStartX) / this.zoom;
      const deltaY = (y - this.dragStartY) / this.zoom;
      this.dragStartX = x;
      this.dragStartY = y;
      this.options.onCanvasPan(deltaX, deltaY);
      return;
    }

    this.hoveredTile = this.hitTestTile(worldPos.x, worldPos.y);

    if (this.editMode === 'tile') {
      this.canvas.style.cursor = this.hoveredTile ? 'pointer' : 'grab';
    } else if (this.editMode === 'collision') {
      const vertexHit = this.hitTestVertex(x, y);
      const polygonHit = this.hitTestPolygon(x, y);
      if (vertexHit) {
        this.canvas.style.cursor = 'move';
      } else if (polygonHit) {
        this.canvas.style.cursor = 'pointer';
      } else if (this.isDrawingPolygon) {
        this.canvas.style.cursor = 'crosshair';
      } else {
        this.canvas.style.cursor = 'default';
      }
    }
  }

  private onMouseUp(): void {
    this.isDragging = false;
    this.isDraggingLight = false;
    this.isDraggingVertex = false;
    this.draggedPolygonId = null;
    this.draggedVertexIndex = null;
    this.canvas.style.cursor = this.editMode === 'tile' ? 'grab' : 'default';
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(0.25, Math.min(4, this.zoom + delta));

    if (this.options.onCanvasZoom) {
      this.options.onCanvasZoom(newZoom, x, y);
    }
  }

  private hitTestTile(worldX: number, worldY: number): Tile | null {
    const gridX = Math.floor(worldX / this.gridSize);
    const gridY = Math.floor(worldY / this.gridSize);
    return this.tiles.find(t => t.x === gridX && t.y === gridY) || null;
  }

  private hitTestVertex(screenX: number, screenY: number): { polygonId: string; vertexIndex: number } | null {
    const vertexRadius = 14;

    for (const polygon of this.collisionPolygons) {
      for (let i = 0; i < polygon.vertices.length; i++) {
        const vertex = polygon.vertices[i];
        const screenPos = this.worldToScreen(vertex.x, vertex.y);
        const dist = Math.sqrt(
          Math.pow(screenX - screenPos.x, 2) + Math.pow(screenY - screenPos.y, 2)
        );
        if (dist < vertexRadius) {
          return { polygonId: polygon.id, vertexIndex: i };
        }
      }
    }
    return null;
  }

  private hitTestPolygon(screenX: number, screenY: number): string | null {
    const worldPos = this.screenToWorld(screenX, screenY);

    for (const polygon of this.collisionPolygons) {
      if (this.pointInPolygon(worldPos, polygon.vertices)) {
        return polygon.id;
      }
    }
    return null;
  }

  private pointInPolygon(point: Point, polygon: Point[]): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;

      if (((yi > point.y) !== (yj > point.y)) &&
          (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    return inside;
  }

  screenToWorld(screenX: number, screenY: number): Point {
    return {
      x: (screenX - this.width / 2) / this.zoom - this.panX,
      y: (screenY - this.height / 2) / this.zoom - this.panY,
    };
  }

  worldToScreen(worldX: number, worldY: number): Point {
    return {
      x: (worldX + this.panX) * this.zoom + this.width / 2,
      y: (worldY + this.panY) * this.zoom + this.height / 2,
    };
  }

  worldToGrid(worldX: number, worldY: number): Point {
    return {
      x: Math.floor(worldX / this.gridSize),
      y: Math.floor(worldY / this.gridSize),
    };
  }

  gridToWorld(gridX: number, gridY: number): Point {
    return {
      x: gridX * this.gridSize,
      y: gridY * this.gridSize,
    };
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop();
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private loop(): void {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    this.frameCount++;
    if (currentTime - this.fpsUpdateTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsUpdateTime = currentTime;
    }

    this.render(deltaTime);

    this.animationFrameId = requestAnimationFrame(() => this.loop());
  }

  private render(deltaTime: number): void {
    this.ctx.fillStyle = '#2b2b2b';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.save();
    this.ctx.translate(this.width / 2, this.height / 2);
    this.ctx.scale(this.zoom, this.zoom);
    this.ctx.translate(this.panX, this.panY);

    if (this.tilesDirty || this.offscreenCanvas.width === 0 || this.offscreenCanvas.height === 0) {
      if (this.width > 0 && this.height > 0) {
        this.offscreenCanvas.width = this.width;
        this.offscreenCanvas.height = this.height;
      }
      this.renderTilesToOffscreen();
      this.tilesDirty = false;
    }

    this.ctx.save();
    this.ctx.translate(-this.width / 2 / this.zoom - this.panX, -this.height / 2 / this.zoom - this.panY);
    if (this.offscreenCanvas.width > 0 && this.offscreenCanvas.height > 0) {
      this.ctx.drawImage(this.offscreenCanvas, 0, 0);
    }
    this.ctx.restore();

    if (this.appMode === 'editor') {
      this.drawGrid();
    }

    this.drawCollisionPolygons();

    if (this.isDrawingPolygon) {
      this.drawCurrentPolygon();
    }

    if (this.lightSource) {
      this.drawLighting();
      if (this.appMode === 'editor') {
        this.drawLightSource();
      }
    }

    if (this.appMode === 'preview' && this.character) {
      this.drawCharacter(deltaTime);
    }

    if (this.editMode === 'tile' && this.hoveredMaterial && this.dragPosition) {
      this.drawDragPreview();
    }

    if (this.hoveredTile && this.appMode === 'editor') {
      this.drawTileHighlight(this.hoveredTile);
    }

    this.ctx.restore();

    this.drawFPS();
  }

  private renderTilesToOffscreen(): void {
    this.offscreenCtx.save();
    this.offscreenCtx.fillStyle = '#2b2b2b';
    this.offscreenCtx.fillRect(0, 0, this.width, this.height);
    
    this.offscreenCtx.translate(this.width / 2, this.height / 2);
    this.offscreenCtx.scale(this.zoom, this.zoom);
    this.offscreenCtx.translate(this.panX, this.panY);

    const viewport = this.getViewportBounds();
    for (const tile of this.tiles) {
      if (this.isTileInViewport(tile, viewport)) {
        this.drawTile(tile, this.offscreenCtx);
      }
    }

    this.offscreenCtx.restore();
  }

  private getViewportBounds(): { minX: number; minY: number; maxX: number; maxY: number } {
    const halfWidth = this.width / 2 / this.zoom;
    const halfHeight = this.height / 2 / this.zoom;
    return {
      minX: -this.panX - halfWidth - this.gridSize,
      minY: -this.panY - halfHeight - this.gridSize,
      maxX: -this.panX + halfWidth + this.gridSize,
      maxY: -this.panY + halfHeight + this.gridSize,
    };
  }

  private isTileInViewport(
    tile: Tile,
    viewport: { minX: number; minY: number; maxX: number; maxY: number }
  ): boolean {
    const tileX = tile.x * this.gridSize;
    const tileY = tile.y * this.gridSize;
    return (
      tileX + this.gridSize >= viewport.minX &&
      tileX <= viewport.maxX &&
      tileY + this.gridSize >= viewport.minY &&
      tileY <= viewport.maxY
    );
  }

  private drawGrid(): void {
    const gridSpacing = this.getGridSpacing();
    const startX = Math.floor(-this.panX - this.width / 2 / this.zoom / gridSpacing) * gridSpacing;
    const startY = Math.floor(-this.panY - this.height / 2 / this.zoom / gridSpacing) * gridSpacing;
    const endX = startX + this.width / this.zoom + gridSpacing * 2;
    const endY = startY + this.height / this.zoom + gridSpacing * 2;

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    this.ctx.lineWidth = 1 / this.zoom;

    for (let x = startX; x < endX; x += gridSpacing) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, startY);
      this.ctx.lineTo(x, endY);
      this.ctx.stroke();
    }

    for (let y = startY; y < endY; y += gridSpacing) {
      this.ctx.beginPath();
      this.ctx.moveTo(startX, y);
      this.ctx.lineTo(endX, y);
      this.ctx.stroke();
    }
  }

  private getGridSpacing(): number {
    if (this.zoom < 0.5) return this.gridSize * 4;
    if (this.zoom < 1) return this.gridSize * 2;
    if (this.zoom > 2) return this.gridSize / 2;
    return this.gridSize;
  }

  private drawTile(tile: Tile, ctx: CanvasRenderingContext2D = this.ctx): void {
    const x = tile.x * this.gridSize;
    const y = tile.y * this.gridSize;
    const size = this.gridSize - 2;
    const colors = tileColorMap[tile.type];

    const anim = this.tileAnimations.find(a => a.id === tile.id);
    let scale = 1;
    if (anim) {
      const elapsed = (performance.now() - anim.startTime) / 500;
      if (elapsed < 1) {
        scale = this.easeOutElastic(elapsed);
      }
    }

    const centerX = x + this.gridSize / 2;
    const centerY = y + this.gridSize / 2;
    const drawSize = size * scale;
    const drawX = centerX - drawSize / 2;
    const drawY = centerY - drawSize / 2;

    ctx.fillStyle = colors.shadow;
    ctx.fillRect(drawX + 2, drawY + 2, drawSize, drawSize);

    ctx.fillStyle = colors.base;
    ctx.fillRect(drawX, drawY, drawSize, drawSize);

    ctx.fillStyle = colors.highlight;
    ctx.fillRect(drawX, drawY, drawSize, drawSize * 0.3);

    ctx.strokeStyle = colors.pattern;
    ctx.lineWidth = 1;
    if (tile.type === 'grass') {
      for (let i = 0; i < 3; i++) {
        const gx = drawX + 8 + i * 12 * scale;
        const gy = drawY + drawSize * 0.5;
        ctx.beginPath();
        ctx.moveTo(gx, gy);
        ctx.lineTo(gx - 3 * scale, gy - 8 * scale);
        ctx.lineTo(gx + 3 * scale, gy - 6 * scale);
        ctx.closePath();
        ctx.stroke();
      }
    } else if (tile.type === 'stone') {
      ctx.strokeRect(drawX + 4, drawY + 4, drawSize / 2 - 6, drawSize / 2 - 6);
      ctx.strokeRect(drawX + drawSize / 2 + 2, drawY + 4, drawSize / 2 - 6, drawSize / 2 - 6);
      ctx.strokeRect(drawX + 4, drawY + drawSize / 2 + 2, drawSize / 2 - 6, drawSize / 2 - 6);
      ctx.strokeRect(drawX + drawSize / 2 + 2, drawY + drawSize / 2 + 2, drawSize / 2 - 6, drawSize / 2 - 6);
    } else if (tile.type === 'wall') {
      for (let i = 0; i < 3; i++) {
        const wy = drawY + 6 + i * 10 * scale;
        ctx.beginPath();
        ctx.moveTo(drawX + 4, wy);
        ctx.lineTo(drawX + drawSize - 4, wy);
        ctx.stroke();
      }
    } else if (tile.type === 'water') {
      const waveOffset = (performance.now() / 500 + tile.x) % (Math.PI * 2);
      for (let i = 0; i < 2; i++) {
        ctx.beginPath();
        const wy = drawY + drawSize * 0.6 + i * 8 * scale;
        ctx.moveTo(drawX + 4, wy);
        for (let wx = 0; wx < drawSize - 8; wx += 8) {
          ctx.quadraticCurveTo(
            drawX + 4 + wx + 4,
            wy + Math.sin(waveOffset + wx * 0.2) * 2 * scale,
            drawX + 4 + wx + 8,
            wy
          );
        }
        ctx.stroke();
      }
    }
  }

  private easeOutElastic(t: number): number {
    if (t === 0) return 0;
    if (t === 1) return 1;
    return Math.pow(2, -10 * t) * Math.sin((t - 0.1) * 5 * Math.PI) + 1;
  }

  private drawTileHighlight(tile: Tile): void {
    const x = tile.x * this.gridSize;
    const y = tile.y * this.gridSize;
    const size = this.gridSize;

    this.ctx.strokeStyle = '#00ff88';
    this.ctx.lineWidth = 2 / this.zoom;
    this.ctx.setLineDash([4 / this.zoom, 4 / this.zoom]);
    this.ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);
    this.ctx.setLineDash([]);
  }

  private drawCollisionPolygons(): void {
    for (const polygon of this.collisionPolygons) {
      if (polygon.vertices.length < 2) continue;

      this.ctx.fillStyle = 'rgba(59, 130, 246, 0.35)';
      this.ctx.beginPath();
      this.ctx.moveTo(polygon.vertices[0].x, polygon.vertices[0].y);
      for (let i = 1; i < polygon.vertices.length; i++) {
        this.ctx.lineTo(polygon.vertices[i].x, polygon.vertices[i].y);
      }
      if (polygon.isClosed) {
        this.ctx.closePath();
      }
      this.ctx.fill();

      const isSelected = polygon.id === this.selectedPolygonId;
      this.ctx.strokeStyle = isSelected ? '#ffdd00' : '#a855f7';
      this.ctx.lineWidth = isSelected ? 3 / this.zoom : 2 / this.zoom;
      this.ctx.beginPath();
      this.ctx.moveTo(polygon.vertices[0].x, polygon.vertices[0].y);
      for (let i = 1; i < polygon.vertices.length; i++) {
        this.ctx.lineTo(polygon.vertices[i].x, polygon.vertices[i].y);
      }
      if (polygon.isClosed) {
        this.ctx.closePath();
      }
      this.ctx.stroke();

      if (this.editMode === 'collision' || polygon.id === this.selectedPolygonId) {
        for (let i = 0; i < polygon.vertices.length; i++) {
          const vertex = polygon.vertices[i];
          const isSelectedVertex = polygon.id === this.selectedPolygonId && i === this.draggedVertexIndex;
          
          this.ctx.fillStyle = isSelectedVertex ? '#ffdd00' : '#a855f7';
          this.ctx.beginPath();
          this.ctx.arc(vertex.x, vertex.y, 6 / this.zoom, 0, Math.PI * 2);
          this.ctx.fill();

          this.ctx.strokeStyle = '#ffffff';
          this.ctx.lineWidth = 1.5 / this.zoom;
          this.ctx.stroke();
        }
      }
    }
  }

  private drawCurrentPolygon(): void {
    if (this.currentDrawingPolygon.length < 1) return;

    this.ctx.strokeStyle = '#a855f7';
    this.ctx.lineWidth = 2 / this.zoom;
    this.ctx.setLineDash([8 / this.zoom, 4 / this.zoom]);

    this.ctx.beginPath();
    this.ctx.moveTo(this.currentDrawingPolygon[0].x, this.currentDrawingPolygon[0].y);
    for (let i = 1; i < this.currentDrawingPolygon.length; i++) {
      this.ctx.lineTo(this.currentDrawingPolygon[i].x, this.currentDrawingPolygon[i].y);
    }

    const worldMouse = this.screenToWorld(this.mouseX, this.mouseY);
    this.ctx.lineTo(worldMouse.x, worldMouse.y);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    for (const point of this.currentDrawingPolygon) {
      this.ctx.fillStyle = '#a855f7';
      this.ctx.beginPath();
      this.ctx.arc(point.x, point.y, 6 / this.zoom, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 1.5 / this.zoom;
      this.ctx.stroke();
    }
  }

  private drawLighting(): void {
    if (!this.lightSource) return;

    const { x, y, range, intensity } = this.lightSource;

    this.ctx.save();
    this.ctx.globalCompositeOperation = 'source-over';

    const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, range);
    gradient.addColorStop(0, `rgba(255, 200, 100, ${0.3 * intensity})`);
    gradient.addColorStop(0.5, `rgba(255, 150, 50, ${0.15 * intensity})`);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(x - range, y - range, range * 2, range * 2);

    this.ctx.globalCompositeOperation = 'multiply';
    this.ctx.fillStyle = 'rgba(20, 20, 30, 0.7)';
    const startX = -this.panX - this.width / 2 / this.zoom - range;
    const startY = -this.panY - this.height / 2 / this.zoom - range;
    const totalWidth = this.width / this.zoom + range * 2;
    const totalHeight = this.height / this.zoom + range * 2;

    this.ctx.beginPath();
    this.ctx.rect(startX, startY, totalWidth, totalHeight);
    this.ctx.arc(x, y, range, 0, Math.PI * 2, true);
    this.ctx.fill('evenodd');

    this.ctx.restore();
  }

  private drawLightSource(): void {
    if (!this.lightSource) return;

    const { x, y } = this.lightSource;

    const pulseScale = 1 + Math.sin(performance.now() / 200) * 0.1;
    const glowRadius = 15 * pulseScale;

    const glowGradient = this.ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
    glowGradient.addColorStop(0, 'rgba(255, 200, 100, 0.8)');
    glowGradient.addColorStop(0.5, 'rgba(255, 150, 50, 0.4)');
    glowGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');

    this.ctx.fillStyle = glowGradient;
    this.ctx.beginPath();
    this.ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#fff8e7';
    this.ctx.beginPath();
    this.ctx.arc(x, y, 6, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.strokeStyle = '#ffaa00';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }

  private drawCharacter(deltaTime: number): void {
    if (!this.character) return;

    const { x, y, walkFrame, isJumping, facingRight } = this.character;
    const charWidth = 24;
    const charHeight = 36;

    const bodySwing = isJumping ? 0 : Math.sin(walkFrame * Math.PI / 2) * 3;
    const legSwing = isJumping ? 10 : Math.sin(walkFrame * Math.PI / 2) * 15;
    const headSwing = isJumping ? -5 : Math.sin(walkFrame * Math.PI / 2 + Math.PI) * 3;

    this.ctx.save();
    this.ctx.translate(x, y);
    if (!facingRight) {
      this.ctx.scale(-1, 1);
    }

    this.ctx.fillStyle = '#ff6b6b';
    this.ctx.fillRect(-charWidth / 2, -charHeight + 10 + bodySwing, charWidth, charHeight - 16);

    this.ctx.save();
    this.ctx.translate(0, -charHeight + 8);
    this.ctx.rotate((headSwing * Math.PI) / 180);
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.fillRect(-8, -8, 16, 16);
    
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(2, -3, 4, 4);
    this.ctx.restore();

    this.ctx.fillStyle = '#4ecdc4';
    this.ctx.save();
    this.ctx.translate(-charWidth / 4, -6);
    this.ctx.rotate((-legSwing * Math.PI) / 180);
    this.ctx.fillRect(-3, 0, 6, 16);
    this.ctx.restore();

    this.ctx.save();
    this.ctx.translate(charWidth / 4, -6);
    this.ctx.rotate((legSwing * Math.PI) / 180);
    this.ctx.fillRect(-3, 0, 6, 16);
    this.ctx.restore();

    this.ctx.restore();
  }

  private drawDragPreview(): void {
    if (!this.hoveredMaterial || !this.dragPosition) return;

    const worldPos = this.screenToWorld(this.dragPosition.x, this.dragPosition.y);
    const gridPos = this.worldToGrid(worldPos.x, worldPos.y);
    const x = gridPos.x * this.gridSize;
    const y = gridPos.y * this.gridSize;
    const size = this.gridSize - 2;

    const colors = tileColorMap[this.hoveredMaterial.type];
    const scale = this.getDragElasticScale();

    const centerX = x + this.gridSize / 2;
    const centerY = y + this.gridSize / 2;
    const drawSize = size * scale;
    const drawX = centerX - drawSize / 2;
    const drawY = centerY - drawSize / 2;

    this.ctx.save();
    this.ctx.globalAlpha = 0.7;

    this.ctx.fillStyle = colors.shadow;
    this.ctx.fillRect(drawX + 2, drawY + 2, drawSize, drawSize);

    this.ctx.fillStyle = colors.base;
    this.ctx.fillRect(drawX, drawY, drawSize, drawSize);

    this.ctx.fillStyle = colors.highlight;
    this.ctx.fillRect(drawX, drawY, drawSize, drawSize * 0.3);

    this.ctx.globalAlpha = 1;

    this.ctx.strokeStyle = '#00ff88';
    this.ctx.lineWidth = 2 / this.zoom;
    this.ctx.setLineDash([4 / this.zoom, 4 / this.zoom]);
    this.ctx.strokeRect(x, y, this.gridSize, this.gridSize);
    this.ctx.setLineDash([]);
    this.ctx.restore();
  }

  private drawFPS(): void {
    this.ctx.fillStyle = 'rgba(0, 255, 136, 0.8)';
    this.ctx.font = '12px "JetBrains Mono", monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`FPS: ${this.fps}`, 12, this.height - 12);
    
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    this.ctx.fillText(`Tiles: ${this.tiles.length}`, 80, this.height - 12);
    this.ctx.fillText(`Zoom: ${(this.zoom * 100).toFixed(0)}%`, 160, this.height - 12);
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  getFPS(): number {
    return this.fps;
  }

  destroy(): void {
    this.stop();
    window.removeEventListener('resize', this.resize.bind(this));
    this.canvas.removeEventListener('mousedown', this.onMouseDown.bind(this));
    this.canvas.removeEventListener('mousemove', this.onMouseMove.bind(this));
    this.canvas.removeEventListener('mouseup', this.onMouseUp.bind(this));
    this.canvas.removeEventListener('mouseleave', this.onMouseUp.bind(this));
    this.canvas.removeEventListener('wheel', this.onWheel.bind(this));
  }
}
