import { Container, Graphics } from 'pixi.js';
import { HexCell, TerrainType, axialToPixel } from '../game/UnitData';

const HEX_SIZE = 40;
const SQRT3 = Math.sqrt(3);

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: number;
  alpha: number;
  active: boolean;
  angle?: number;
  radius?: number;
  speed?: number;
  type?: string;
  cellKey?: string;
}

const NEBULA_COLORS = [0x8b00ff, 0x9d4edd, 0xba55d3, 0x6a0dad, 0x7b2cbf, 0xc77dff];
const ASTEROID_COLORS = [0x4a3728, 0x5c4033, 0x3d2914, 0x6b4423];
const DEBRIS_COLORS = [0x8b4513, 0x654321, 0x5c4033, 0x8b6914];
const HOLO_COLORS = [0x00d4ff, 0x0088ff, 0x00ffff, 0x00bfff];

export class HexGridRenderer {
  private container: Container;
  private gridGraphics: Graphics;
  private terrainGraphics: Graphics;
  private highlightGraphics: Graphics;
  private particleGraphics: Graphics;

  private particlePool: Particle[] = [];
  private activeParticles: Particle[] = [];

  private nebulaParticles: Map<string, Particle[]> = new Map();
  private asteroidDebris: Map<string, Particle[]> = new Map();
  private stationParticles: Map<string, { streams: Particle[]; rings: number[] }> = new Map();

  private moveHighlightCells: HexCell[] = [];
  private attackHighlightCells: HexCell[] = [];

  constructor(parent: Container) {
    this.container = new Container();
    this.gridGraphics = new Graphics();
    this.terrainGraphics = new Graphics();
    this.highlightGraphics = new Graphics();
    this.particleGraphics = new Graphics();
    this.container.addChild(this.gridGraphics);
    this.container.addChild(this.terrainGraphics);
    this.container.addChild(this.particleGraphics);
    this.container.addChild(this.highlightGraphics);
    parent.addChild(this.container);
  }

  drawGrid(cells: HexCell[]): void {
    this.gridGraphics.clear();
    for (const cell of cells) {
      const { x, y } = axialToPixel(cell.q, cell.r, HEX_SIZE);
      this.drawHexOutline(this.gridGraphics, x, y, 0x1a2444, 0.4);
    }
  }

  drawTerrain(cells: HexCell[]): void {
    this.terrainGraphics.clear();
    this.particleGraphics.clear();
    this.clearAllTerrainParticles();
    for (const cell of cells) {
      const { x, y } = axialToPixel(cell.q, cell.r, HEX_SIZE);
      const key = `${cell.q},${cell.r}`;
      switch (cell.terrain) {
        case 'nebula':
          this.initNebulaParticles(key, x, y);
          break;
        case 'asteroid':
          this.initAsteroidParticles(key, x, y);
          break;
        case 'station':
          this.initStationParticles(key, x, y);
          break;
      }
    }
  }

  drawHighlights(moveCells: HexCell[], attackCells: HexCell[]): void {
    this.moveHighlightCells = moveCells.slice();
    this.attackHighlightCells = attackCells.slice();
    this.renderHighlights(0);
  }

  private renderHighlights(tick: number): void {
    this.highlightGraphics.clear();
    for (const cell of this.moveHighlightCells) {
      const { x, y } = axialToPixel(cell.q, cell.r, HEX_SIZE);
      this.drawMoveHighlight(x, y, tick);
    }
    for (const cell of this.attackHighlightCells) {
      const { x, y } = axialToPixel(cell.q, cell.r, HEX_SIZE);
      this.drawAttackHighlight(x, y, tick);
    }
  }

  drawAnimatedTerrain(cells: HexCell[], tick: number): void {
    this.terrainGraphics.clear();
    this.particleGraphics.clear();

    for (const cell of cells) {
      const { x, y } = axialToPixel(cell.q, cell.r, HEX_SIZE);
      const key = `${cell.q},${cell.r}`;
      switch (cell.terrain) {
        case 'nebula':
          if (!this.nebulaParticles.has(key)) {
            this.initNebulaParticles(key, x, y);
          }
          this.drawAnimatedNebula(x, y, tick, key);
          break;
        case 'asteroid':
          if (!this.asteroidDebris.has(key)) {
            this.initAsteroidParticles(key, x, y);
          }
          this.drawAnimatedAsteroid(x, y, tick, key);
          break;
        case 'station':
          if (!this.stationParticles.has(key)) {
            this.initStationParticles(key, x, y);
          }
          this.drawAnimatedStation(x, y, tick, key);
          break;
      }
    }

    this.updateAndDrawTransientParticles(tick);
    this.renderHighlights(tick);
  }

