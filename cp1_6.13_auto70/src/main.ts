import { GridEngine, SpreadMode } from './gridEngine';
import { Renderer } from './renderer';
import { Controls } from './controls';
import './style.css';

class GridTideApp {
  private appContainer: HTMLElement;
  private gridEngine: GridEngine;
  private renderer: Renderer | null = null;
  private canvas: HTMLCanvasElement | null = null;

  private isDragging: boolean = false;
  private dragRow: number = -1;
  private dragCol: number = -1;
  private dragStartY: number = 0;
  private dragStartHeight: number = 0;

  private animationId: number = 0;
  private lastTime: number = 0;
  private frameCount: number = 0;

  constructor() {
    const app = document.getElementById('app');
    if (!app) throw new Error('App container not found');
    this.appContainer = app;

    this.gridEngine = new GridEngine(20, 20);
    this.init();
  }

  private init(): void {
    this.createLayout();
    this.setupInteractions();
    this.startAnimation();

    window.addEventListener('resize', () => {
      if (this.renderer) {
        this.renderer.resize();
      }
    });
  }

  private createLayout(): void {
    const canvasContainer = document.createElement('div');
    canvasContainer.className = 'canvas-container';

    const canvas = document.createElement('canvas');
    this.canvas = canvas;
    canvasContainer.appendChild(canvas);

    const infoText = document.createElement('div');
    infoText.className = 'info-text';
    infoText.textContent = '拖拽节点产生波纹';
    canvasContainer.appendChild(infoText);

    const controlPanelContainer = document.createElement('div');
    controlPanelContainer.style.position = 'relative';
    controlPanelContainer.style.zIndex = '10';

    this.appContainer.appendChild(controlPanelContainer);
    this.appContainer.appendChild(canvasContainer);

    this.renderer = new Renderer(canvas, this.gridEngine);

    new Controls(controlPanelContainer, {
      spreadDecay: this.gridEngine.getSpreadDecay(),
      spreadMode: this.gridEngine.getSpreadMode(),
      onSpreadDecayChange: (value: number) => {
        this.gridEngine.setSpreadDecay(value);
      },
      onSpreadModeChange: (mode: SpreadMode) => {
        this.gridEngine.setSpreadMode(mode);
      },
      onReset: () => {
        this.gridEngine.reset(true);
      }
    });
  }

  private setupInteractions(): void {
    if (!this.canvas || !this.renderer) return;

    const canvas = this.canvas;

    canvas.addEventListener('mousedown', (e) => {
      this.handleMouseDown(e);
    });

    canvas.addEventListener('mousemove', (e) => {
      this.handleMouseMove(e);
    });

    canvas.addEventListener('mouseup', () => {
      this.handleMouseUp();
    });

    canvas.addEventListener('mouseleave', () => {
      this.handleMouseUp();
    });

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.handleMouseDown({
        clientX: touch.clientX,
        clientY: touch.clientY
      } as MouseEvent);
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.handleMouseMove({
        clientX: touch.clientX,
        clientY: touch.clientY
      } as MouseEvent);
    }, { passive: false });

    canvas.addEventListener('touchend', () => {
      this.handleMouseUp();
    });
  }

  private handleMouseDown(e: MouseEvent): void {
    if (!this.canvas || !this.renderer) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const gridPos = this.renderer.screenToGrid(x, y);
    
    if (gridPos.row >= 0 && gridPos.row < this.gridEngine.getRows() &&
        gridPos.col >= 0 && gridPos.col < this.gridEngine.getCols()) {
      
      const nodePos = this.renderer.gridToScreen(gridPos.row, gridPos.col);
      const node = this.gridEngine.getNode(gridPos.row, gridPos.col);
      
      if (node) {
        const dist = Math.sqrt(Math.pow(x - nodePos.x, 2) + Math.pow(y - nodePos.y, 2));
        const hitRadius = this.renderer.getNodeRadius() * 2.5;
        
        if (dist < hitRadius) {
          this.isDragging = true;
          this.dragRow = gridPos.row;
          this.dragCol = gridPos.col;
          this.dragStartY = y;
          this.dragStartHeight = node.height;
        }
      }
    }
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.isDragging || !this.canvas || !this.renderer) return;

    const rect = this.canvas.getBoundingClientRect();
    const y = e.clientY - rect.top;

    const deltaY = y - this.dragStartY;
    const heightDelta = -deltaY / 15;
    const newHeight = this.dragStartHeight + heightDelta;

    this.gridEngine.dragNode(this.dragRow, this.dragCol, newHeight);
  }

  private handleMouseUp(): void {
    if (!this.isDragging) return;

    this.isDragging = false;
    
    if (this.dragRow >= 0 && this.dragCol >= 0) {
      this.gridEngine.releaseNode(this.dragRow, this.dragCol);
    }

    this.dragRow = -1;
    this.dragCol = -1;
  }

  private startAnimation(): void {
    const animate = (time: number) => {
      if (!this.lastTime) this.lastTime = time;
      const delta = time - this.lastTime;
      this.lastTime = time;

      this.frameCount++;
      if (delta >= 1000) {
        this.frameCount = 0;
      }

      this.gridEngine.update();

      if (this.renderer) {
        this.renderer.render();
      }

      this.animationId = requestAnimationFrame(animate);
    };

    this.animationId = requestAnimationFrame(animate);
  }

  destroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new GridTideApp();
});
