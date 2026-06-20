import { SkyRenderer } from './SkyRenderer';
import { RainSystem } from './RainSystem';
import { Rosary } from './Rosary';

class Main {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private skyRenderer: SkyRenderer;
  private rainSystem: RainSystem;
  private rosary: Rosary;
  private lastTime: number = 0;
  private ritualTriggered: boolean = false;
  private showBlessing: boolean = false;
  private blessingAlpha: number = 0;
  private blessingScale: number = 0;
  private isSmallScreen: boolean = false;

  constructor() {
    this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;

    this.skyRenderer = new SkyRenderer();
    this.rainSystem = new RainSystem();
    this.rosary = new Rosary();

    this.resize();
    this.bindEvents();
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  private resize(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    this.isSmallScreen = window.innerWidth < 768;

    this.skyRenderer.resize(this.canvas.width, this.canvas.height);
    this.rainSystem.resize(this.canvas.width, this.canvas.height);
    this.rosary.resize(this.canvas.width, this.canvas.height);

    if (this.isSmallScreen) {
      this.rainSystem.setMaxDrops(300);
    } else {
      this.rainSystem.setMaxDrops(500);
    }
  }

  private bindEvents(): void {
    window.addEventListener('resize', () => this.resize());

    this.canvas.addEventListener('mousedown', (e) => {
      this.rosary.handleMouseDown(e.clientX, e.clientY);
    });

    this.canvas.addEventListener('mousemove', (e) => {
      this.rosary.handleMouseMove(e.clientX, e.clientY);
    });

    this.canvas.addEventListener('mouseup', (e) => {
      this.rosary.handleMouseUp(e.clientX, e.clientY);
    });

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.touches[0];
      this.rosary.handleMouseDown(t.clientX, t.clientY);
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const t = e.touches[0];
      this.rosary.handleMouseMove(t.clientX, t.clientY);
    }, { passive: false });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      this.rosary.handleMouseUp(t.clientX, t.clientY);
    }, { passive: false });

    this.canvas.addEventListener('click', (e) => {
      const mx = e.clientX;
      const my = e.clientY;

      const btnW = 120;
      const btnH = 40;
      const btnX = this.canvas.width - btnW - 20;
      const btnY = this.canvas.height - btnH - 20;

      if (mx >= btnX && mx <= btnX + btnW && my >= btnY && my <= btnY + btnH) {
        this.resetAll();
      }
    });
  }

  private resetAll(): void {
    this.rosary.reset();
    this.rainSystem.reset();
    this.skyRenderer.reset();
    this.ritualTriggered = false;
    this.showBlessing = false;
    this.blessingAlpha = 0;
    this.blessingScale = 0;
  }

  private loop(timestamp: number): void {
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
    this.lastTime = timestamp;

    this.update(dt);
    this.draw();

    requestAnimationFrame((t) => this.loop(t));
  }

  private update(dt: number): void {
    this.skyRenderer.update();
    this.rosary.update(dt);
    this.rainSystem.update(dt);

    if (!this.ritualTriggered && this.rosary.isComplete()) {
      this.ritualTriggered = true;
      this.skyRenderer.setRaining(true);
      this.rainSystem.startRain();
      this.showBlessing = true;
      this.blessingAlpha = 0;
      this.blessingScale = 0;
    }

    if (this.showBlessing && this.blessingAlpha < 1) {
      this.blessingAlpha = Math.min(this.blessingAlpha + dt / 2, 1);
      this.blessingScale = Math.min(this.blessingScale + dt * 1.2, 1);
    }
  }

  private draw(): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    this.skyRenderer.draw(ctx);
    this.rainSystem.draw(ctx);
    this.rosary.draw(ctx);

    if (this.showBlessing) {
      this.drawBlessing(ctx, w, h);
    }

    this.drawResetButton(ctx, w, h);
  }

  private drawBlessing(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const fontSize = this.isSmallScreen ? 32 : 48;
    ctx.save();
    ctx.globalAlpha = this.blessingAlpha;
    ctx.translate(w / 2, h * 0.15);
    ctx.scale(this.blessingScale, this.blessingScale);
    ctx.font = `${fontSize}px STKaiti, KaiTi, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFD700';
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 20;
    ctx.fillText('天降甘霖', 0, 0);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  private drawResetButton(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const btnW = 120;
    const btnH = 40;
    const btnX = w - btnW - 20;
    const btnY = h - btnH - 20;
    const radius = 12;

    ctx.save();

    const gradient = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnH);
    gradient.addColorStop(0, '#8B4513');
    gradient.addColorStop(1, '#A0522D');
    ctx.fillStyle = gradient;

    ctx.beginPath();
    ctx.moveTo(btnX + radius, btnY);
    ctx.lineTo(btnX + btnW - radius, btnY);
    ctx.quadraticCurveTo(btnX + btnW, btnY, btnX + btnW, btnY + radius);
    ctx.lineTo(btnX + btnW, btnY + btnH - radius);
    ctx.quadraticCurveTo(btnX + btnW, btnY + btnH, btnX + btnW - radius, btnY + btnH);
    ctx.lineTo(btnX + radius, btnY + btnH);
    ctx.quadraticCurveTo(btnX, btnY + btnH, btnX, btnY + btnH - radius);
    ctx.lineTo(btnX, btnY + radius);
    ctx.quadraticCurveTo(btnX, btnY, btnX + radius, btnY);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#F5DEB3';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('重置', btnX + btnW / 2, btnY + btnH / 2);

    ctx.restore();
  }
}

new Main();
