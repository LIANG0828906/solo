import * as PIXI from 'pixi.js';
import { MapGenerator, MapData } from './mapGen/mapGenerator';
import { MapRenderer } from './mapGen/renderer';
import { AIController, AIState } from './pathFinding/aiController';

class Game {
  private app: PIXI.Application;
  private mapGenerator: MapGenerator;
  private mapRenderer: MapRenderer;
  private mapData: MapData | null = null;

  private player: PIXI.Graphics | null = null;
  private playerGlow: PIXI.Graphics | null = null;
  private playerTrail: PIXI.Graphics[] = [];
  private playerGridPos: { x: number; y: number } = { x: 0, y: 0 };
  private playerTargetPos: { x: number; y: number } = { x: 0, y: 0 };
  private playerSpeed: number = 4;

  private aiControllers: AIController[] = [];

  private tileSize: number = 64;

  private keys: Set<string> = new Set();

  private uiContainer: PIXI.Container | null = null;
  private fpsText: PIXI.Text | null = null;
  private coordText: PIXI.Text | null = null;
  private aiStatusText: PIXI.Text | null = null;

  private frameCount: number = 0;
  private lastFpsUpdate: number = 0;
  private currentFps: number = 0;

  private camera: { x: number; y: number; zoom: number } = { x: 0, y: 0, zoom: 1 };
  private isDragging: boolean = false;
  private dragStart: { x: number; y: number } = { x: 0, y: 0 };

  private edgeWarning: PIXI.Graphics | null = null;
  private showDebug: boolean = false;
  private walkableMarkers: PIXI.Graphics | null = null;

  constructor() {
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;

    this.app = new PIXI.Application({
      view: canvas,
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0x1a1a1a,
      antialias: false,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true
    });

    PIXI.BaseTexture.defaultOptions.scaleMode = PIXI.SCALE_MODES.NEAREST;

    this.mapGenerator = new MapGenerator(12, 8);
    this.mapRenderer = new MapRenderer({
      tileSize: this.tileSize,
      app: this.app
    });

    this.init();
  }

  private init(): void {
    this.generateMap();
    this.createPlayer();
    this.createAIMonsters();
    this.createUI();
    this.createEdgeWarning();
    this.setupEventListeners();
    this.centerCameraOnPlayer();

    this.app.ticker.add((delta) => this.update(delta));
  }

  private generateMap(): void {
    this.mapData = this.mapGenerator.generate();
    this.mapRenderer.render(this.mapData);
  }

  private createPlayer(): void {
    if (!this.mapData) return;

    const startPos = this.mapData.startPos;
    this.playerGridPos = { ...startPos };
    this.playerTargetPos = {
      x: startPos.x * this.tileSize + this.tileSize / 2,
      y: startPos.y * this.tileSize + this.tileSize / 2
    };

    this.playerGlow = new PIXI.Graphics();
    this.drawPlayerGlow(this.tileSize * 0.6);

    this.player = new PIXI.Graphics();
    this.drawPlayer();

    for (let i = 0; i < 5; i++) {
      const trail = new PIXI.Graphics();
      trail.beginFill(0x8aff8a, 0.15 - i * 0.025);
      trail.drawCircle(0, 0, this.tileSize * 0.25 - i * 3);
      trail.endFill();
      trail.alpha = 0.3 - i * 0.05;
      this.playerTrail.push(trail);
      this.mapRenderer.getContainer().addChild(trail);
    }

    this.mapRenderer.getContainer().addChild(this.playerGlow);
    this.mapRenderer.getContainer().addChild(this.player);

    this.updatePlayerPosition();
  }

  private drawPlayer(): void {
    if (!this.player) return;
    this.player.clear();
    const size = this.tileSize * 0.3;
    this.player.beginFill(0x8aff8a);
    this.player.drawCircle(0, 0, size);
    this.player.endFill();

    this.player.beginFill(0x2a5a2a);
    this.player.drawCircle(-size * 0.3, -size * 0.1, size * 0.15);
    this.player.drawCircle(size * 0.3, -size * 0.1, size * 0.15);
    this.player.endFill();
  }

