import {
  GameStateFrame,
  ShipState,
  Projectile,
  ResourcePoint,
  Particle,
  FloatingText,
  Star,
  SHIP_COLORS,
  FACTION_COLORS,
  MAP_SIZE,
  ShipType,
} from '../shared/types';

export class GameCanvas {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private camera: { x: number; y: number; zoom: number };
  private isDragging: boolean;
  private lastMousePos: { x: number; y: number };
  private stars: Star[];
  private fps: number;
  private fpsHistory: number[];
  private lastFrameTime: number;
  private offscreenCanvas: HTMLCanvasElement;
  private currentFrame: GameStateFrame | null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D context');
    this.ctx = ctx;

    this.camera = { x: MAP_SIZE / 2, y: MAP_SIZE / 2, zoom: 0.15 };
    this.isDragging = false;
    this.lastMousePos = { x: 0, y: 0 };
    this.stars = [];
    this.fps = 0;
    this.fpsHistory = [];
    this.lastFrameTime = performance.now();
    this.offscreenCanvas = document.createElement('canvas');
    this.currentFrame = null;

    this.resize();
    this.generateStars();
    this.preRenderBackground();

    this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.canvas.addEventListener('mouseleave', this.onMouseUp.bind(this));
    this.canvas.addEventListener('wheel', this.onWheel.bind(this));
    window.addEventListener('resize', this.resize.bind(this));
  }

  private resize(): void {
    const parent = this.canvas.parentElement;
    if (parent) {
      this.canvas.width = parent.clientWidth;
      this.canvas.height = parent.clientHeight;
      this.offscreenCanvas.width = this.canvas.width;
      this.offscreenCanvas.height = this.canvas.height;
      this.preRenderBackground();
    }
  }

  private generateStars(): void {
    this.stars = [];
    for (let i = 0; i < 200; i++) {
      this.stars.push({
        x: Math.random() * MAP_SIZE,
        y: Math.random() * MAP_SIZE,
        size: Math.random() * 2 + 0.5,
        brightness: Math.random() * 0.5 + 0.5,
        twinkleSpeed: Math.random() * 2 + 1,
        twinklePhase: Math.random() * Math.PI * 2,
      });
    }
  }

  private preRenderBackground(): void {
    const ctx = this.offscreenCanvas.getContext('2d');
    if (!ctx) return;

    const gradient = ctx.createRadialGradient(
      this.offscreenCanvas.width / 2,
      this.offscreenCanvas.height / 2,
      0,
      this.offscreenCanvas.width / 2,
      this.offscreenCanvas.height / 2,
      Math.max(this.offscreenCanvas.width, this.offscreenCanvas.height) / 2
    );
    gradient.addColorStop(0, '#1a1f2e');
    gradient.addColorStop(1, '#0b0e17');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);

    const time = performance.now() / 1000;
    for (const star of this.stars) {
      const screen = this.worldToScreen(star.x, star.y);
      const twinkle = Math.sin(time * star.twinkleSpeed + star.twinklePhase) * 0.3 + 0.7;
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, star.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness * twinkle})`;
      ctx.fill();
    }
  }

  private worldToScreen(x: number, y: number): { x: number; y: number } {
    return {
      x: (x - this.camera.x) * this.camera.zoom + this.canvas.width / 2,
      y: (y - this.camera.y) * this.camera.zoom + this.canvas.height / 2,
    };
  }

  private screenToWorld(x: number, y: number): { x: number; y: number } {
    return {
      x: (x - this.canvas.width / 2) / this.camera.zoom + this.camera.x,
      y: (y - this.canvas.height / 2) / this.camera.zoom + this.camera.y,
    };
  }

  private isInViewport(x: number, y: number, margin: number = 50): boolean {
    const screen = this.worldToScreen(x, y);
    return (
      screen.x >= -margin &&
      screen.x <= this.canvas.width + margin &&
      screen.y >= -margin &&
      screen.y <= this.canvas.height + margin
    );
  }

  private drawHexagon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3 - Math.PI / 6;
      const px = x + size * Math.cos(angle);
      const py = y + size * Math.sin(angle);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  private drawShip(ship: ShipState): void {
    if (!this.isInViewport(ship.x, ship.y, 100)) return;

    const screen = this.worldToScreen(ship.x, ship.y);
    const baseSize = this.getShipSize(ship.type);
    const size = baseSize * this.camera.zoom;

    if (ship.trail.length > 1) {
      this.ctx.beginPath();
      for (let i = 0; i < ship.trail.length; i++) {
        const point = ship.trail[i];
        const trailScreen = this.worldToScreen(point.x, point.y);
        const alpha = (1 - point.age) * 0.5;
        if (i === 0) {
          this.ctx.moveTo(trailScreen.x, trailScreen.y);
        } else {
          this.ctx.lineTo(trailScreen.x, trailScreen.y);
        }
        this.ctx.strokeStyle = `rgba(74, 125, 255, ${alpha})`;
      }
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }

    const factionColor = FACTION_COLORS[ship.faction];
    const shipColor = SHIP_COLORS[ship.type];

    this.ctx.save();
    this.ctx.translate(screen.x, screen.y);
    this.ctx.rotate(ship.angle);

    this.ctx.shadowColor = factionColor;
    this.ctx.shadowBlur = 15;

    this.ctx.fillStyle = shipColor;
    this.ctx.strokeStyle = factionColor;
    this.ctx.lineWidth = 2;

    if (ship.type === 'scout') {
      this.ctx.beginPath();
      this.ctx.moveTo(size, 0);
      this.ctx.lineTo(-size * 0.7, size * 0.6);
      this.ctx.lineTo(-size * 0.4, 0);
      this.ctx.lineTo(-size * 0.7, -size * 0.6);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
    } else if (ship.type === 'capital') {
      this.drawHexagon(this.ctx, 0, 0, size);
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.beginPath();
      this.drawHexagon(this.ctx, 0, 0, size * 0.5);
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
    } else if (ship.type === 'carrier') {
      this.ctx.fillRect(-size, -size * 0.5, size * 2, size);
      this.ctx.strokeRect(-size, -size * 0.5, size * 2, size);
      this.ctx.beginPath();
      this.ctx.moveTo(size, size * 0.8);
      this.ctx.lineTo(size * 0.5, size * 1.4);
      this.ctx.lineTo(size * 1.5, size * 1.4);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.moveTo(size, -size * 0.8);
      this.ctx.lineTo(size * 0.5, -size * 1.4);
      this.ctx.lineTo(size * 1.5, -size * 1.4);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
    }

    this.ctx.restore();

    const shieldPercent = ship.shield / ship.maxShield;
    const barWidth = size * 2;
    const barHeight = 4;
    const barY = screen.y + size + 8;

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(screen.x - barWidth / 2, barY, barWidth, barHeight);

    const shieldColor = shieldPercent > 0.5 ? '#22c55e' : shieldPercent > 0.25 ? '#fbbf24' : '#ef4444';
    this.ctx.fillStyle = shieldColor;
    this.ctx.fillRect(screen.x - barWidth / 2, barY, barWidth * shieldPercent, barHeight);
  }

  private getShipSize(type: ShipType): number {
    switch (type) {
      case 'scout': return 15;
      case 'capital': return 30;
      case 'carrier': return 25;
    }
  }

  private drawProjectile(proj: Projectile): void {
    if (!this.isInViewport(proj.x, proj.y)) return;

    const screen = this.worldToScreen(proj.x, proj.y);
    const factionColor = FACTION_COLORS[proj.faction];

    this.ctx.shadowColor = factionColor;
    this.ctx.shadowBlur = 10;
    this.ctx.strokeStyle = factionColor;
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(screen.x, screen.y);
    const length = 10 * this.camera.zoom;
    this.ctx.lineTo(
      screen.x - (proj.vx / Math.sqrt(proj.vx ** 2 + proj.vy ** 2 || 1)) * length,
      screen.y - (proj.vy / Math.sqrt(proj.vx ** 2 + proj.vy ** 2 || 1)) * length
    );
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;
  }

  private drawResourcePoint(rp: ResourcePoint): void {
    if (!this.isInViewport(rp.x, rp.y, 100)) return;

    const screen = this.worldToScreen(rp.x, rp.y);
    const size = 25 * this.camera.zoom;
    const pulse = Math.sin(rp.pulsePhase) * 0.2 + 1;

    const gradient = this.ctx.createRadialGradient(
      screen.x, screen.y, 0,
      screen.x, screen.y, size * 2 * pulse
    );
    gradient.addColorStop(0, 'rgba(251, 191, 36, 0.3)');
    gradient.addColorStop(1, 'rgba(251, 191, 36, 0)');
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(screen.x, screen.y, size * 2 * pulse, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.shadowColor = '#fbbf24';
    this.ctx.shadowBlur = 20;
    this.ctx.fillStyle = '#fbbf24';
    this.ctx.strokeStyle = '#f59e0b';
    this.ctx.lineWidth = 2;
    this.drawHexagon(this.ctx, screen.x, screen.y, size);
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;

    const resourcePercent = rp.resourceAmount / rp.maxResource;
    const barWidth = size * 2;
    const barHeight = 5;
    const barY = screen.y + size + 10;

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(screen.x - barWidth / 2, barY, barWidth, barHeight);

    this.ctx.fillStyle = '#fbbf24';
    this.ctx.fillRect(screen.x - barWidth / 2, barY, barWidth * resourcePercent, barHeight);
  }

  private drawParticle(particle: Particle): void {
    if (!this.isInViewport(particle.x, particle.y)) return;

    const screen = this.worldToScreen(particle.x, particle.y);
    const alpha = particle.life / particle.maxLife;
    const size = particle.size * this.camera.zoom;

    this.ctx.fillStyle = particle.color;
    this.ctx.globalAlpha = alpha;
    this.ctx.beginPath();
    this.ctx.arc(screen.x, screen.y, size, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.globalAlpha = 1;
  }

  private drawFloatingText(ft: FloatingText): void {
    if (!this.isInViewport(ft.x, ft.y)) return;

    const screen = this.worldToScreen(ft.x, ft.y);
    const alpha = ft.life / ft.maxLife;
    const offsetY = (1 - alpha) * 30;

    this.ctx.font = `bold ${14 * this.camera.zoom}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = ft.color;
    this.ctx.globalAlpha = alpha;
    this.ctx.fillText(ft.text, screen.x, screen.y - offsetY);
    this.ctx.globalAlpha = 1;
  }

  private drawGrid(): void {
    const gridSize = 200;
    const startX = Math.floor((this.camera.x - this.canvas.width / 2 / this.camera.zoom) / gridSize) * gridSize;
    const startY = Math.floor((this.camera.y - this.canvas.height / 2 / this.camera.zoom) / gridSize) * gridSize;
    const endX = startX + this.canvas.width / this.camera.zoom + gridSize * 2;
    const endY = startY + this.canvas.height / this.camera.zoom + gridSize * 2;

    this.ctx.strokeStyle = 'rgba(74, 125, 255, 0.1)';
    this.ctx.lineWidth = 1;

    for (let x = startX; x < endX; x += gridSize) {
      const screen = this.worldToScreen(x, 0);
      this.ctx.beginPath();
      this.ctx.moveTo(screen.x, 0);
      this.ctx.lineTo(screen.x, this.canvas.height);
      this.ctx.stroke();
    }

    for (let y = startY; y < endY; y += gridSize) {
      const screen = this.worldToScreen(0, y);
      this.ctx.beginPath();
      this.ctx.moveTo(0, screen.y);
      this.ctx.lineTo(this.canvas.width, screen.y);
      this.ctx.stroke();
    }
  }

  private drawBases(): void {
    const blueBase = this.worldToScreen(200, MAP_SIZE / 2);
    const redBase = this.worldToScreen(MAP_SIZE - 200, MAP_SIZE / 2);
    const baseSize = 50 * this.camera.zoom;

    const blueGradient = this.ctx.createRadialGradient(
      blueBase.x, blueBase.y, 0,
      blueBase.x, blueBase.y, baseSize * 2
    );
    blueGradient.addColorStop(0, 'rgba(74, 125, 255, 0.4)');
    blueGradient.addColorStop(1, 'rgba(74, 125, 255, 0)');
    this.ctx.fillStyle = blueGradient;
    this.ctx.beginPath();
    this.ctx.arc(blueBase.x, blueBase.y, baseSize * 2, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.shadowColor = '#4a7dff';
    this.ctx.shadowBlur = 30;
    this.ctx.fillStyle = '#4a7dff';
    this.ctx.strokeStyle = '#60a5fa';
    this.ctx.lineWidth = 3;
    this.drawHexagon(this.ctx, blueBase.x, blueBase.y, baseSize);
    this.ctx.fill();
    this.ctx.stroke();

    const redGradient = this.ctx.createRadialGradient(
      redBase.x, redBase.y, 0,
      redBase.x, redBase.y, baseSize * 2
    );
    redGradient.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
    redGradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
    this.ctx.fillStyle = redGradient;
    this.ctx.beginPath();
    this.ctx.arc(redBase.x, redBase.y, baseSize * 2, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.shadowColor = '#ef4444';
    this.ctx.shadowBlur = 30;
    this.ctx.fillStyle = '#ef4444';
    this.ctx.strokeStyle = '#f87171';
    this.ctx.lineWidth = 3;
    this.drawHexagon(this.ctx, redBase.x, redBase.y, baseSize);
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;
  }

  private drawFPS(): void {
    this.ctx.font = 'bold 14px monospace';
    this.ctx.textAlign = 'left';

    if (this.fps < 30) {
      const blink = Math.sin(performance.now() / 100) > 0;
      this.ctx.fillStyle = blink ? '#ef4444' : '#ffffff';
    } else {
      this.ctx.fillStyle = '#ffffff';
    }

    this.ctx.fillText(`FPS: ${this.fps.toFixed(0)}`, 10, 25);
  }

  private updateFPS(): void {
    const now = performance.now();
    const delta = now - this.lastFrameTime;
    this.lastFrameTime = now;
    const currentFps = 1000 / delta;
    this.fpsHistory.push(currentFps);
    if (this.fpsHistory.length > 30) this.fpsHistory.shift();
    this.fps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
  }

  public render(frame: GameStateFrame): void {
    this.currentFrame = frame;
    this.updateFPS();

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(this.offscreenCanvas, 0, 0);

    this.drawGrid();
    this.drawBases();

    for (const rp of frame.resourcePoints) {
      this.drawResourcePoint(rp);
    }

    for (const ship of frame.ships) {
      this.drawShip(ship);
    }

    for (const proj of frame.projectiles) {
      this.drawProjectile(proj);
    }

    for (const particle of frame.particles) {
      this.drawParticle(particle);
    }

    for (const ft of frame.floatingTexts) {
      this.drawFloatingText(ft);
    }

    this.drawFPS();
  }

  private onMouseDown(e: MouseEvent): void {
    this.isDragging = true;
    this.lastMousePos = { x: e.clientX, y: e.clientY };
  }

  private onMouseMove(e: MouseEvent): void {
    if (!this.isDragging) return;

    const dx = e.clientX - this.lastMousePos.x;
    const dy = e.clientY - this.lastMousePos.y;

    this.camera.x -= dx / this.camera.zoom;
    this.camera.y -= dy / this.camera.zoom;

    this.camera.x = Math.max(0, Math.min(MAP_SIZE, this.camera.x));
    this.camera.y = Math.max(0, Math.min(MAP_SIZE, this.camera.y));

    this.lastMousePos = { x: e.clientX, y: e.clientY };
    this.preRenderBackground();
  }

  private onMouseUp(): void {
    this.isDragging = false;
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    this.camera.zoom = Math.max(0.05, Math.min(0.5, this.camera.zoom * zoomFactor));
    this.preRenderBackground();
  }
}
