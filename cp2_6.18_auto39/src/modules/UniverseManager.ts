import { EventType, eventBus } from './EventBus.js';

export interface Star {
  x: number; y: number;
  radius: number;
  color: string;
  baseHaloRadius: number;
  pulsePhase: number;
}

export interface Planet {
  id: string;
  name: string;
  color: string;
  orbitColor: string;
  semiMajorAxis: number;
  eccentricity: number;
  orbitAngle: number;
  orbitSpeed: number;
  radius: number;
  influenceRadius: number;
  mass: number;
  x: number; y: number;
}

export interface Target {
  x: number; y: number;
  radius: number;
  blinkPhase: number;
}

const WARM_COLORS: string[] = ['#E74C3C', '#F39C12', '#1ABC9C'];
const ORBIT_COLORS: string[] = ['#6AA84F', '#8E44AD', '#2C3E50'];
const PLANET_NAMES: string[] = ['Aether', 'Nova', 'Zephyr', 'Pulsar', 'Quasar', 'Nebula'];

const G = 2800;

export class UniverseManager {
  public star: Star;
  public planets: Planet[] = [];
  public target: Target;
  public hoveredPlanetId: string | null = null;

  private centerX = 0;
  private centerY = 0;
  private viewportW = 0;
  private viewportH = 0;
  private nextOrbitColorIdx = 0;
  private usedNames = new Set<string>();

  constructor() {
    this.star = {
      x: 0, y: 0,
      radius: 22,
      color: '#FF6B35',
      baseHaloRadius: 60,
      pulsePhase: 0
    };
    this.target = { x: 0, y: 0, radius: 20, blinkPhase: 0 };
  }

  setViewport(w: number, h: number): void {
    this.viewportW = w;
    this.viewportH = h;
    this.centerX = w / 2;
    this.centerY = h / 2;
    this.star.x = this.centerX;
    this.star.y = this.centerY;
  }

  reset(): void {
    this.planets = [];
    this.hoveredPlanetId = null;
    this.nextOrbitColorIdx = 0;
    this.usedNames.clear();
    this.target = { x: 0, y: 0, radius: 20, blinkPhase: 0 };
    this.spawnDefaultPlanet();
    this.spawnTarget();
  }

  private randomName(): string {
    const avail = PLANET_NAMES.filter(n => !this.usedNames.has(n));
    const pool = avail.length ? avail : PLANET_NAMES;
    const name = pool[Math.floor(Math.random() * pool.length)];
    this.usedNames.add(name);
    return name;
  }

  spawnDefaultPlanet(): void {
    const p: Planet = {
      id: 'planet-' + Date.now() + '-0',
      name: this.randomName(),
      color: WARM_COLORS[0],
      orbitColor: '#4A6A8A',
      semiMajorAxis: 200,
      eccentricity: 0.2,
      orbitAngle: Math.random() * Math.PI * 2,
      orbitSpeed: 0.0045,
      radius: 14,
      influenceRadius: 40,
      mass: 320,
      x: 0, y: 0
    };
    this.updatePlanetPosition(p);
    this.planets.push(p);
    eventBus.emit(EventType.PLANET_CREATED, { id: p.id, name: p.name });
  }

  addPlanet(): boolean {
    if (this.planets.length >= 3) return false;
    const semiMajor = 300 + Math.random() * 200;
    const eccentricity = 0.1 + Math.random() * 0.2;
    const influenceDiameter = 30 + Math.random() * 30;
    const colorIdx = Math.floor(Math.random() * WARM_COLORS.length);
    const orbitColor = ORBIT_COLORS[this.nextOrbitColorIdx % ORBIT_COLORS.length];
    this.nextOrbitColorIdx++;

    const p: Planet = {
      id: 'planet-' + Date.now() + '-' + this.planets.length,
      name: this.randomName(),
      color: WARM_COLORS[colorIdx],
      orbitColor,
      semiMajorAxis: semiMajor,
      eccentricity,
      orbitAngle: Math.random() * Math.PI * 2,
      orbitSpeed: 0.002 + Math.random() * 0.0025,
      radius: 10 + Math.random() * 6,
      influenceRadius: influenceDiameter,
      mass: 260 + influenceDiameter * 6,
      x: 0, y: 0
    };
    this.updatePlanetPosition(p);
    this.planets.push(p);
    eventBus.emit(EventType.PLANET_CREATED, { id: p.id, name: p.name });
    return true;
  }

  get maxPlanets(): number { return 3; }

  spawnTarget(): void {
    const margin = 120;
    const maxR = Math.min(this.viewportW, this.viewportH) / 2 - margin;
    const angle = Math.random() * Math.PI * 2;
    const r = 280 + Math.random() * Math.max(60, maxR - 280);
    this.target.x = this.centerX + Math.cos(angle) * r;
    this.target.y = this.centerY + Math.sin(angle) * r;
    this.target.blinkPhase = 0;
  }

  randomCraftStart(): { x: number; y: number } {
    const angle = Math.random() * Math.PI * 2;
    const r = 150 + Math.random() * 50;
    return {
      x: this.centerX + Math.cos(angle) * r,
      y: this.centerY + Math.sin(angle) * r
    };
  }

  private updatePlanetPosition(p: Planet): void {
    const a = p.semiMajorAxis;
    const e = p.eccentricity;
    const theta = p.orbitAngle;
    const r = (a * (1 - e * e)) / (1 + e * Math.cos(theta));
    p.x = this.centerX + r * Math.cos(theta);
    p.y = this.centerY + r * Math.sin(theta);
  }

  update(dt: number): void {
    this.star.pulsePhase += (Math.PI * 2 / 3) * dt;
    this.target.blinkPhase += (Math.PI * 2 / 0.8) * dt;
    for (const p of this.planets) {
      p.orbitAngle += p.orbitSpeed * dt * 60;
      this.updatePlanetPosition(p);
    }
  }