  clearHighlights(): void {
    this.moveHighlightCells = [];
    this.attackHighlightCells = [];
    this.highlightGraphics.clear();
  }

  getContainer(): Container {
    return this.container;
  }

  destroy(): void {
    this.particlePool = [];
    this.activeParticles = [];
    this.nebulaParticles.clear();
    this.asteroidDebris.clear();
    this.stationParticles.clear();
    this.container.destroy({ children: true });
  }

  private acquire(): Particle {
    if (this.particlePool.length > 0) {
      const p = this.particlePool.pop()!;
      p.active = true;
      return p;
    }
    return {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 0,
      size: 0,
      color: 0xffffff,
      alpha: 0,
      active: true,
    };
  }

  private release(p: Particle): void {
    p.active = false;
    p.cellKey = undefined;
    p.type = undefined;
    this.particlePool.push(p);
  }

  private clearAllTerrainParticles(): void {
    this.nebulaParticles.forEach((particles) => {
      particles.forEach((p) => this.release(p));
    });
    this.nebulaParticles.clear();

    this.asteroidDebris.forEach((particles) => {
      particles.forEach((p) => this.release(p));
    });
    this.asteroidDebris.clear();

    this.stationParticles.forEach((data) => {
      data.streams.forEach((p) => this.release(p));
    });
    this.stationParticles.clear();
  }

  private initNebulaParticles(key: string, cx: number, cy: number): void {
    const particles: Particle[] = [];
    const count = 25;
    for (let i = 0; i < count; i++) {
      const p = this.acquire();
      const t = i / count;
      const layer = Math.floor(t * 3);
      const angleOffset = layer * 0.7 + Math.random() * 0.3;
      p.angle = (Math.PI * 2 * i) / count + angleOffset;
      p.radius = HEX_SIZE * (0.15 + layer * 0.12 + Math.random() * 0.05);
      p.speed = 0.015 + (2 - layer) * 0.008 + Math.random() * 0.005;
      p.size = 2 + layer * 0.8 + Math.random() * 1.5;
      p.color = NEBULA_COLORS[Math.floor(Math.random() * NEBULA_COLORS.length)];
      p.x = cx + Math.cos(p.angle) * p.radius;
      p.y = cy + Math.sin(p.angle) * p.radius;
      p.alpha = 0.4 + Math.random() * 0.4;
      p.maxLife = -1;
      p.life = -1;
      p.type = 'nebula';
      p.cellKey = key;
      particles.push(p);
    }
    this.nebulaParticles.set(key, particles);
  }

  private initAsteroidParticles(key: string, cx: number, cy: number): void {
    const particles: Particle[] = [];
    const count = 10;
    for (let i = 0; i < count; i++) {
      const p = this.acquire();
      const angle = Math.random() * Math.PI * 2;
      const dist = HEX_SIZE * (0.15 + Math.random() * 0.25);
      p.x = cx + Math.cos(angle) * dist;
      p.y = cy + Math.sin(angle) * dist;
      p.vx = (Math.random() - 0.5) * 0.15;
      p.vy = (Math.random() - 0.5) * 0.15;
      p.size = 1.5 + Math.random() * 3;
      p.color = DEBRIS_COLORS[Math.floor(Math.random() * DEBRIS_COLORS.length)];
      p.alpha = 0.6 + Math.random() * 0.3;
      p.maxLife = -1;
      p.life = -1;
      p.type = 'debris';
      p.cellKey = key;
      particles.push(p);
    }
    this.asteroidDebris.set(key, particles);
  }

  private initStationParticles(key: string, cx: number, cy: number): void {
    const streams: Particle[] = [];
    const streamCount = 8;
    for (let i = 0; i < streamCount; i++) {
      const p = this.acquire();
      const side = i % 2 === 0 ? -1 : 1;
      const offset = (Math.floor(i / 2) / Math.floor(streamCount / 2)) * HEX_SIZE * 0.4;
      p.x = cx + side * (HEX_SIZE * 0.2 + offset * 0.5);
      p.y = cy - HEX_SIZE * 0.3 - Math.random() * HEX_SIZE * 0.4;
      p.vy = 0.4 + Math.random() * 0.3;
      p.vx = 0;
      p.size = 1 + Math.random() * 1.5;
      p.color = HOLO_COLORS[Math.floor(Math.random() * HOLO_COLORS.length)];
      p.alpha = 0.3 + Math.random() * 0.5;
      p.maxLife = -1;
      p.life = -1;
      p.type = 'datastream';
      p.cellKey = key;
      streams.push(p);
    }
    this.stationParticles.set(key, {
      streams,
      rings: [0, 0, 0],
    });
  }

