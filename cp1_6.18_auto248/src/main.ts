import { PhysicsEngine } from './utils/PhysicsEngine';
import { PanelManager } from './ui/PanelManager';
import { Ball } from './entity/Ball';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

class GameApp {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private physicsEngine: PhysicsEngine;
  private panelManager: PanelManager;

  private lastTime: number = 0;
  private fpsTimer: number = 0;
  private frameCount: number = 0;
  private currentFps: number = 0;
  private targetFps: number = 60;
  private lastFrameTime: number = 0;

  private isDragging: boolean = false;
  private isPlacingBall: boolean = false;
  private isSettingVelocity: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private currentMouseX: number = 0;
  private currentMouseY: number = 0;
  private selectedBall: Ball | null = null;
  private dragBallOffsetX: number = 0;
  private dragBallOffsetY: number = 0;
  private previewVx: number = 0;
  private previewVy: number = 0;

  constructor() {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;

    this.physicsEngine = new PhysicsEngine(CANVAS_WIDTH, CANVAS_HEIGHT);

    this.panelManager = new PanelManager(this.physicsEngine, {
      onStartSimulation: () => this.startSimulation(),
      onPauseSimulation: () => this.pauseSimulation(),
      onResetAll: () => this.resetAll(),
      onTogglePrediction: () => this.togglePrediction(),
      onGravityChange: (v) => (this.physicsEngine.gravity = v),
      onDragChange: (v) => (this.physicsEngine.drag = v),
      onPredictDurationChange: (v) => (this.physicsEngine.predictDuration = v),
    });

    this.bindCanvasEvents();
    this.lastTime = performance.now();
    this.lastFrameTime = this.lastTime;
    this.loop();
  }

  private bindCanvasEvents(): void {
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
    this.canvas.addEventListener('mouseleave', (e) => this.onMouseUp(e));
  }

