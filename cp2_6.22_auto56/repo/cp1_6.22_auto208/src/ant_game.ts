import { ColonyManager } from './core/colony_manager';
import { DecisionEngine, CommandCooldown } from './core/decision_engine';
import { MapRenderer } from './rendering/map_renderer';
import { AntRenderer } from './rendering/ant_renderer';
import { UIPanelRenderer } from './rendering/ui_panel';
import { eventBus } from './events/event_bus';
import { PlayerCommand, CommandType, Vec2, HexCoord } from './types';
import { pixelToHex } from './core/hex_grid';

interface InputState {
  isDragging: boolean;
  isRightDragging: boolean;
  dragStart: Vec2;
  dragCurrent: Vec2;
  lastMousePos: Vec2;
  altPressed: boolean;
  shiftPressed: boolean;
}

class AntGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private uiOverlay: HTMLElement;

  private colony: ColonyManager;
  private decisionEngine: DecisionEngine;
  private mapRenderer: MapRenderer;
  private antRenderer: AntRenderer;
  private uiPanelRenderer: UIPanelRenderer;

  private input: InputState;
  private lastTime: number = 0;
  private animationFrameId: number = 0;
  private running: boolean = false;
  private fpsCounter: { frames: number; lastUpdate: number; fps: number } = {
    frames: 0,
    lastUpdate: 0,
    fps: 60,
  };

  constructor() {
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.uiOverlay = document.getElementById('ui-overlay') as HTMLElement;

    if (!this.canvas || !this.uiOverlay) {
      throw new Error('Failed to find required DOM elements');
    }

    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get Canvas 2D context');
    }
    this.ctx = ctx;

    this.colony = new ColonyManager();
    this.decisionEngine = new DecisionEngine(this.colony);
    this.mapRenderer = new MapRenderer(this.ctx, this.colony);
    this.antRenderer = new AntRenderer(this.ctx);
    this.uiPanelRenderer = new UIPanelRenderer(this.ctx);

    this.input = {
      isDragging: false,
      isRightDragging: false,
      dragStart: { x: 0, y: 0 },
      dragCurrent: { x: 0, y: 0 },
      lastMousePos: { x: 0, y: 0 },
      altPressed: false,
      shiftPressed: false,
    };

    this.setupCanvas();
    this.setupEventListeners();
  }

  private setupCanvas(): void {
    const resize = () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
    this.canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('keydown', (e) => {
      this.input.altPressed = e.altKey;
      this.input.shiftPressed = e.shiftKey;
    });
    window.addEventListener('keyup', (e) => {
      this.input.altPressed = e.altKey;
      this.input.shiftPressed = e.shiftKey;
    });
  }

  private onMouseDown(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (e.button === 0) {
      const cmdType = this.uiPanelRenderer.getCommandButtonAt(x, y, this.canvas.height);
      if (cmdType) {
        this.issueCommand(cmdType, { x, y });
        return;
      }

      if (x <= 280) return;

      if (this.input.altPressed) {
        const worldPos = this.mapRenderer.screenToWorld(x, y, this.canvas);
        this.issueCommand('set_alert_zone', worldPos);
        return;
      }

      this.input.isDragging = true;
      this.input.dragStart = { x, y };
      this.input.dragCurrent = { x, y };
      this.input.lastMousePos = { x: e.clientX, y: e.clientY };
    } else if (e.button === 2) {
      this.input.isRightDragging = true;
      this.input.dragStart = { x, y };
      this.input.dragCurrent = { x, y };
    }
  }

  private onMouseMove(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cmdType = this.uiPanelRenderer.getCommandButtonAt(x, y, this.canvas.height);
    this.uiPanelRenderer.setHoveredButton(cmdType);

    if (x > 280 && y < this.canvas.height - 120) {
      const worldPos = this.mapRenderer.screenToWorld(x, y, this.canvas);
      const hex = pixelToHex(worldPos);
      this.mapRenderer.setHoveredHex(hex);
    } else {
      this.mapRenderer.setHoveredHex(null);
    }

    if (this.input.isDragging) {
      const dx = e.clientX - this.input.lastMousePos.x;
      const dy = e.clientY - this.input.lastMousePos.y;
      const camera = this.mapRenderer.getCamera();
      camera.x -= dx / camera.zoom;
      camera.y -= dy / camera.zoom;
      this.mapRenderer.setCamera(camera);
      this.input.lastMousePos = { x: e.clientX, y: e.clientY };
    }

    if (this.input.isRightDragging) {
      this.input.dragCurrent = { x, y };
    }
  }

  private onMouseUp(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (e.button === 0 && this.input.isDragging) {
      const dx = Math.abs(x - this.input.dragStart.x);
      const dy = Math.abs(y - this.input.dragStart.y);
      if (dx < 5 && dy < 5) {
        this.handleClick(x, y);
      }
      this.input.isDragging = false;
    }

    if (e.button === 2 && this.input.isRightDragging) {
      this.handleRightDragSelect();
      this.input.isRightDragging = false;
    }
  }

  private handleClick(x: number, y: number): void {
    if (x <= 280) return;
    if (y >= this.canvas.height - 120) return;

    const worldPos = this.mapRenderer.screenToWorld(x, y, this.canvas);

    const selectedAntIds: string[] = [];
    const selectedNestIds: string[] = [];

    this.colony.ants.forEach((ant) => {
      const d = Math.hypot(ant.position.x - worldPos.x, ant.position.y - worldPos.y);
      if (d < 20) {
        selectedAntIds.push(ant.id);
      }
    });

    if (selectedAntIds.length === 0) {
      this.colony.nests.forEach((nest) => {
        const d = Math.hypot(nest.position.x - worldPos.x, nest.position.y - worldPos.y);
        if (d < 40) {
          selectedNestIds.push(nest.id);
        }
      });
    }

    eventBus.emit('player:select', {
      antIds: this.input.shiftPressed ? [...this.decisionEngine.getSelectedAntIds(), ...selectedAntIds] : selectedAntIds,
      nestIds: this.input.shiftPressed ? [...this.decisionEngine.getSelectedNestIds(), ...selectedNestIds] : selectedNestIds,
    });
  }

  private handleRightDragSelect(): void {
    const x1 = Math.min(this.input.dragStart.x, this.input.dragCurrent.x);
    const y1 = Math.min(this.input.dragStart.y, this.input.dragCurrent.y);
    const x2 = Math.max(this.input.dragStart.x, this.input.dragCurrent.x);
    const y2 = Math.max(this.input.dragStart.y, this.input.dragCurrent.y);

    const selectedAntIds: string[] = [];
    const selectedNestIds: string[] = [];

    this.colony.ants.forEach((ant) => {
      const screenPos = this.mapRenderer.worldToScreen(ant.position.x, ant.position.y, this.canvas);
      if (screenPos.x >= x1 && screenPos.x <= x2 && screenPos.y >= y1 && screenPos.y <= y2) {
        selectedAntIds.push(ant.id);
      }
    });

    this.colony.nests.forEach((nest) => {
      const screenPos = this.mapRenderer.worldToScreen(nest.position.x, nest.position.y, this.canvas);
      if (screenPos.x >= x1 && screenPos.x <= x2 && screenPos.y >= y1 && screenPos.y <= y2) {
        selectedNestIds.push(nest.id);
      }
    });

    eventBus.emit('player:select', { antIds: selectedAntIds, nestIds: selectedNestIds });
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const camera = this.mapRenderer.getCamera();
    camera.zoom = Math.max(0.4, Math.min(2.5, camera.zoom * delta));
    this.mapRenderer.setCamera(camera);
  }

  private issueCommand(type: CommandType, screenOrWorldPos: Vec2): void {
    const selectedNestIds = Array.from(this.decisionEngine.getSelectedNestIds());
    const selectedAntIds = Array.from(this.decisionEngine.getSelectedAntIds());

    let position: Vec2 | undefined;

    if (type === 'attack_area' || type === 'set_alert_zone' || type === 'move_to') {
      if (screenOrWorldPos && type !== 'move_to') {
        if (type === 'set_alert_zone') {
          position = screenOrWorldPos;
        } else {
          position = this.mapRenderer.screenToWorld(screenOrWorldPos.x, screenOrWorldPos.y, this.canvas);
        }
      } else {
        const cam = this.mapRenderer.getCamera();
        position = { x: cam.x, y: cam.y };
      }
    }

    const command: PlayerCommand = {
      type,
      targetIds: [...selectedAntIds, ...selectedNestIds],
      position,
    };

    eventBus.emit('player:command', { command });
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.fpsCounter.lastUpdate = this.lastTime;
    this.gameLoop();
  }

  stop(): void {
    this.running = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private gameLoop = (): void => {
    if (!this.running) return;

    const now = performance.now();
    const deltaTime = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    this.fpsCounter.frames++;
    if (now - this.fpsCounter.lastUpdate >= 500) {
      this.fpsCounter.fps = (this.fpsCounter.frames * 1000) / (now - this.fpsCounter.lastUpdate);
      this.fpsCounter.frames = 0;
      this.fpsCounter.lastUpdate = now;
    }

    const currentTime = now / 1000;

    this.decisionEngine.update(deltaTime, currentTime);
    const alertZones = this.decisionEngine.getAlertZones();
    const simpleAlertZones = this.decisionEngine.getSimpleAlertZones();
    this.colony.update(deltaTime, currentTime, simpleAlertZones);

    this.mapRenderer.render(deltaTime, this.canvas, alertZones);
    this.antRenderer.render(deltaTime, this.colony.ants, this.canvas, this.mapRenderer.getCamera());
    this.uiPanelRenderer.render(deltaTime, this.canvas, this.colony, this.decisionEngine);

    this.renderSelectionBox();
    this.renderFPS();

    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  private renderSelectionBox(): void {
    if (!this.input.isRightDragging) return;

    const ctx = this.ctx;
    const x = Math.min(this.input.dragStart.x, this.input.dragCurrent.x);
    const y = Math.min(this.input.dragStart.y, this.input.dragCurrent.y);
    const w = Math.abs(this.input.dragCurrent.x - this.input.dragStart.x);
    const h = Math.abs(this.input.dragCurrent.y - this.input.dragStart.y);

    ctx.save();
    ctx.fillStyle = 'rgba(255, 215, 0, 0.1)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);
    ctx.restore();
  }

  private renderFPS(): void {
    const ctx = this.ctx;
    const fps = this.fpsCounter.fps;
    const color = fps >= 50 ? '#00FF7F' : fps >= 30 ? '#FFA500' : '#FF4500';

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(this.canvas.width - 85, 5, 80, 22);
    ctx.fillStyle = color;
    ctx.font = 'bold 13px "Consolas", monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(`FPS: ${fps.toFixed(0)}`, this.canvas.width - 10, 8);
    ctx.restore();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  try {
    const game = new AntGame();
    game.start();
    console.log('🐜 Ant Colony RTS initialized successfully');
  } catch (e) {
    console.error('Failed to initialize game:', e);
  }
});
