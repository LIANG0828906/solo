import { Star } from './star';
import { StarTrail } from './starTrail';
import { ControlPanel, ControlParams } from './controlPanel';
import { clamp, lerp, random, hexToRgba } from './utils';

const BG_COLOR = '#0B0A0E';
const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
const SCALE_SMOOTHING = 0.3;
const DAMPING = 0.92;
const MAX_TRAILS = 5;
const RIPPLE_DURATION = 0.5;
const RIPPLE_MAX_RADIUS = 40;

interface Ripple {
  x: number;
  y: number;
  age: number;
  duration: number;
}

class GalaxyApp {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private stars: Star[] = [];
  private trails: StarTrail[] = [];
  private ripples: Ripple[] = [];
  private controlPanel: ControlPanel;
  private params: ControlParams;

  private viewportX: number = 0;
  private viewportY: number = 0;
  private targetViewportX: number = 0;
  private targetViewportY: number = 0;

  private scale: number = 1;
  private targetScale: number = 1;

  private isDragging: boolean = false;
  private lastMouseX: number = 0;
  private lastMouseY: number = 0;
  private velocityX: number = 0;
  private velocityY: number = 0;

  private lastTime: number = 0;
  private animationId: number = 0;

  private isResetting: boolean = false;
  private resetProgress: number = 0;

  constructor() {
    this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    this.ctx = ctx;

    this.controlPanel = new ControlPanel(
      this.handleControlChange.bind(this),
      this.handleReset.bind(this)
    );
    this.params = this.controlPanel.getParams();

    this.init();
  }