  getGravityField(): Array<{ x: number; y: number; mass: number; influenceRadius: number; influenceRadiusSq: number; id: string }> {
    return this.planets.map(p => ({
      x: p.x, y: p.y,
      mass: p.mass,
      influenceRadius: p.influenceRadius,
      influenceRadiusSq: p.influenceRadius * p.influenceRadius,
      id: p.id
    }));
  }

  getStarGravity() {
    return { id: 'star', x: this.star.x, y: this.star.y, mass: 1400, influenceRadius: Math.max(this.viewportW, this.viewportH), influenceRadiusSq: Infinity };
  }

  getG(): number { return G; }

  findPlanetAt(x: number, y: number): Planet | null {
    for (const p of this.planets) {
      const dx = x - p.x, dy = y - p.y;
      const rr = p.radius + 4;
      if (dx * dx + dy * dy <= rr * rr) return p;
    }
    return null;
  }

  // ---------- Rendering ----------

  render(ctx: CanvasRenderingContext2D): void {
    this.renderOrbits(ctx);
    this.renderStar(ctx);
    this.renderInfluenceRanges(ctx);
    this.renderPlanets(ctx);
    this.renderTarget(ctx);
  }

  private renderOrbits(ctx: CanvasRenderingContext2D): void {
    for (const p of this.planets) {
      const hovered = this.hoveredPlanetId === p.id;
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = p.orbitColor;
      ctx.lineWidth = hovered ? 2 : 1;
      if (!hovered) ctx.setLineDash([6, 6]);
      const a = p.semiMajorAxis;
      const e = p.eccentricity;
      const b = a * Math.sqrt(1 - e * e);
      const c = a * e;
      const cx = this.centerX - c;
      const cy = this.centerY;
      ctx.ellipse(cx, cy, a, b, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  private renderStar(ctx: CanvasRenderingContext2D): void {
    const pulse = 1 + 0.16 * Math.sin(this.star.pulsePhase);
    const haloR = this.star.baseHaloRadius * pulse;

    const grad = ctx.createRadialGradient(
      this.star.x, this.star.y, this.star.radius * 0.3,
      this.star.x, this.star.y, haloR
    );
    grad.addColorStop(0, 'rgba(255,155,80,0.85)');
    grad.addColorStop(0.25, 'rgba(255,107,53,0.42)');
    grad.addColorStop(0.6, 'rgba(255,90,40,0.12)');
    grad.addColorStop(1, 'rgba(255,80,30,0)');

    ctx.save();
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.star.x, this.star.y, haloR, 0, Math.PI * 2);
    ctx.fill();

    const coreGrad = ctx.createRadialGradient(
      this.star.x - 4, this.star.y - 4, 1,
      this.star.x, this.star.y, this.star.radius
    );
    coreGrad.addColorStop(0, '#FFE9B0');
    coreGrad.addColorStop(0.45, '#FF9B40');
    coreGrad.addColorStop(1, this.star.color);
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(this.star.x, this.star.y, this.star.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private renderInfluenceRanges(ctx: CanvasRenderingContext2D): void {
    for (const p of this.planets) {
      const grad = ctx.createRadialGradient(p.x, p.y, p.radius, p.x, p.y, p.influenceRadius);
      grad.addColorStop(0, 'rgba(255,221,68,0.28)');
      grad.addColorStop(1, 'rgba(255,221,68,0.02)');
      ctx.save();
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.influenceRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,221,68,0.22)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 5]);
      ctx.stroke();
      ctx.restore();
    }
  }

  private renderPlanets(ctx: CanvasRenderingContext2D): void {
    for (const p of this.planets) {
      const hovered = this.hoveredPlanetId === p.id;
      ctx.save();
      const haloR = p.radius * 2.6;
      const halo = ctx.createRadialGradient(p.x, p.y, p.radius * 0.4, p.x, p.y, haloR);
      halo.addColorStop(0, p.color + 'AA');
      halo.addColorStop(1, p.color + '00');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(p.x, p.y, haloR, 0, Math.PI * 2);
      ctx.fill();

      const core = ctx.createRadialGradient(
        p.x - p.radius * 0.35, p.y - p.radius * 0.35, 0.5,
        p.x, p.y, p.radius
      );
      core.addColorStop(0, this.lightenColor(p.color, 30));
      core.addColorStop(1, p.color);
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();

      if (hovered) {
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius + 4, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  private renderTarget(ctx: CanvasRenderingContext2D): void {
    const t = this.target;
    const alpha = 0.5 + 0.5 * (0.5 + 0.5 * Math.sin(t.blinkPhase));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#FFD700';
    this.drawStarShape(ctx, t.x, t.y, 5, t.radius, t.radius * 0.45);
    ctx.fill();
    ctx.strokeStyle = '#FFF3A8';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.18 * alpha;
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.radius + 16, 0, Math.PI * 2);
    ctx.fillStyle = '#FFD700';
    ctx.fill();
    ctx.restore();
  }

  private drawStarShape(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerR: number, innerR: number): void {
    let rot = -Math.PI / 2;
    const step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
    for (let i = 0; i < spikes; i++) {
      rot += step;
      ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
      rot += step;
      ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
    }
    ctx.closePath();
  }

  private lightenColor(hex: string, amount: number): string {
    const h = hex.replace('#', '');
    const r = Math.min(255, parseInt(h.substring(0, 2), 16) + amount);
    const g = Math.min(255, parseInt(h.substring(2, 4), 16) + amount);
    const b = Math.min(255, parseInt(h.substring(4, 6), 16) + amount);
    return `rgb(${r},${g},${b})`;
  }
}