  private drawPlayerGlow(size: number): void {
    if (!this.playerGlow) return;
    this.playerGlow.clear();
    this.playerGlow.beginFill(0x8aff8a, 0.2);
    this.playerGlow.drawCircle(0, 0, size);
    this.playerGlow.endFill();
  }

  private createAIMonsters(): void {
    if (!this.mapData) return;

    const aiSpeed = this.playerSpeed * 0.85;

    for (let i = 0; i < 2; i++) {
      const pos = this.mapGenerator.getRandomWalkableTile(this.mapData.tiles);

      while (pos.x === this.playerGridPos.x && pos.y === this.playerGridPos.y) {
        const newPos = this.mapGenerator.getRandomWalkableTile(this.mapData.tiles);
        pos.x = newPos.x;
        pos.y = newPos.y;
      }

      const ai = new AIController(pos, this.mapData.tiles, {
        tileSize: this.tileSize,
        speed: aiSpeed,
        mapContainer: this.mapRenderer.getContainer()
      });

      this.aiControllers.push(ai);
    }
  }

  private createUI(): void {
    this.uiContainer = new PIXI.Container();
    this.uiContainer.position.set(20, this.app.screen.height - 120);
    this.uiContainer.zIndex = 100;

    const panelWidth = 280;
    const panelHeight = 100;

    const panel = new PIXI.Graphics();
    panel.beginFill(0x000000, 0.7);
    panel.drawRoundedRect(0, 0, panelWidth, panelHeight, 8);
    panel.endFill();
    this.uiContainer.addChild(panel);

    const style = new PIXI.TextStyle({
      fontFamily: '"Press Start 2P", monospace',
      fontSize: 10,
      fill: 0x8aff8a,
      align: 'left'
    });

    this.fpsText = new PIXI.Text('FPS: 60', style);
    this.fpsText.position.set(15, 15);
    this.uiContainer.addChild(this.fpsText);

    this.coordText = new PIXI.Text('POS: 0, 0', style);
    this.coordText.position.set(15, 40);
    this.uiContainer.addChild(this.coordText);

    this.aiStatusText = new PIXI.Text('AI: idle', style);
    this.aiStatusText.position.set(15, 65);
    this.uiContainer.addChild(this.aiStatusText);

    this.app.stage.addChild(this.uiContainer);
  }

  private createEdgeWarning(): void {
    this.edgeWarning = new PIXI.Graphics();
    this.updateEdgeWarningSize();
    this.edgeWarning.zIndex = 99;
    this.app.stage.addChild(this.edgeWarning);
  }

  private updateEdgeWarningSize(): void {
    if (!this.edgeWarning) return;
    this.edgeWarning.clear();
    const w = this.app.screen.width;
    const h = this.app.screen.height;
    const borderWidth = 30;

    this.edgeWarning.beginFill(0xff0000, 0);

    this.edgeWarning.drawRect(0, 0, w, borderWidth);
    this.edgeWarning.drawRect(0, h - borderWidth, w, borderWidth);
    this.edgeWarning.drawRect(0, 0, borderWidth, h);
    this.edgeWarning.drawRect(w - borderWidth, 0, borderWidth, h);

    this.edgeWarning.endFill();
  }

