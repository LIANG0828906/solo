import { Editor } from './editor';
import { Renderer } from './renderer';
import { PhysicsWorld } from './physics';
import { UI } from './ui';
import { ElementType, COLORS, GRID_SIZE } from './types';
import { v4 as uuidv4 } from 'uuid';

class GameApp {
  private editor: Editor;
  private renderer: Renderer;
  private physics: PhysicsWorld;
  private ui: UI;
  private canvas: HTMLCanvasElement;
  private lastTime: number = 0;
  private isMouseDown: boolean = false;
  private isMiddleMouseDown: boolean = false;
  private lastMouseX: number = 0;
  private lastMouseY: number = 0;
  private animationId: number = 0;
  private fadeStartTime: number = 0;

  constructor() {
    this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
    this.editor = new Editor();
    this.renderer = new Renderer(this.canvas);
    this.physics = new PhysicsWorld();
    this.ui = new UI();

    this.init();
  }

  private init(): void {
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.bindCanvasEvents();
    this.bindUIEvents();
    this.bindKeyboardEvents();

    this.editor.onChange(() => this.onEditorChange());
    this.physics.onComplete((time) => this.onLevelComplete(time));

    this.updateStats();

    this.lastTime = performance.now();
    this.animate();
  }

  private resizeCanvas(): void {
    const container = this.canvas.parentElement;
    if (container) {
      const rect = container.getBoundingClientRect();
      this.renderer.resize(rect.width, rect.height);
    }
  }

  private bindCanvasEvents(): void {
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
    this.canvas.addEventListener('mouseleave', (e) => this.onMouseLeave(e));
    this.canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private bindUIEvents(): void {
    this.ui.onSaveDraft((name) => this.saveDraft(name));
    this.ui.onLoadDraft((data) => this.loadDraft(data));
    this.ui.onDeleteDraft((id) => this.deleteDraft(id));
    this.ui.onClear(() => this.clearLevel());
    this.ui.onPlayToggle((playing) => this.togglePlay(playing));
    this.ui.onElementSelect((type) => this.editor.setSelectedElement(type));
  }

  private bindKeyboardEvents(): void {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
      }
      this.physics.keyDown(e.code);
    });

    window.addEventListener('keyup', (e) => {
      this.physics.keyUp(e.code);
    });
  }

  private onMouseDown(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (e.button === 1) {
      this.isMiddleMouseDown = true;
      this.lastMouseX = x;
      this.lastMouseY = y;
      this.canvas.style.cursor = 'grabbing';
      return;
    }

    if (e.button === 0 && !this.editor.getState().isPlaying) {
      this.isMouseDown = true;
      this.handleClick(x, y);
    }
  }

  private onMouseMove(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (this.isMiddleMouseDown) {
      const dx = x - this.lastMouseX;
      const dy = y - this.lastMouseY;
      this.editor.pan(dx, dy);
      this.lastMouseX = x;
      this.lastMouseY = y;
      return;
    }

    const gridPos = this.editor.screenToGrid(x, y);
    this.editor.setHoverPosition(gridPos.x, gridPos.y);

    if (this.isMouseDown && !this.editor.getState().isPlaying) {
      this.handleClick(x, y, true);
    }
  }

  private onMouseUp(e: MouseEvent): void {
    if (e.button === 1) {
      this.isMiddleMouseDown = false;
      this.canvas.style.cursor = 'crosshair';
    }
    this.isMouseDown = false;
  }

  private onMouseLeave(e: MouseEvent): void {
    this.isMouseDown = false;
    this.isMiddleMouseDown = false;
    this.editor.setHoverPosition(-1, -1);
    this.canvas.style.cursor = 'crosshair';
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const currentZoom = this.editor.getState().zoom;
    this.editor.setZoom(currentZoom + delta * currentZoom, x, y);
  }

  private handleClick(screenX: number, screenY: number, isDrag: boolean = false): void {
    const gridPos = this.editor.screenToGrid(screenX, screenY);
    const state = this.editor.getState();

    if (state.isPlaying) return;

    const placed = this.editor.toggleElement(gridPos.x, gridPos.y);

    if (placed && !isDrag) {
      const worldX = gridPos.x * GRID_SIZE + GRID_SIZE / 2;
      const worldY = gridPos.y * GRID_SIZE + GRID_SIZE / 2;

      let particleColor = COLORS.brick;
      switch (state.selectedElement) {
        case ElementType.BRICK:
          particleColor = COLORS.brick;
          break;
        case ElementType.SPIKE:
          particleColor = COLORS.spike;
          break;
        case ElementType.PLATFORM:
          particleColor = COLORS.platform;
          break;
        case ElementType.GOAL:
          particleColor = COLORS.goal;
          break;
      }

      this.renderer.spawnParticles(worldX, worldY, particleColor, 10);
    }
  }

  private onEditorChange(): void {
    this.updateStats();
    this.syncPhysicsElements();
  }

  private updateStats(): void {
    const stats = this.editor.getStats();
    this.ui.updateStats(stats);
  }

  private syncPhysicsElements(): void {
    this.physics.setElements(this.editor.getElements());
    const spawn = this.editor.getSpawnPosition();
    this.physics.setSpawn(spawn.x, spawn.y);
  }

  private togglePlay(playing: boolean): void {
    this.editor.setPlaying(playing);

    if (playing) {
      this.syncPhysicsElements();
      this.physics.resetPlayer();
    }
  }

  private onLevelComplete(time: number): void {
    this.ui.showCompletionModal(time);
  }

  private saveDraft(name: string): void {
    const data = this.editor.exportData(name);
    data.id = uuidv4();
    this.ui.addDraft(data);
  }

  private loadDraft(data: any): void {
    this.editor.setFading(true);
    
    setTimeout(() => {
      this.editor.importData(data);
      this.ui.setDraftName(data.name);
      
      setTimeout(() => {
        this.editor.setFading(false);
      }, 100);
    }, 100);
  }

  private deleteDraft(id: string): void {
  }

  private clearLevel(): void {
    this.editor.clear();
    this.ui.setCurrentDraftId(null);
  }

  private animate(): void {
    const currentTime = performance.now();
    const dt = Math.min((currentTime - this.lastTime) / 1000, 1 / 30);
    this.lastTime = currentTime;

    const state = this.editor.getState();

    if (state.isPlaying) {
      this.physics.update(dt);
    }

    this.renderer.updateParticles(dt);

    const elements = this.editor.getElements();
    const player = state.isPlaying ? this.physics.getPlayer() : undefined;
    const time = state.isPlaying ? this.physics.getElapsedTime() : currentTime / 1000;
    const platformPositions = state.isPlaying ? this.physics.getPlatformPositions() : undefined;

    this.renderer.render(state, elements, player, time, platformPositions);

    this.animationId = requestAnimationFrame(() => this.animate());
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new GameApp();
});
