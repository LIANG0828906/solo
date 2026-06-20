import { PhysicsEngine } from './physicsEngine';
import { TerrainManager } from './terrainManager';
import { CharacterController } from './characterController';
import { Renderer } from './renderer';
import type { TerrainType, InputState } from './types';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const GRID_SIZE = 10;

class Game {
  private canvas: HTMLCanvasElement;
  private physics: PhysicsEngine;
  private terrainMgr: TerrainManager;
  private character: CharacterController;
  private renderer: Renderer;

  private selectedTool: TerrainType = 'ground';
  private input: InputState = {
    left: false, right: false, up: false, down: false, jump: false, jumpPressed: false
  };

  private mouseX: number | null = null;
  private mouseY: number | null = null;
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragTerrainId: string | null = null;
  private lastTerrainX = 0;
  private lastTerrainY = 0;

  private controlEnabled = true;
  private lastTime = 0;
  private running = false;

  constructor() {
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (!canvas) throw new Error('Canvas not found');
    this.canvas = canvas;

    this.physics = new PhysicsEngine();
    this.terrainMgr = new TerrainManager();
    this.character = new CharacterController();
    this.renderer = new Renderer(canvas, { width: CANVAS_WIDTH, height: CANVAS_HEIGHT, gridSize: GRID_SIZE });

    this.terrainMgr.reset();
    this.physics.setTerrains(this.terrainMgr.getAll());

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const toolBtns = document.querySelectorAll('.tool-btn');
    toolBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        toolBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedTool = (btn as HTMLElement).dataset.type as TerrainType;

        const movingCfg = document.getElementById('moving-config');
        if (movingCfg) {
          if (this.selectedTool === 'moving') {
            movingCfg.classList.add('show');
          } else {
            movingCfg.classList.remove('show');
          }
        }
      });
    });

    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.reset());
    }

    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
    this.canvas.addEventListener('mouseleave', () => {
      this.mouseX = null;
      this.mouseY = null;
    });
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
  }

  private onKeyDown(e: KeyboardEvent): void {
    switch (e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        this.input.left = true;
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.input.right = true;
        break;
      case 'ArrowUp':
      case 'KeyW':
        this.input.up = true;
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.input.down = true;
        break;
      case 'Space':
        if (!this.input.jump) {
          this.input.jumpPressed = true;
        }
        this.input.jump = true;
        e.preventDefault();
        break;
      case 'Delete':
      case 'Backspace':
        if (this.terrainMgr.removeSelected()) {
          this.physics.setTerrains(this.terrainMgr.getAll());
        }
        break;
      case 'Tab':
        e.preventDefault();
        this.controlEnabled = !this.controlEnabled;
        break;
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    switch (e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        this.input.left = false;
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.input.right = false;
        break;
      case 'ArrowUp':
      case 'KeyW':
        this.input.up = false;
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.input.down = false;
        break;
      case 'Space':
        this.input.jump = false;
        break;
    }
  }

  private getCanvasCoords(e: MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  private onMouseDown(e: MouseEvent): void {
    const { x, y } = this.getCanvasCoords(e);
    this.mouseX = x;
    this.mouseY = y;

    if (e.ctrlKey || e.metaKey) {
      const t = this.terrainMgr.selectTerrain(x, y);
      if (t) {
        this.isDragging = true;
        this.dragTerrainId = t.id;
        this.dragStartX = x;
        this.dragStartY = y;
        this.lastTerrainX = t.x;
        this.lastTerrainY = t.y;
      }
    } else {
      const existing = this.terrainMgr.getTerrainAt(x, y);
      if (existing) {
        this.terrainMgr.selectTerrain(x, y);
      } else {
        this.terrainMgr.clearSelection();
        const axis = (document.getElementById('move-axis') as HTMLSelectElement)?.value as 'horizontal' | 'vertical' || 'horizontal';
        const distance = parseFloat((document.getElementById('move-distance') as HTMLInputElement)?.value || '100');
        const speed = parseFloat((document.getElementById('move-speed') as HTMLInputElement)?.value || '100');
        this.terrainMgr.addTerrain(this.selectedTool, x, y, { axis, distance, speed });
        this.physics.setTerrains(this.terrainMgr.getAll());
      }
    }
  }

  private onMouseMove(e: MouseEvent): void {
    const { x, y } = this.getCanvasCoords(e);
    this.mouseX = x;
    this.mouseY = y;

    if (this.isDragging && this.dragTerrainId) {
      const dx = x - this.dragStartX;
      const dy = y - this.dragStartY;
      const snappedDx = Math.round(dx / 4) * 4;
      const snappedDy = Math.round(dy / 4) * 4;
      const targetX = this.lastTerrainX + snappedDx;
      const targetY = this.lastTerrainY + snappedDy;
      const selected = this.terrainMgr.getSelected();
      if (selected) {
        const moveDx = targetX - selected.x;
        const moveDy = targetY - selected.y;
        if (moveDx !== 0 || moveDy !== 0) {
          this.terrainMgr.moveTerrain(this.dragTerrainId, moveDx, moveDy);
          this.physics.setTerrains(this.terrainMgr.getAll());
        }
      }
    }
  }

  private onMouseUp(e: MouseEvent): void {
    this.isDragging = false;
    this.dragTerrainId = null;
  }

  private reset(): void {
    this.terrainMgr.reset();
    this.character.reset();
    this.physics.setTerrains(this.terrainMgr.getAll());
    this.terrainMgr.clearSelection();
  }

  start(): void {
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  private loop(timestamp: number): void {
    if (!this.running) return;

    let dt = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;

    if (dt > 0.05) dt = 0.05;

    this.physics.updateMovingPlatforms(dt);

    if (this.controlEnabled) {
      this.character.update(this.input, [], this.terrainMgr.getAll(), dt);
      const stepResult = this.physics.step(this.character.state, this.input, dt);
      this.character.state = stepResult.char;
    }

    this.input.jumpPressed = false;

    this.renderer.render(
      this.terrainMgr.getAll(),
      this.character.state,
      this.selectedTool,
      this.mouseX,
      this.mouseY,
      this.isDragging
    );

    requestAnimationFrame((t) => this.loop(t));
  }
}

window.addEventListener('DOMContentLoaded', () => {
  try {
    const game = new Game();
    (window as any).__game = game;
    game.start();
  } catch (err) {
    console.error('Failed to start game:', err);
  }
});