  private setupEventListeners(): void {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.key.toLowerCase());
      if (e.code === 'Space') {
        e.preventDefault();
        this.toggleDebug();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
    });

    window.addEventListener('resize', () => {
      this.app.renderer.resize(window.innerWidth, window.innerHeight);
      if (this.uiContainer) {
        this.uiContainer.position.y = this.app.screen.height - 120;
      }
      this.updateEdgeWarningSize();
    });

    const canvas = this.app.view as unknown as HTMLCanvasElement;

    canvas.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault();
      const zoomSpeed = 0.1;
      const oldZoom = this.camera.zoom;

      if (e.deltaY > 0) {
        this.camera.zoom = Math.max(0.5, this.camera.zoom - zoomSpeed);
      } else {
        this.camera.zoom = Math.min(2.0, this.camera.zoom + zoomSpeed);
      }

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const worldX = (mouseX + this.camera.x) / oldZoom;
      const worldY = (mouseY + this.camera.y) / oldZoom;

      this.camera.x = worldX * this.camera.zoom - mouseX;
      this.camera.y = worldY * this.camera.zoom - mouseY;

      this.updateCamera();
    });

    canvas.addEventListener('mousedown', (e: MouseEvent) => {
      if (e.button === 0 || e.button === 1) {
        this.isDragging = true;
        this.dragStart = { x: e.clientX + this.camera.x, y: e.clientY + this.camera.y };
      }
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    window.addEventListener('mousemove', (e: MouseEvent) => {
      if (this.isDragging) {
        this.camera.x = this.dragStart.x - e.clientX;
        this.camera.y = this.dragStart.y - e.clientY;
        this.updateCamera();
      }
    });
  }

  private toggleDebug(): void {
    this.showDebug = !this.showDebug;
    this.mapRenderer.toggleGrid();

    this.aiControllers.forEach(ai => {
      ai.togglePathDisplay(this.showDebug);
    });

    this.toggleWalkableMarkers();
  }

  private toggleWalkableMarkers(): void {
    if (!this.mapData) return;

    if (this.showDebug) {
      this.walkableMarkers = new PIXI.Graphics();
      for (let y = 0; y < this.mapData.height; y++) {
        for (let x = 0; x < this.mapData.width; x++) {
          const tile = this.mapData.tiles[y][x];
          const px = x * this.tileSize + this.tileSize / 2;
          const py = y * this.tileSize + this.tileSize / 2;
          const size = 6;

          if (tile.walkable) {
            this.walkableMarkers.beginFill(0x4aff4a, 0.6);
          } else {
            this.walkableMarkers.beginFill(0xff4a4a, 0.6);
          }
          this.walkableMarkers.drawRect(px - size / 2, py - size / 2, size, size);
          this.walkableMarkers.endFill();
        }
      }
      this.mapRenderer.getContainer().addChild(this.walkableMarkers);
    } else {
      if (this.walkableMarkers) {
        this.mapRenderer.getContainer().removeChild(this.walkableMarkers);
        this.walkableMarkers.destroy();
        this.walkableMarkers = null;
      }
    }
  }

  private updateCamera(): void {
    const container = this.mapRenderer.getContainer();
    container.x = -this.camera.x;
    container.y = -this.camera.y;
    container.scale.set(this.camera.zoom);
  }

  private centerCameraOnPlayer(): void {
    const screenCenterX = this.app.screen.width / 2;
    const screenCenterY = this.app.screen.height / 2;

    this.camera.x = this.playerTargetPos.x * this.camera.zoom - screenCenterX;
    this.camera.y = this.playerTargetPos.y * this.camera.zoom - screenCenterY;

    this.updateCamera();
  }

  private update(delta: number): void {
    const now = performance.now();

    this.frameCount++;
    if (now - this.lastFpsUpdate >= 1000) {
      this.currentFps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }

    this.handlePlayerMovement(delta);
    this.updatePlayerTrail();
    this.updateAI(delta, now);
    this.updateUI();
    this.checkEdgeWarning();
    this.mapRenderer.update(delta);
  }

  private handlePlayerMovement(delta: number): void {
    if (!this.mapData) return;

    let dx = 0;
    let dy = 0;

    if (this.keys.has('w') || this.keys.has('arrowup')) dy -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) dy += 1;
    if (this.keys.has('a') || this.keys.has('arrowleft')) dx -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) dx += 1;

    if (dx === 0 && dy === 0) return;

    if (dx !== 0 && dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy);
      dx /= len;
      dy /= len;
    }

    const moveSpeed = this.playerSpeed * delta * 0.1;
    const newX = this.playerTargetPos.x + dx * moveSpeed;
    const newY = this.playerTargetPos.y + dy * moveSpeed;

    const gridX = Math.floor(newX / this.tileSize);
    const gridY = Math.floor(newY / this.tileSize);

    if (
      gridX >= 0 && gridX < this.mapData.width &&
      gridY >= 0 && gridY < this.mapData.height &&
      this.mapData.tiles[gridY][gridX].walkable
    ) {
      this.playerTargetPos.x = newX;
      this.playerTargetPos.y = newY;
      this.playerGridPos = { x: gridX, y: gridY };
    } else {
      if (
        gridX >= 0 && gridX < this.mapData.width &&
        this.mapData.tiles[Math.floor(this.playerTargetPos.y / this.tileSize)][gridX].walkable
      ) {
        this.playerTargetPos.x = newX;
      }
      if (
        gridY >= 0 && gridY < this.mapData.height &&
        this.mapData.tiles[gridY][Math.floor(this.playerTargetPos.x / this.tileSize)].walkable
      ) {
        this.playerTargetPos.y = newY;
      }
    }

    this.updatePlayerPosition();

    const screenCenterX = this.app.screen.width / 2;
    const screenCenterY = this.app.screen.height / 2;
    this.camera.x = this.playerTargetPos.x * this.camera.zoom - screenCenterX;
    this.camera.y = this.playerTargetPos.y * this.camera.zoom - screenCenterY;
    this.updateCamera();
  }

  private updatePlayerPosition(): void {
    if (!this.player || !this.playerGlow) return;

    this.player.x = this.playerTargetPos.x;
    this.player.y = this.playerTargetPos.y;
    this.playerGlow.x = this.playerTargetPos.x;
    this.playerGlow.y = this.playerTargetPos.y;
  }

  private updatePlayerTrail(): void {
    for (let i = this.playerTrail.length - 1; i > 0; i--) {
      this.playerTrail[i].x = this.playerTrail[i - 1].x;
      this.playerTrail[i].y = this.playerTrail[i - 1].y;
    }
    if (this.playerTrail.length > 0) {
      this.playerTrail[0].x = this.playerTargetPos.x;
      this.playerTrail[0].y = this.playerTargetPos.y;
    }
  }

  private updateAI(delta: number, currentTime: number): void {
    this.aiControllers.forEach(ai => {
      ai.update(delta, this.playerGridPos, currentTime);
    });
  }

  private updateUI(): void {
    if (this.fpsText) {
      this.fpsText.text = `FPS: ${this.currentFps}`;
    }
    if (this.coordText) {
      this.coordText.text = `POS: ${this.playerGridPos.x}, ${this.playerGridPos.y}`;
    }
    if (this.aiStatusText && this.aiControllers.length > 0) {
      const states = this.aiControllers.map(ai =>
        ai.getState() === AIState.PATHFINDING ? '寻路' : '空闲'
      );
      this.aiStatusText.text = `AI: ${states.join(', ')}`;
    }
  }

  private checkEdgeWarning(): void {
    if (!this.mapData || !this.edgeWarning) return;

    const edgeThreshold = 1;
    const x = this.playerGridPos.x;
    const y = this.playerGridPos.y;

    const atEdge = (
      x <= edgeThreshold ||
      x >= this.mapData.width - 1 - edgeThreshold ||
      y <= edgeThreshold ||
      y >= this.mapData.height - 1 - edgeThreshold
    );

    if (atEdge) {
      const intensity = 0.3 + Math.sin(Date.now() / 200) * 0.2;
      this.edgeWarning.alpha = intensity;
    } else {
      this.edgeWarning.alpha = 0;
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