  private updateAndDrawTransientParticles(tick: number): void {
    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const p = this.activeParticles[i];
      if (!p.active) continue;

      p.x += p.vx;
      p.y += p.vy;

      if (p.maxLife > 0) {
        p.life--;
        p.alpha = Math.max(0, p.life / p.maxLife);
        if (p.life <= 0) {
          this.release(p);
          this.activeParticles.splice(i, 1);
          continue;
        }
      }

      this.particleGraphics.beginFill(p.color, p.alpha);
      this.particleGraphics.drawCircle(p.x, p.y, p.size);
      this.particleGraphics.endFill();
    }
  }

  private drawHexOutline(g: Graphics, cx: number, cy: number, color: number, alpha: number): void {
    g.lineStyle(1, color, alpha);
    this.drawHexPath(g, cx, cy);
    g.lineStyle(0);
  }

  private drawHexPath(g: Graphics, cx: number, cy: number): void {
    g.moveTo(cx + (HEX_SIZE * SQRT3) / 2, cy - HEX_SIZE / 2);
    for (let i = 1; i <= 6; i++) {
      const angle = (Math.PI / 180) * (60 * i - 30);
      g.lineTo(cx + HEX_SIZE * Math.cos(angle), cy + HEX_SIZE * Math.sin(angle));
    }
    g.closePath();
  }

  private drawMoveHighlight(cx: number, cy: number, tick: number): void {
    const pulse = Math.sin(tick * 0.05) * 0.05 + 0.15;

    this.highlightGraphics.beginFill(0x00d4ff, pulse);
    this.drawHexPath(this.highlightGraphics, cx, cy);
    this.highlightGraphics.endFill();

    const dashLen = 6;
    const gapLen = 4;
    const totalLen = dashLen + gapLen;
    const offset = (tick * 0.3) % totalLen;

    this.highlightGraphics.lineStyle(1.5, 0x00d4ff, 0.7);

    const points: { x: number; y: number }[] = [];
    for (let i = 0; i <= 6; i++) {
      const angle = (Math.PI / 180) * (60 * i - 30);
      points.push({
        x: cx + HEX_SIZE * Math.cos(angle),
        y: cy + HEX_SIZE * Math.sin(angle),
      });
    }

    let distanceTraveled = -offset;
    for (let i = 0; i < 6; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const segLen = Math.sqrt(dx * dx + dy * dy);
      let segProgress = distanceTraveled;

      while (segProgress < segLen) {
        if (segProgress + dashLen >= 0 && segProgress < segLen) {
          const startT = Math.max(0, segProgress) / segLen;
          const endT = Math.min(segLen, segProgress + dashLen) / segLen;
          const sx = p1.x + dx * startT;
          const sy = p1.y + dy * startT;
          const ex = p1.x + dx * endT;
          const ey = p1.y + dy * endT;
          this.highlightGraphics.moveTo(sx, sy);
          this.highlightGraphics.lineTo(ex, ey);
        }
        segProgress += totalLen;
      }
      distanceTraveled = segProgress - segLen;
    }
    this.highlightGraphics.lineStyle(0);
  }

  private drawAttackHighlight(cx: number, cy: number, tick: number): void {
    const pulse = Math.sin(tick * 0.08) * 0.5 + 0.5;
    const radius = HEX_SIZE * 0.55 + pulse * 4;

    const gradientAlpha = 0.15 + pulse * 0.1;
    this.highlightGraphics.beginFill(0xff4d2a, gradientAlpha);
    this.highlightGraphics.drawCircle(cx, cy, radius);
    this.highlightGraphics.endFill();

    this.highlightGraphics.lineStyle(2.5, 0xff4d2a, 0.5 + pulse * 0.3);
    this.highlightGraphics.drawCircle(cx, cy, radius);
    this.highlightGraphics.lineStyle(0);

    this.highlightGraphics.lineStyle(1, 0xff6b35, 0.3 + pulse * 0.2);
    this.highlightGraphics.drawCircle(cx, cy, radius - 5);
    this.highlightGraphics.lineStyle(0);

    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8 + tick * 0.02;
      const innerR = radius + 2;
      const outerR = radius + 6 + pulse * 3;
      const sx = cx + Math.cos(angle) * innerR;
      const sy = cy + Math.sin(angle) * innerR;
      const ex = cx + Math.cos(angle) * outerR;
      const ey = cy + Math.sin(angle) * outerR;
      this.highlightGraphics.lineStyle(1.5, 0xff4d2a, 0.4 + pulse * 0.3);
      this.highlightGraphics.moveTo(sx, sy);
      this.highlightGraphics.lineTo(ex, ey);
      this.highlightGraphics.lineStyle(0);
    }
  }

  private drawAnimatedNebula(cx: number, cy: number, tick: number, key: string): void {
    const particles = this.nebulaParticles.get(key);
    if (!particles) return;

    const phase = tick * 0.02;
    const pulse = Math.sin(phase * 1.5) * 0.15 + 0.85;

    for (let layer = 2; layer >= 0; layer--) {
      const layerRadius = HEX_SIZE * (0.2 + layer * 0.15) * pulse;
      const layerAlpha = 0.08 + layer * 0.04;
      this.terrainGraphics.beginFill(NEBULA_COLORS[layer], layerAlpha * pulse);
      this.terrainGraphics.drawCircle(cx, cy, layerRadius);
      this.terrainGraphics.endFill();
    }

    const corePulse = Math.sin(phase * 2) * 0.2 + 0.8;
    this.terrainGraphics.beginFill(0xba55d3, 0.25 * corePulse);
    this.terrainGraphics.drawCircle(cx, cy, HEX_SIZE * 0.12 * corePulse);
    this.terrainGraphics.endFill();

    this.terrainGraphics.beginFill(0xe0aaff, 0.4 * corePulse);
    this.terrainGraphics.drawCircle(cx, cy, HEX_SIZE * 0.05 * corePulse);
    this.terrainGraphics.endFill();

    for (const p of particles) {
      p.angle! += p.speed!;
      const wobble = Math.sin(phase * 2 + p.radius! * 0.1) * 2;
      const r = p.radius! + wobble;
      p.x = cx + Math.cos(p.angle!) * r;
      p.y = cy + Math.sin(p.angle!) * r;

      const distFromCenter = r;
      const maxR = HEX_SIZE * 0.5;
      const fadeFactor = 1 - Math.pow(distFromCenter / maxR, 2) * 0.5;
      const alpha = p.alpha * pulse * fadeFactor;

      this.particleGraphics.beginFill(p.color, alpha);
      this.particleGraphics.drawCircle(p.x, p.y, p.size * pulse);
      this.particleGraphics.endFill();

      this.particleGraphics.beginFill(p.color, alpha * 0.3);
      this.particleGraphics.drawCircle(p.x, p.y, p.size * 2 * pulse);
      this.particleGraphics.endFill();
    }

    for (let arm = 0; arm < 3; arm++) {
      const armAngle = phase * 0.5 + (Math.PI * 2 * arm) / 3;
      this.terrainGraphics.lineStyle(2, NEBULA_COLORS[arm % NEBULA_COLORS.length], 0.15 * pulse);
      this.terrainGraphics.moveTo(cx, cy);
      for (let t = 0.1; t <= 1; t += 0.05) {
        const spiralAngle = armAngle + t * Math.PI * 1.5;
        const spiralR = HEX_SIZE * 0.45 * t;
        const px = cx + Math.cos(spiralAngle) * spiralR;
        const py = cy + Math.sin(spiralAngle) * spiralR;
        this.terrainGraphics.lineTo(px, py);
      }
      this.terrainGraphics.lineStyle(0);
    }
  }

  private drawAnimatedAsteroid(cx: number, cy: number, tick: number, key: string): void {
    const debris = this.asteroidDebris.get(key);
    if (!debris) return;

    const flashCycle = tick % 60;
    const flashIntensity = flashCycle < 8 ? (1 - flashCycle / 8) * 0.6 : 0;
    const secondaryFlash = flashCycle > 45 && flashCycle < 52 ? (1 - (flashCycle - 45) / 7) * 0.3 : 0;
    const totalFlash = Math.max(flashIntensity, secondaryFlash);

    this.terrainGraphics.beginFill(0x3d2914, 0.35);
    this.terrainGraphics.drawCircle(cx, cy, HEX_SIZE * 0.42);
    this.terrainGraphics.endFill();

    this.terrainGraphics.beginFill(0x5c4033, 0.5);
    this.terrainGraphics.drawCircle(cx - 3, cy - 2, HEX_SIZE * 0.32);
    this.terrainGraphics.endFill();

    this.terrainGraphics.beginFill(0x4a3728, 0.6);
    this.terrainGraphics.drawCircle(cx + 5, cy + 3, HEX_SIZE * 0.22);
    this.terrainGraphics.endFill();

    this.terrainGraphics.beginFill(0x6b4423, 0.4);
    this.terrainGraphics.drawCircle(cx - 8, cy + 5, HEX_SIZE * 0.1);
    this.terrainGraphics.endFill();

    this.terrainGraphics.beginFill(0x2a1a0a, 0.5);
    this.terrainGraphics.drawCircle(cx + 3, cy - 6, HEX_SIZE * 0.08);
    this.terrainGraphics.endFill();
    this.terrainGraphics.beginFill(0x2a1a0a, 0.4);
    this.terrainGraphics.drawCircle(cx - 5, cy - 3, HEX_SIZE * 0.06);
    this.terrainGraphics.endFill();

    const crackGlow = 0.3 + totalFlash * 1.5;
    this.drawCracks(cx, cy, tick, crackGlow);

    if (totalFlash > 0.1) {
      this.terrainGraphics.beginFill(0xff3300, totalFlash * 0.25);
      this.terrainGraphics.drawCircle(cx, cy, HEX_SIZE * 0.48);
      this.terrainGraphics.endFill();

      this.terrainGraphics.beginFill(0xff6600, totalFlash * 0.15);
      this.terrainGraphics.drawCircle(cx, cy, HEX_SIZE * 0.55);
      this.terrainGraphics.endFill();
    }

    for (const p of debris) {
      p.x += p.vx;
      p.y += p.vy;

      const dx = p.x - cx;
      const dy = p.y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = HEX_SIZE * 0.42;

      if (dist > maxDist) {
        const nx = dx / dist;
        const ny = dy / dist;
        p.vx = -p.vx * 0.5 + (Math.random() - 0.5) * 0.1;
        p.vy = -p.vy * 0.5 + (Math.random() - 0.5) * 0.1;
        p.x = cx + nx * maxDist * 0.95;
        p.y = cy + ny * maxDist * 0.95;
      }

      p.vx += (Math.random() - 0.5) * 0.02;
      p.vy += (Math.random() - 0.5) * 0.02;
      p.vx *= 0.99;
      p.vy *= 0.99;

      const shadowAlpha = p.alpha * 0.5;
      this.particleGraphics.beginFill(0x1a0f05, shadowAlpha);
      this.particleGraphics.drawCircle(p.x + 1, p.y + 1, p.size);
      this.particleGraphics.endFill();

      this.particleGraphics.beginFill(p.color, p.alpha);
      this.particleGraphics.drawCircle(p.x, p.y, p.size);
      this.particleGraphics.endFill();

      if (totalFlash > 0.2) {
        this.particleGraphics.beginFill(0xff4400, totalFlash * 0.4);
        this.particleGraphics.drawCircle(p.x, p.y, p.size * 1.5);
        this.particleGraphics.endFill();
      }
    }
  }

  private drawCracks(cx: number, cy: number, tick: number, glow: number): void {
    const crackCount = 7;
    const g = this.terrainGraphics;

    for (let i = 0; i < crackCount; i++) {
      const baseAngle = (Math.PI * 2 * i) / crackCount + 0.3;
      const crackLen = HEX_SIZE * (0.25 + ((i * 13) % 5) * 0.04);

      g.lineStyle(2, 0xff2200, glow * 0.8);
      g.moveTo(cx, cy);

      let x = cx;
      let y = cy;
      const segments = 4;
      for (let s = 1; s <= segments; s++) {
        const t = s / segments;
        const angleOffset = Math.sin(t * Math.PI + i * 1.5) * 0.4;
        const angle = baseAngle + angleOffset;
        const segLen = (crackLen / segments) * (0.7 + Math.random() * 0.6);
        x += Math.cos(angle) * segLen;
        y += Math.sin(angle) * segLen;
        g.lineTo(x, y);
      }
      g.lineStyle(0);

      g.lineStyle(1, 0xff6600, glow * 0.5);
      g.moveTo(cx, cy);
      let x2 = cx;
      let y2 = cy;
      for (let s = 1; s <= segments; s++) {
        const t = s / segments;
        const angleOffset = Math.sin(t * Math.PI + i * 1.5 + 0.5) * 0.35;
        const angle = baseAngle + angleOffset;
        const segLen = (crackLen * 0.6 / segments) * (0.8 + Math.random() * 0.4);
        x2 += Math.cos(angle) * segLen;
        y2 += Math.sin(angle) * segLen;
        g.lineTo(x2, y2);
      }
      g.lineStyle(0);
    }

    g.beginFill(0xff3300, glow * 0.7);
    g.drawCircle(cx, cy, 3 + Math.sin(tick * 0.2) * 1);
    g.endFill();

    g.beginFill(0xffaa00, glow * 0.5);
    g.drawCircle(cx, cy, 1.5);
    g.endFill();
  }

  private drawAnimatedStation(cx: number, cy: number, tick: number, key: string): void {
    const data = this.stationParticles.get(key);
    if (!data) return;

    const phase = tick * 0.025;
    const pulse = Math.sin(phase * 2) * 0.15 + 0.85;

    const outerGlow = HEX_SIZE * 0.5;
    this.terrainGraphics.beginFill(0x0088ff, 0.08 * pulse);
    this.terrainGraphics.drawCircle(cx, cy, outerGlow);
    this.terrainGraphics.endFill();

    this.terrainGraphics.beginFill(0x00d4ff, 0.12 * pulse);
    this.terrainGraphics.drawCircle(cx, cy, HEX_SIZE * 0.38);
    this.terrainGraphics.endFill();

    const coreSize = HEX_SIZE * 0.22;
    const coreAngle = phase * 0.5;
    this.drawDiamondCore(cx, cy, coreSize, coreAngle, pulse);

    const ringColors = [0x00d4ff, 0x0088ff, 0x00ffff];
    const ringSpeeds = [1.0, 0.7, -1.3];
    const ringRadii = [HEX_SIZE * 0.32, HEX_SIZE * 0.42, HEX_SIZE * 0.37];
    const ringTilts = [0, 0.5, 0.8];

    for (let r = 0; r < 3; r++) {
      const ringPhase = phase * ringSpeeds[r];
      const radius = ringRadii[r];
      const tilt = ringTilts[r];
      const color = ringColors[r];

      this.drawEllipticalRing(cx, cy, radius, tilt, ringPhase, color, 0.5 * pulse);
    }

    const scanY = cy + Math.sin(phase * 1.5) * HEX_SIZE * 0.35;
    const scanWidth = HEX_SIZE * 0.45;
    this.terrainGraphics.lineStyle(1.5, 0x00ffff, 0.6 * pulse);
    this.terrainGraphics.moveTo(cx - scanWidth, scanY);
    this.terrainGraphics.lineTo(cx + scanWidth, scanY);
    this.terrainGraphics.lineStyle(0);

    this.terrainGraphics.beginFill(0x00ffff, 0.1 * pulse);
    this.terrainGraphics.drawRect(cx - scanWidth, scanY - 2, scanWidth * 2, 4);
    this.terrainGraphics.endFill();

    for (const p of data.streams) {
      p.y += p.vy;

      if (p.y > cy + HEX_SIZE * 0.35) {
        p.y = cy - HEX_SIZE * 0.35 - Math.random() * HEX_SIZE * 0.2;
        p.alpha = 0.3 + Math.random() * 0.5;
      }

      const fadeTop = Math.max(0, 1 - (cy - p.y) / (HEX_SIZE * 0.3));
      const fadeBottom = Math.max(0, 1 - (p.y - cy) / (HEX_SIZE * 0.3));
      const fade = Math.min(fadeTop, fadeBottom);

      const alpha = p.alpha * fade * pulse;

      if (alpha > 0.05) {
        this.particleGraphics.beginFill(p.color, alpha);
        this.particleGraphics.drawCircle(p.x, p.y, p.size);
        this.particleGraphics.endFill();

        this.particleGraphics.lineStyle(1, p.color, alpha * 0.4);
        this.particleGraphics.moveTo(p.x, p.y - 4);
        this.particleGraphics.lineTo(p.x, p.y + 4);
        this.particleGraphics.lineStyle(0);
      }
    }

    this.terrainGraphics.beginFill(0x00ffff, 0.5 * pulse);
    this.terrainGraphics.drawCircle(cx, cy, 4 * pulse);
    this.terrainGraphics.endFill();

    this.terrainGraphics.beginFill(0xffffff, 0.7 * pulse);
    this.terrainGraphics.drawCircle(cx, cy, 2 * pulse);
    this.terrainGraphics.endFill();
  }

  private drawDiamondCore(cx: number, cy: number, size: number, angle: number, pulse: number): void {
    const g = this.terrainGraphics;

    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const points = [
      { x: 0, y: -size },
      { x: size * 0.7, y: 0 },
      { x: 0, y: size },
      { x: -size * 0.7, y: 0 },
    ];

    const rotated = points.map((p) => ({
      x: cx + p.x * cos - p.y * sin * 0.6,
      y: cy + p.x * sin * 0.4 + p.y * cos,
    }));

    g.beginFill(0x004466, 0.4 * pulse);
    g.moveTo(rotated[0].x, rotated[0].y);
    for (let i = 1; i < rotated.length; i++) {
      g.lineTo(rotated[i].x, rotated[i].y);
    }
    g.closePath();
    g.endFill();

    g.lineStyle(2, 0x00d4ff, 0.8 * pulse);
    g.moveTo(rotated[0].x, rotated[0].y);
    for (let i = 1; i < rotated.length; i++) {
      g.lineTo(rotated[i].x, rotated[i].y);
    }
    g.closePath();
    g.lineStyle(0);

    g.lineStyle(1, 0x00ffff, 0.5 * pulse);
    for (let i = 0; i < rotated.length; i++) {
      g.moveTo(cx, cy);
      g.lineTo(rotated[i].x, rotated[i].y);
    }
    g.lineStyle(0);

    const innerSize = size * 0.5;
    const innerPoints = points.map((p) => ({
      x: cx + p.x * 0.5 * cos - p.y * 0.5 * sin * 0.6,
      y: cy + p.x * 0.5 * sin * 0.4 + p.y * 0.5 * cos,
    }));

    g.lineStyle(1, 0x00ffff, 0.6 * pulse);
    g.moveTo(innerPoints[0].x, innerPoints[0].y);
    for (let i = 1; i < innerPoints.length; i++) {
      g.lineTo(innerPoints[i].x, innerPoints[i].y);
    }
    g.closePath();
    g.lineStyle(0);
  }

  private drawEllipticalRing(
    cx: number,
    cy: number,
    radius: number,
    tilt: number,
    phase: number,
    color: number,
    alpha: number,
  ): void {
    const g = this.terrainGraphics;
    const yScale = 1 - tilt * 0.7;

    g.lineStyle(1.5, color, alpha * 0.7);

    const startAngle = phase;
    const endAngle = phase + Math.PI * 1.4;

    const segments = 24;
    let started = false;
    for (let i = 0; i <= segments; i++) {
      const t = startAngle + ((endAngle - startAngle) * i) / segments;
      const x = cx + Math.cos(t) * radius;
      const y = cy + Math.sin(t) * radius * yScale;

      const angleInRing = t - phase;
      const fadeIn = Math.min(1, angleInRing / 0.5);
      const fadeOut = Math.min(1, (Math.PI * 1.4 - angleInRing) / 0.5);
      const segAlpha = alpha * Math.min(fadeIn, fadeOut);

      if (segAlpha > 0.05) {
        if (!started) {
          g.moveTo(x, y);
          started = true;
        } else {
          g.lineTo(x, y);
        }
      } else {
        started = false;
      }
    }
    g.lineStyle(0);

    const dotAngle = phase + Math.PI * 0.7;
    const dotX = cx + Math.cos(dotAngle) * radius;
    const dotY = cy + Math.sin(dotAngle) * radius * yScale;
    g.beginFill(color, alpha * 1.5);
    g.drawCircle(dotX, dotY, 2.5);
    g.endFill();

    const dot2Angle = phase + Math.PI * 0.2;
    const dot2X = cx + Math.cos(dot2Angle) * radius;
    const dot2Y = cy + Math.sin(dot2Angle) * radius * yScale;
    g.beginFill(color, alpha * 0.8);
    g.drawCircle(dot2X, dot2Y, 1.5);
    g.endFill();
  }
}