  private init(): void {
    this.resizeCanvas();
    window.addEventListener('resize', this.resizeCanvas.bind(this));

    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });

    this.canvas.addEventListener('click', this.handleClick.bind(this));

    this.generateStars();

    this.lastTime = performance.now();
    this.animate();
  }

  private resizeCanvas(): void {
    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    this.ctx.scale(dpr, dpr);
  }

  private generateStars(): void {
    this.stars = [];
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const spread = Math.min(window.innerWidth, window.innerHeight) * 0.35;

    for (let i = 0; i < this.params.starDensity; i++) {
      const angle = random(0, Math.PI * 2);
      const dist = random(0, spread);
      const x = centerX + Math.cos(angle) * dist;
      const y = centerY + Math.sin(angle) * dist;
      const star = new Star(x, y, this.params.haloIntensity);
      if (this.isResetting) {
        star.alpha = 0;
        star.targetAlpha = 0;
      }
      this.stars.push(star);
    }
  }

  private handleControlChange(params: ControlParams): void {
    const oldDensity = this.params.starDensity;
    const oldHalo = this.params.haloIntensity;
    this.params = { ...params };

    if (params.starDensity !== oldDensity) {
      this.updateStarCount();
    }

    if (params.haloIntensity !== oldHalo) {
      this.stars.forEach(star => star.setHaloIntensity(params.haloIntensity));
    }
  }

  private updateStarCount(): void {
    const targetCount = this.params.starDensity;
    const currentCount = this.stars.length;

    if (targetCount > currentCount) {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const spread = Math.min(window.innerWidth, window.innerHeight) * 0.35;

      for (let i = currentCount; i < targetCount; i++) {
        const angle = random(0, Math.PI * 2);
        const dist = random(0, spread);
        const x = centerX + Math.cos(angle) * dist;
        const y = centerY + Math.sin(angle) * dist;
        const star = new Star(x, y, this.params.haloIntensity);
        star.alpha = 0;
        star.fadeIn();
        this.stars.push(star);
      }
    } else if (targetCount < currentCount) {
      const toRemove = currentCount - targetCount;
      for (let i = 0; i < toRemove; i++) {
        const idx = this.stars.length - 1 - i;
        if (idx >= 0) {
          this.stars[idx].fadeOut();
        }
      }
      setTimeout(() => {
        this.stars = this.stars.slice(0, targetCount);
      }, 500);
    }
  }

  private handleReset(): void {
    if (this.isResetting) return;

    this.isResetting = true;
    this.resetProgress = 0;

    this.stars.forEach(star => star.fadeOut());
    this.trails.forEach(trail => {
      trail.duration = 0.5;
      trail.age = Math.max(0, trail.duration - 0.3);
    });

    setTimeout(() => {
      this.trails = [];
      this.stars = [];
      this.generateStars();

      setTimeout(() => {
        this.stars.forEach(star => star.fadeIn());
        this.isResetting = false;
      }, 100);
    }, 800);
  }

  private handleMouseDown(e: MouseEvent): void {
    this.isDragging = true;
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
    this.velocityX = 0;
    this.velocityY = 0;
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.isDragging) return;

    const dx = e.clientX - this.lastMouseX;
    const dy = e.clientY - this.lastMouseY;

    this.targetViewportX += dx;
    this.targetViewportY += dy;

    this.velocityX = dx;
    this.velocityY = dy;

    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
  }

  private handleMouseUp(): void {
    this.isDragging = false;
  }

  private handleWheel(e: WheelEvent): void {
    e.preventDefault();

    const delta = -e.deltaY * 0.001;
    const newScale = clamp(this.targetScale * (1 + delta), MIN_SCALE, MAX_SCALE);

    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const scaleRatio = newScale / this.targetScale;

    this.targetViewportX = mouseX - (mouseX - this.targetViewportX) * scaleRatio;
    this.targetViewportY = mouseY - (mouseY - this.targetViewportY) * scaleRatio;

    this.targetScale = newScale;
  }

  private handleClick(e: MouseEvent): void {
    if (Math.abs(this.velocityX) > 2 || Math.abs(this.velocityY) > 2) return;

    const rect = this.canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const worldX = (clickX - this.viewportX) / this.scale;
    const worldY = (clickY - this.viewportY) / this.scale;

    this.addRipple(clickX, clickY);

    if (this.trails.length >= MAX_TRAILS) {
      this.trails.shift();
    }

    const trail = new StarTrail(worldX, worldY, this.params.trailLength);
    this.trails.push(trail);
  }

  private addRipple(x: number, y: number): void {
    this.ripples.push({
      x,
      y,
      age: 0,
      duration: RIPPLE_DURATION
    });
  }

  private update(deltaTime: number, currentTime: number): void {
    const smoothing = 1 - Math.pow(0.01, deltaTime / SCALE_SMOOTHING);
    this.scale = lerp(this.scale, this.targetScale, smoothing);
    this.viewportX = lerp(this.viewportX, this.targetViewportX, smoothing);
    this.viewportY = lerp(this.viewportY, this.targetViewportY, smoothing);

    if (!this.isDragging) {
      this.velocityX *= DAMPING;
      this.velocityY *= DAMPING;

      if (Math.abs(this.velocityX) > 0.01 || Math.abs(this.velocityY) > 0.01) {
        this.targetViewportX += this.velocityX;
        this.targetViewportY += this.velocityY;
      }
    }

    this.stars.forEach(star => star.update(deltaTime, currentTime));

    this.trails.forEach(trail => trail.update(deltaTime));
    this.trails = this.trails.filter(trail => !trail.isDead);

    this.ripples.forEach(ripple => {
      ripple.age += deltaTime;
    });
    this.ripples = this.ripples.filter(ripple => ripple.age < ripple.duration);
  }

  private draw(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.ctx.fillStyle = BG_COLOR;
    this.ctx.fillRect(0, 0, width, height);

    this.drawStarfield();

    this.ctx.save();
    this.ctx.translate(this.viewportX, this.viewportY);
    this.ctx.scale(this.scale, this.scale);

    this.trails.forEach(trail => trail.draw(this.ctx));

    this.stars.forEach(star => star.draw(this.ctx));

    this.ctx.restore();

    this.ripples.forEach(ripple => this.drawRipple(ripple));
  }

  private drawStarfield(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.ctx.save();
    const bgGradient = this.ctx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, Math.max(width, height) * 0.7
    );
    bgGradient.addColorStop(0, '#12111A');
    bgGradient.addColorStop(0.5, '#0E0D14');
    bgGradient.addColorStop(1, BG_COLOR);

    this.ctx.fillStyle = bgGradient;
    this.ctx.fillRect(0, 0, width, height);

    this.ctx.globalAlpha = 0.3;
    for (let i = 0; i < 50; i++) {
      const x = (i * 137.5 + this.viewportX * 0.1) % width;
      const y = (i * 97.3 + this.viewportY * 0.1) % height;
      const size = (i % 3) + 0.5;

      this.ctx.fillStyle = hexToRgba('#E8D5B7', 0.15 + (i % 5) * 0.05);
      this.ctx.beginPath();
      this.ctx.arc(x, y, size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.restore();
  }

  private drawRipple(ripple: Ripple): void {
    const progress = ripple.age / ripple.duration;
    const radius = progress * RIPPLE_MAX_RADIUS;
    const alpha = 0.6 * (1 - progress);

    this.ctx.save();
    this.ctx.strokeStyle = hexToRgba('#E8D5B7', alpha);
    this.ctx.lineWidth = 2 * (1 - progress);
    this.ctx.beginPath();
    this.ctx.arc(ripple.x, ripple.y, radius, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.restore();
  }

  private animate(): void {
    const currentTime = performance.now();
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.05);
    this.lastTime = currentTime;

    this.update(deltaTime, currentTime / 1000);
    this.draw();

    this.animationId = requestAnimationFrame(() => this.animate());
  }

  public destroy(): void {
    cancelAnimationFrame(this.animationId);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new GalaxyApp();
});
