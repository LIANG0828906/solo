import { PlayerModule, PowerupState, PowerupType } from './player';
import { ObstacleModule, WorldItem } from './obstacle';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

const COLORS = {
  bg: '#0a0a0f',
  purple: '#bf00ff',
  cyan: '#00ffff',
  pink: '#ff6ec7',
  magenta: '#ff00ff',
  red: '#ff0066',
  yellow: '#ffff00',
  green: '#00ff88',
  white: '#ffffff',
  lane: 'rgba(0, 255, 255, 0.15)',
  laneLine: 'rgba(191, 0, 255, 0.4)',
};

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private player: PlayerModule;
  private obstacles: ObstacleModule;
  private width: number = 0;
  private height: number = 0;
  private dpr: number = 1;
  private laneWidth: number = 120;
  private particles: Particle[] = [];
  private bgScroll: number = 0;
  private starLayers: Array<Array<{ x: number; y: number; size: number; speed: number; color: string }>> = [];
  private buildingPositions: Array<{ side: number; height: number; width: number; hue: number }> = [];
  private explosionActive: boolean = false;
  private explosionTime: number = 0;
  private screenShake: number = 0;

  constructor(
    canvas: HTMLCanvasElement,
    player: PlayerModule,
    obstacles: ObstacleModule,
    laneWidth: number
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.player = player;
    this.obstacles = obstacles;
    this.laneWidth = laneWidth;
    this.resize();
    this.initBackground();
    window.addEventListener('resize', () => this.resize());
  }

  resize(): void {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.canvas.getBoundingClientRect();
    this.width = Math.min(window.innerWidth, 1280);
    this.height = Math.min(window.innerHeight, 800);
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';
    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  private initBackground(): void {
    this.starLayers = [];
    for (let layer = 0; layer < 3; layer++) {
      const stars: Array<{ x: number; y: number; size: number; speed: number; color: string }> = [];
      const count = 40 + layer * 20;
      for (let i = 0; i < count; i++) {
        const colors = [COLORS.purple, COLORS.cyan, COLORS.pink, COLORS.white];
        stars.push({
          x: Math.random() * 2000,
          y: Math.random() * 600,
          size: Math.random() * 2 + 0.5,
          speed: 0.5 + layer * 0.8 + Math.random() * 0.5,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
      this.starLayers.push(stars);
    }

    this.buildingPositions = [];
    for (let i = 0; i < 40; i++) {
      this.buildingPositions.push({
        side: Math.random() < 0.5 ? -1 : 1,
        height: 100 + Math.random() * 350,
        width: 40 + Math.random() * 80,
        hue: Math.random(),
      });
    }
  }

  triggerExplosion(x: number, y: number): void {
    this.explosionActive = true;
    this.explosionTime = 0;
    this.screenShake = 20;
    const colors = [COLORS.magenta, COLORS.cyan, COLORS.pink, COLORS.white, COLORS.purple];
    for (let i = 0; i < 80; i++) {
      const angle = (Math.PI * 2 * i) / 80 + Math.random() * 0.3;
      const speed = 200 + Math.random() * 400;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 100,
        life: 0.8 + Math.random() * 0.6,
        maxLife: 1.4,
        size: 3 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    for (let i = 0; i < 30; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 40,
        y: y + (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * 600,
        vy: (Math.random() - 0.5) * 600,
        life: 0.4 + Math.random() * 0.4,
        maxLife: 0.8,
        size: 8 + Math.random() * 12,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  }

  spawnTrailParticles(x: number, y: number): void {
    if (Math.random() > 0.6) return;
    const colors = [COLORS.cyan, COLORS.magenta, COLORS.pink];
    this.particles.push({
      x: x + (Math.random() - 0.5) * 20,
      y: y + Math.random() * 20,
      vx: (Math.random() - 0.5) * 50,
      vy: 50 + Math.random() * 50,
      life: 0.2 + Math.random() * 0.2,
      maxLife: 0.4,
      size: 2 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  }

  private updateParticles(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 600 * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
    if (this.explosionActive) {
      this.explosionTime += dt;
      if (this.explosionTime > 1.5) this.explosionActive = false;
    }
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 40);
    }
  }

  private project(z: number, laneX: number = 0, groundY: number = 0): { sx: number; sy: number; scale: number } {
    const horizonY = this.height * 0.4;
    const vanishX = this.width / 2;
    const maxZ = 2000;
    const t = Math.max(0, Math.min(1, 1 - z / maxZ));
    const scale = t;
    const depthScale = Math.pow(t, 1.5);
    const sx = vanishX + laneX * depthScale * 0.9;
    const sy = horizonY + (this.height - horizonY - groundY * depthScale) * depthScale;
    return { sx, sy, scale: Math.max(0.05, scale) };
  }

  private drawBackground(dt: number): void {
    const { ctx, width, height } = this;
    const speed = this.player.getEffectiveSpeed();
    this.bgScroll = (this.bgScroll + speed * dt * 0.3) % 10000;

    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#0d0520');
    grad.addColorStop(0.3, '#1a0a3a');
    grad.addColorStop(0.5, '#0a1a2e');
    grad.addColorStop(0.75, '#0a0a1a');
    grad.addColorStop(1, '#050510');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    this.drawStars(dt);
    this.drawBuildings(dt);
    this.drawHorizonGlow();
    this.drawRoad(dt);
  }

  private drawStars(dt: number): void {
    const { ctx, width, height } = this;
    const speed = this.player.getEffectiveSpeed() * 0.0005;
    for (let li = 0; li < this.starLayers.length; li++) {
      const stars = this.starLayers[li];
      const layerSpeed = speed * (1 + li * 0.5);
      for (const s of stars) {
        s.x -= s.speed * layerSpeed * dt * 60;
        if (s.x < 0) s.x += width * 2;
        if (s.x > width * 2) s.x -= width * 2;
        const displayX = s.x % (width * 2) - width * 0.5;
        const alpha = 0.3 + li * 0.2 + Math.sin(performance.now() * 0.003 + s.x) * 0.2;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = s.color;
        ctx.shadowBlur = s.size * 4;
        ctx.shadowColor = s.color;
        ctx.fillRect(displayX, s.y * 0.4, s.size, s.size);
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  private drawBuildings(dt: number): void {
    const { ctx, width, height } = this;
    const horizonY = height * 0.4;
    const scroll = this.bgScroll;

    for (let layer = 0; layer < 3; layer++) {
      const layerAlpha = 0.3 + layer * 0.25;
      const layerOffset = scroll * (0.1 + layer * 0.15);
      const buildingCount = 12;

      for (let i = 0; i < buildingCount; i++) {
        const idx = (i + layer * 5) % this.buildingPositions.length;
        const b = this.buildingPositions[idx];
        const bHeight = b.height * (0.4 + layer * 0.2);
        const bWidth = b.width * (0.6 + layer * 0.2);
        const spacing = width / (buildingCount * 0.5);
        let bx = ((i * spacing + layer * 100 - layerOffset) % (width + 400)) - 200;
        bx += b.side * 50 * layer;

        const baseHue = b.hue;
        const hue1 = (baseHue * 60 + 280) % 360;
        const hue2 = (baseHue * 60 + 180) % 360;

        const grad = ctx.createLinearGradient(bx, horizonY, bx, horizonY - bHeight);
        grad.addColorStop(0, `hsla(${hue1}, 80%, 20%, ${layerAlpha})`);
        grad.addColorStop(0.5, `hsla(${hue2}, 70%, 15%, ${layerAlpha * 0.8})`);
        grad.addColorStop(1, `hsla(${hue1}, 90%, 8%, ${layerAlpha * 0.5})`);

        ctx.fillStyle = grad;
        ctx.fillRect(bx, horizonY - bHeight, bWidth, bHeight);

        ctx.strokeStyle = `hsla(${hue1}, 100%, 60%, ${layerAlpha * 0.6})`;
        ctx.lineWidth = 1;
        ctx.shadowBlur = 6 * layer;
        ctx.shadowColor = `hsla(${hue1}, 100%, 60%, 0.5)`;
        ctx.strokeRect(bx, horizonY - bHeight, bWidth, bHeight);
        ctx.shadowBlur = 0;

        const windowRows = Math.floor(bHeight / 25);
        const windowCols = Math.floor(bWidth / 18);
        for (let wy = 1; wy < windowRows; wy++) {
          for (let wx = 0; wx < windowCols; wx++) {
            if (Math.sin(idx * 7 + wy * 3 + wx * 11 + layer) > 0.2) {
              const whue = (baseHue * 360 + wy * 20 + wx * 40) % 360;
              ctx.fillStyle = `hsla(${whue}, 100%, 70%, ${layerAlpha * 0.7})`;
              ctx.shadowBlur = 3;
              ctx.shadowColor = `hsla(${whue}, 100%, 70%, 0.8)`;
              ctx.fillRect(bx + 6 + wx * 18, horizonY - bHeight + 10 + wy * 25, 8, 12);
            }
          }
        }
        ctx.shadowBlur = 0;
      }
    }
  }

  private drawHorizonGlow(): void {
    const { ctx, width, height } = this;
    const horizonY = height * 0.4;
    const g1 = ctx.createLinearGradient(0, horizonY - 100, 0, horizonY + 50);
    g1.addColorStop(0, 'rgba(255, 0, 255, 0)');
    g1.addColorStop(0.4, 'rgba(191, 0, 255, 0.25)');
    g1.addColorStop(0.6, 'rgba(0, 255, 255, 0.2)');
    g1.addColorStop(1, 'rgba(255, 110, 199, 0)');
    ctx.fillStyle = g1;
    ctx.fillRect(0, horizonY - 100, width, 150);

    const g2 = ctx.createRadialGradient(width / 2, horizonY, 0, width / 2, horizonY, width * 0.6);
    g2.addColorStop(0, 'rgba(0, 255, 255, 0.15)');
    g2.addColorStop(1, 'rgba(0, 255, 255, 0)');
    ctx.fillStyle = g2;
    ctx.fillRect(0, horizonY - 100, width, 200);
  }

  private drawRoad(dt: number): void {
    const { ctx, width, height } = this;
    const horizonY = height * 0.4;
    const totalRoadWidth = this.laneWidth * 3.2;

    const tl = this.project(2000, -totalRoadWidth);
    const tr = this.project(2000, totalRoadWidth);
    const bl = this.project(0, -totalRoadWidth);
    const br = this.project(0, totalRoadWidth);

    const roadGrad = ctx.createLinearGradient(0, horizonY, 0, height);
    roadGrad.addColorStop(0, '#0a0a1a');
    roadGrad.addColorStop(0.3, '#0d1025');
    roadGrad.addColorStop(1, '#141428');
    ctx.fillStyle = roadGrad;
    ctx.beginPath();
    ctx.moveTo(tl.sx, tl.sy);
    ctx.lineTo(tr.sx, tr.sy);
    ctx.lineTo(br.sx, br.sy);
    ctx.lineTo(bl.sx, bl.sy);
    ctx.closePath();
    ctx.fill();

    const edgeGrad = ctx.createLinearGradient(0, horizonY, 0, height);
    edgeGrad.addColorStop(0,