  private getCanvasCoords(e: MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  private onMouseDown(e: MouseEvent): void {
    if (this.physicsEngine.isSimulating) return;

    const { x, y } = this.getCanvasCoords(e);
    this.dragStartX = x;
    this.dragStartY = y;
    this.currentMouseX = x;
    this.currentMouseY = y;
    this.isDragging = true;

    const clickedBall = this.physicsEngine.getBallAt(x, y);
    if (clickedBall) {
      this.selectedBall = clickedBall;
      this.dragBallOffsetX = x - clickedBall.x;
      this.dragBallOffsetY = y - clickedBall.y;
      this.isPlacingBall = false;
      this.isSettingVelocity = false;
    } else {
      this.selectedBall = null;
      this.isPlacingBall = true;
      this.isSettingVelocity = false;
      if (this.physicsEngine.isPredicting) {
        this.physicsEngine.calculatePredictions();
      }
    }
  }

  private onMouseMove(e: MouseEvent): void {
    const { x, y } = this.getCanvasCoords(e);
    this.currentMouseX = x;
    this.currentMouseY = y;

    if (!this.isDragging) return;

    if (this.selectedBall) {
      const newX = x - this.dragBallOffsetX;
      const newY = y - this.dragBallOffsetY;
      const clampedX = Math.max(this.selectedBall.radius, Math.min(CANVAS_WIDTH - this.selectedBall.radius, newX));
      const clampedY = Math.max(this.selectedBall.radius, Math.min(CANVAS_HEIGHT - this.selectedBall.radius, newY));
      this.selectedBall.x = clampedX;
      this.selectedBall.y = clampedY;
      if (this.physicsEngine.isPredicting) {
        this.physicsEngine.calculatePredictions();
      }
    }
  }

  private onMouseUp(e: MouseEvent): void {
    if (!this.isDragging) return;
    this.isDragging = false;

    const { x, y } = this.getCanvasCoords(e);
    const dx = x - this.dragStartX;
    const dy = y - this.dragStartY;
    const dragDist = Math.sqrt(dx * dx + dy * dy);

    if (this.selectedBall) {
      if (dragDist > 5) {
        const speed = Math.min(200, dragDist);
        const nx = dx / dragDist;
        const ny = dy / dragDist;
        this.selectedBall.vx = nx * speed;
        this.selectedBall.vy = ny * speed;
        this.selectedBall.saveInitial();
      } else {
        this.selectedBall.vx = 0;
        this.selectedBall.vy = 0;
        this.selectedBall.saveInitial();
      }
      if (this.physicsEngine.isPredicting) {
        this.physicsEngine.calculatePredictions();
      }
    } else if (this.isPlacingBall) {
      let vx = 0;
      let vy = 0;
      if (dragDist > 5) {
        const speed = Math.min(200, dragDist);
        const nx = dx / dragDist;
        const ny = dy / dragDist;
        vx = nx * speed;
        vy = ny * speed;
      }

      const ball = this.panelManager.createBall(this.dragStartX, this.dragStartY, vx, vy);
      this.selectedBall = ball;

      if (this.physicsEngine.isPredicting) {
        this.physicsEngine.calculatePredictions();
      }

      this.updateAdaptiveFps();
    }

    this.isPlacingBall = false;
    this.isSettingVelocity = false;
  }

  private startSimulation(): void {
    this.physicsEngine.isSimulating = true;
    this.selectedBall = null;
  }

  private pauseSimulation(): void {
    this.physicsEngine.isSimulating = false;
  }

  private resetAll(): void {
    this.physicsEngine.isSimulating = false;
    this.physicsEngine.resetAll();
    this.selectedBall = null;
    const startBtn = document.getElementById('startBtn') as HTMLButtonElement;
    if (startBtn) {
      startBtn.textContent = '开始模拟';
      startBtn.classList.remove('active');
    }
  }

  private togglePrediction(): void {
    this.physicsEngine.isPredicting = !this.physicsEngine.isPredicting;
    if (this.physicsEngine.isPredicting) {
      this.physicsEngine.calculatePredictions();
    }
  }

  private updateAdaptiveFps(): void {
    const ballCount = this.physicsEngine.balls.length;
    this.targetFps = ballCount > 15 ? 30 : 60;
  }

  private render(): void {
    this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    this.drawGrid();

    this.physicsEngine.drawAll(this.ctx, this.selectedBall);

    if (!this.physicsEngine.isSimulating && this.selectedBall) {
      if (this.isDragging) {
        const dx = this.currentMouseX - this.dragStartX;
        const dy = this.currentMouseY - this.dragStartY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 5) {
          const speed = Math.min(200, dist);
          const nx = dx / dist;
          const ny = dy / dist;
          this.previewVx = nx * speed;
          this.previewVy = ny * speed;
          this.selectedBall.drawVelocityArrow(this.ctx, this.previewVx, this.previewVy);
        }
      } else {
        this.selectedBall.drawVelocityArrow(this.ctx, this.selectedBall.vx, this.selectedBall.vy);
      }
    }

    if (!this.physicsEngine.isSimulating && this.isDragging && !this.selectedBall && this.isPlacingBall) {
      const dx = this.currentMouseX - this.dragStartX;
      const dy = this.currentMouseY - this.dragStartY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const hex = this.panelManager.selectedColor;
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (result) {
        const r = parseInt(result[1], 16);
        const g = parseInt(result[2], 16);
        const b = parseInt(result[3], 16);
        this.ctx.beginPath();
        this.ctx.arc(this.dragStartX, this.dragStartY, this.panelManager.selectedRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.5)`;
        this.ctx.fill();
        this.ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.8)`;
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([4, 3]);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
      }

      if (dist > 5) {
        const speed = Math.min(200, dist);
        const arrowLength = (speed / 200) * 120;
        const nx = dx / dist;
        const ny = dy / dist;
        const endX = this.dragStartX + nx * arrowLength;
        const endY = this.dragStartY + ny * arrowLength;

        const result2 = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(this.panelManager.selectedColor);
        if (result2) {
          const r2 = parseInt(result2[1], 16);
          const g2 = parseInt(result2[2], 16);
          const b2 = parseInt(result2[3], 16);
          const arrowColor = `rgba(${r2}, ${g2}, ${b2}, 0.5)`;

          this.ctx.beginPath();
          this.ctx.moveTo(this.dragStartX, this.dragStartY);
          this.ctx.lineTo(endX, endY);
          this.ctx.strokeStyle = arrowColor;
          this.ctx.lineWidth = 3;
          this.ctx.lineCap = 'round';
          this.ctx.stroke();

          const headLength = 12;
          const angle = Math.atan2(ny, nx);
          this.ctx.beginPath();
          this.ctx.moveTo(endX, endY);
          this.ctx.lineTo(
            endX - headLength * Math.cos(angle - Math.PI / 6),
            endY - headLength * Math.sin(angle - Math.PI / 6)
          );
          this.ctx.moveTo(endX, endY);
          this.ctx.lineTo(
            endX - headLength * Math.cos(angle + Math.PI / 6),
            endY - headLength * Math.sin(angle + Math.PI / 6)
          );
          this.ctx.strokeStyle = arrowColor;
          this.ctx.lineWidth = 3;
          this.ctx.lineCap = 'round';
          this.ctx.stroke();
        }
      }
    }
  }

  private drawGrid(): void {
    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    this.ctx.lineWidth = 1;

    const gridSize = 50;
    for (let x = 0; x <= CANVAS_WIDTH; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, CANVAS_HEIGHT);
      this.ctx.stroke();
    }
    for (let y = 0; y <= CANVAS_HEIGHT; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(CANVAS_WIDTH, y);
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  private loop = (): void => {
    requestAnimationFrame(this.loop);

    const now = performance.now();
    const elapsed = (now - this.lastFrameTime) / 1000;
    const frameInterval = 1 / this.targetFps;

    if (elapsed < frameInterval) return;

    const dt = Math.min(elapsed, frameInterval * 2);

    this.physicsEngine.step(dt);

    for (const ball of this.physicsEngine.balls) {
      if (ball.isResetting) {
        ball.updateReset(dt);
      }
    }

    this.render();

    this.lastFrameTime = now;

    this.frameCount++;
    this.fpsTimer += dt;
    if (this.fpsTimer >= 0.5) {
      this.currentFps = this.frameCount / this.fpsTimer;
      this.frameCount = 0;
      this.fpsTimer = 0;
      this.panelManager.updateStatus(this.currentFps);
    }
  };
}

window.addEventListener('DOMContentLoaded', () => {
  new GameApp();
});
