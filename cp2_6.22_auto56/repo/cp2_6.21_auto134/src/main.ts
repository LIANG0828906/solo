import { DoublePendulum } from './engine';
import { Renderer } from './renderer';
import { Controls } from './controls';

class App {
  private canvas: HTMLCanvasElement;
  private pendulum: DoublePendulum;
  private renderer: Renderer;
  private controls: Controls;

  private isDragging1: boolean = false;
  private isDragging2: boolean = false;
  private isHoveringHandle: boolean = false;
  private animationId: number = 0;
  private lastTime: number = 0;
  private readonly dt: number = 0.005;
  private accumulator: number = 0;
  private readonly fpsInterval: number = 1000 / 60;

  constructor() {
    const canvas = document.getElementById('pendulumCanvas');
    if (!canvas) throw new Error('无法找到Canvas元素');
    this.canvas = canvas as HTMLCanvasElement;

    this.pendulum = new DoublePendulum(120, 80, 1, 1, 9.81 * 100);
    this.renderer = new Renderer(this.canvas);
    this.controls = new Controls(this.pendulum, this.renderer);

    this.bindEvents();
    this.start();
  }

  private bindEvents(): void {
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('mouseleave', () => this.onMouseLeave());
    window.addEventListener('mousemove', (e) => this.onWindowMouseMove(e));
    window.addEventListener('mouseup', () => this.onMouseUp());
    
    this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
    window.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
    window.addEventListener('touchend', () => this.onTouchEnd());
  }

  private getMousePos(e: MouseEvent | Touch): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  private getHandle1Pos(): { x: number; y: number } {
    const origin = this.renderer.getOrigin();
    return {
      x: origin.x + this.pendulum.l1 * Math.sin(this.pendulum.initialState.theta1),
      y: origin.y + this.pendulum.l1 * Math.cos(this.pendulum.initialState.theta1)
    };
  }

  private getHandle2Pos(): { x: number; y: number } {
    const origin = this.renderer.getOrigin();
    const h1 = this.getHandle1Pos();
    return {
      x: h1.x + this.pendulum.l2 * Math.sin(this.pendulum.initialState.theta2),
      y: h1.y + this.pendulum.l2 * Math.cos(this.pendulum.initialState.theta2)
    };
  }

  private isPointInHandle(px: number, py: number, hx: number, hy: number, radius: number): boolean {
    const dx = px - hx;
    const dy = py - hy;
    return dx * dx + dy * dy <= radius * radius;
  }

  private onMouseDown(e: MouseEvent): void {
    const pos = this.getMousePos(e);
    const handleRadius = this.renderer.options.handleRadius + 5;
    
    const h2 = this.getHandle2Pos();
    if (this.isPointInHandle(pos.x, pos.y, h2.x, h2.y, handleRadius)) {
      this.isDragging2 = true;
      this.canvas.style.cursor = 'grabbing';
      return;
    }
    
    const h1 = this.getHandle1Pos();
    if (this.isPointInHandle(pos.x, pos.y, h1.x, h1.y, handleRadius)) {
      this.isDragging1 = true;
      this.canvas.style.cursor = 'grabbing';
      return;
    }
  }

  private onMouseMove(e: MouseEvent): void {
    const pos = this.getMousePos(e);
    const handleRadius = this.renderer.options.handleRadius + 5;

    if (!this.isDragging1 && !this.isDragging2) {
      const h1 = this.getHandle1Pos();
      const h2 = this.getHandle2Pos();
      const hovering = this.isPointInHandle(pos.x, pos.y, h1.x, h1.y, handleRadius) ||
          this.isPointInHandle(pos.x, pos.y, h2.x, h2.y, handleRadius);
      this.isHoveringHandle = hovering;
      this.canvas.style.cursor = hovering ? 'grab' : 'default';
    }
  }

  private onWindowMouseMove(e: MouseEvent): void {
    if (!this.isDragging1 && !this.isDragging2) return;

    const pos = this.getMousePos(e);
    const origin = this.renderer.getOrigin();

    if (this.isDragging1) {
      const dx = pos.x - origin.x;
      const dy = pos.y - origin.y;
      const angle = Math.atan2(dx, dy);
      this.pendulum.initialState.theta1 = angle;
      this.pendulum.state.theta1 = angle;
    }

    if (this.isDragging2) {
      const h1 = this.getHandle1Pos();
      const dx = pos.x - h1.x;
      const dy = pos.y - h1.y;
      const angle = Math.atan2(dx, dy);
      this.pendulum.initialState.theta2 = angle;
      this.pendulum.state.theta2 = angle;
    }

    this.pendulum.state.omega1 = 0;
    this.pendulum.state.omega2 = 0;
    this.renderer.clearTrail();
  }

  private onMouseLeave(): void {
    if (!this.isDragging1 && !this.isDragging2) {
      this.isHoveringHandle = false;
      this.canvas.style.cursor = 'default';
    }
  }

  private onMouseUp(): void {
    if (this.isDragging1 || this.isDragging2) {
      this.pendulum.reset();
      this.renderer.clearTrail();
    }
    this.isDragging1 = false;
    this.isDragging2 = false;
    this.isHoveringHandle = false;
    this.canvas.style.cursor = 'default';
  }

  private onTouchStart(e: TouchEvent): void {
    e.preventDefault();
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      this.onMouseDown({ clientX: touch.clientX, clientY: touch.clientY } as MouseEvent);
    }
  }

  private onTouchMove(e: TouchEvent): void {
    e.preventDefault();
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      this.onMouseMove({ clientX: touch.clientX, clientY: touch.clientY } as MouseEvent);
    }
  }

  private onTouchEnd(): void {
    this.onMouseUp();
  }

  private start(): void {
    this.lastTime = performance.now();
    this.loop();
  }

  private loop = (): void => {
    this.animationId = requestAnimationFrame(this.loop);
    
    const now = performance.now();
    let deltaTime = now - this.lastTime;
    
    if (deltaTime > 250) deltaTime = 250;
    this.lastTime = now;
    
    this.accumulator += deltaTime / 1000;
    
    const isDragging = this.isDragging1 || this.isDragging2;
    
    if (!isDragging) {
      while (this.accumulator >= this.dt) {
        this.pendulum.step(this.dt);
        this.accumulator -= this.dt;
      }
    } else {
      this.accumulator = 0;
    }
    
    this.renderer.render(this.pendulum, this.isDragging1, this.isDragging2, this.isHoveringHandle);
  };
}

document.addEventListener('DOMContentLoaded', () => {
  new App();
});
