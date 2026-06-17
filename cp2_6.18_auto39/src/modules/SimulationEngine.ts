import { EventType, ManeuverType, ScoreResult, eventBus } from './EventBus.js';

export interface TrailPoint {
  x: number; y: number;
  isHyperbolic: boolean;
}

export interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number;
  maxLife: number;
}

export interface ManeuverPoint {
  id: string;
  x: number; y: number;
  activated: boolean;
}

export interface Craft {
  x: number; y: number;
  vx: number; vy: number;
  fuel: number;
  trail: TrailPoint[];
  trailLength: number;
  maneuverCount: number;
  inGravityRangeOf: string | null;
  lastTrailSampleDist: number;
  startX: number; startY: number;
}

type GravitySource = { x: number; y: number; mass: number; influenceRadiusSq: number; influenceRadius: number; id: string };

const MAX_PARTICLES = 200;
const MAX_TRAIL_POINTS = 3000;
const EPS = 0.01;
const G = 2800;

export class SimulationEngine {
  public craft: Craft;
  public particles: Particle[] = [];
  public maneuverPoints: ManeuverPoint[] = [];
  public activeManeuverId: string | null = null;
  public launched = false;
  public settled = false;

  private particleWriteIdx = 0;

  constructor() {
    this.craft = this.emptyCraft();
  }

  private emptyCraft(): Craft {
    return {
      x: 0, y: 0, vx: 0, vy: 0,
      fuel: 100,
      trail: [],
      trailLength: 0,
      maneuverCount: 0,
      inGravityRangeOf: null,
      lastTrailSampleDist: 0,
      startX: 0, startY: 0
    };
  }

  reset(startX: number, startY: number): void {
    this.craft = this.emptyCraft();
    this.craft.x = startX;
    this.craft.y = startY;
    this.craft.startX = startX;
    this.craft.startY = startY;
    this.particles = [];
    this.particleWriteIdx = 0;
    this.maneuverPoints = [];
    this.activeManeuverId = null;
    this.launched = false;
    this.settled = false;
    eventBus.emit(EventType.FUEL_CHANGED, 100);
  }

  setInitialVelocity(vx: number, vy: number): void {
    this.craft.vx = vx;
    this.craft.vy = vy;
    this.launched = true;
    this.craft.trail.push({ x: this.craft.x, y: this.craft.y, isHyperbolic: false });
  }

  addManeuverPoint(x: number, y: number): ManeuverPoint | null {
    if (!this.launched || this.settled) return null;
    if (this.craft.fuel <= 0) return null;
    const mp: ManeuverPoint = {
      id: 'mp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      x, y,
      activated: false
    };
    this.maneuverPoints.push(mp);
    return mp;
  }

  executeManeuver(pointId: string, type: ManeuverType): boolean {
    if (this.craft.fuel <= 0) return false;
    const mp = this.maneuverPoints.find(m => m.id === pointId);
    if (!mp || mp.activated) return false;

    const speed = Math.hypot(this.craft.vx, this.craft.vy);
    const dv = 55;
    let nx = 0, ny = 0;

    if (speed > 0.0001) {
      nx = this.craft.vx / speed;
      ny = this.craft.vy / speed;
    } else {
      nx = 1; ny = 0;
    }

    switch (type) {
      case 'accelerate':
        this.craft.vx += nx * dv;
        this.craft.vy += ny * dv;
        break;
      case 'decelerate':
        this.craft.vx -= nx * dv;
        this.craft.vy -= ny * dv;
        break;
      case 'turn-left':
        this.craft.vx += -ny * dv * 0.9;
        this.craft.vy += nx * dv * 0.9;
        break;
      case 'turn-right':
        this.craft.vx += ny * dv * 0.9;
        this.craft.vy += -nx * dv * 0.9;
        break;
    }

    const cost = 5 + Math.random() * 10;
    this.craft.fuel = Math.max(0, this.craft.fuel - cost);
    this.craft.maneuverCount++;
    mp.activated = true;

    eventBus.emit(EventType.MANEUVER_EXECUTED, type);
    eventBus.emit(EventType.FUEL_CHANGED, this.craft.fuel);

    this.spawnBurstParticles(10);
    return true;
  }

  findNearestTrailPoint(x: number, y: number, threshold = 12): TrailPoint | null {
    let best: TrailPoint | null = null;
    let bestD = threshold * threshold;
    for (let i = 0; i < this.craft.trail.length; i += 3) {
      const p = this.craft.trail[i];
      const dx = p.x - x, dy = p.y - y;
      const d = dx * dx + dy * dy;
      if (d < bestD) { bestD = d; best = p; }
    }
    return best;
  }

  update(
    dt: number,
    gravityField: GravitySource[],
    starGravity: GravitySource,
    target: { x: number; y: number; radius: number }
  ): ScoreResult | null {
    if (!this.launched || this.settled) return null;

    const craft = this.craft;
    const prevX = craft.x, prevY = craft.y;

    let ax = 0, ay = 0;
    let inRangeId: string | null = null;

    const sdx = starGravity.x - craft.x;
    const sdy = starGravity.y - craft.y;
    const sDistSq = sdx * sdx + sdy * sdy;
    if (sDistSq < starGravity.influenceRadiusSq) {
      const sDist = Math.sqrt(sDistSq) + EPS;
      const sForce = G * starGravity.mass / (sDistSq + EPS * 100);
      ax += sForce * sdx / sDist;
      ay += sForce * sdy / sDist;
    }

    for (const src of gravityField) {
      const dx = src.x - craft.x;
      const dy = src.y - craft.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < src.influenceRadiusSq) {
        const dist = Math.sqrt(distSq) + EPS;
        const force = G * src.mass / (distSq + EPS * 400);
        ax += force * dx / dist;
        ay += force * dy / dist;
        if (dist < src.influenceRadius) inRangeId = src.id;
      }
    }

    craft.inGravityRangeOf = inRangeId;
    const dtScaled = dt * 60;

    craft.vx += ax * dt * dtScaled * 0.016;
    craft.vy += ay * dt * dtScaled * 0.016;
    craft.x += craft.vx * dt * dtScaled * 0.016;
    craft.y += craft.vy * dt * dtScaled * 0.016;

    const movedDx = craft.x - prevX;
    const movedDy = craft.y - prevY;
    const movedDist = Math.hypot(movedDx, movedDy);
    craft.trailLength += movedDist;

    craft.lastTrailSampleDist += movedDist;
    if (craft.lastTrailSampleDist >= 2.5) {
      craft.lastTrailSampleDist = 0;
      craft.trail.push({ x: craft.x, y: craft.y, isHyperbolic: !!inRangeId });
      if (craft.trail.length > MAX_TRAIL_POINTS) {
        craft.trail.splice(0, craft.trail.length - MAX_TRAIL_POINTS);
      }
    }

    if (inRangeId) {
      for (let i = 0; i < 4; i++) {
        this.pushParticle(
          craft.x - movedDx * Math.random(),
          craft.y - movedDy * Math.random(),
          -craft.vx * 0.05 + (Math.random() - 0.5) * 0.4,
          -craft.vy * 0.05 + (Math.random() - 0.5) * 0.4,
          2.0
        );
      }
    }

    this.updateParticles(dt);

    const dxT = target.x - craft.x;
    const dyT = target.y - craft.y;
    if (dxT * dxT + dyT * dyT <= target.radius * target.radius) {
      this.settled = true;
      const standard = Math.hypot(target.x - craft.startX, target.y - craft.startY);
      const ratio = Math.min(2, Math.max(1, standard / Math.max(1, craft.trailLength)));
      const bonus = Math.round((ratio - 1) * 100);
      const totalScore = 100 + bonus;
      const result: ScoreResult = {
        totalScore,
        trailLength: Math.round(craft.trailLength),
        fuelRemaining: Math.round(craft.fuel),
        maneuverCount: craft.maneuverCount,
        standardPathLength: Math.round(standard)
      };
      eventBus.emit(EventType.TARGET_REACHED, result);
      return result;
    }

    const speed = Math.hypot(craft.vx, craft.vy);
    let angle = 0;
    if (speed > 0.001) {
      angle = (Math.atan2(craft.vy, craft.vx) * 180 / Math.PI + 360) % 360;
    }
    eventBus.emit(EventType.CRAFT_STATE_UPDATED, {
      x: craft.x, y: craft.y,
      vx: craft.vx, vy: craft.vy,
      speed, angle,
      fuel: craft.fuel,
      maneuverCount: craft.maneuverCount,
      trailLength: craft.trailLength,
      inGravityRange: craft.inGravityRangeOf !== null
    });

    return null;
  }

  private pushParticle(x: number, y: number, vx: number, vy: number, life: number): void {
    const p: Particle = { x, y, vx, vy, life, maxLife: life };
    if (this.particles.length < MAX_PARTICLES) {
      this.particles.push(p);
    } else {
      this.particles[this.particleWriteIdx] = p;
      this.particleWriteIdx = (this.particleWriteIdx + 1) % MAX_PARTICLES;
    }
  }

  private spawnBurstParticles(n: number): void {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 0.6 + Math.random() * 1.8;
      this.pushParticle(this.craft.x, this.craft.y, Math.cos(a) * s, Math.sin(a) * s, 1.2);
    }
  }

  private updateParticles(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.985;
      p.vy *= 0.985;
    }
    this.particleWriteIdx = this.particles.length;
  }

  // ---------- Rendering ----------

  render(ctx: CanvasRenderingContext2D): void {
    this.renderTrail(ctx);
    this.renderParticles(ctx);
    this.renderManeuverPoints(ctx);
    this.renderCraft(ctx);
  }

  private renderTrail(ctx: CanvasRenderingContext2D): void {
    const trail = this.craft.trail;
    if (trail.length < 2) return;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(trail[0].x, trail[0].y);
    let currentHyp = trail[0].isHyperbolic;
    let startIdx = 0;

    const drawSegment = (from: number, to: number, hyperbolic: boolean) => {
      ctx.beginPath();
      ctx.moveTo(trail[from].x, trail[from].y);
      for (let i = from + 1; i <= to; i++) {
        ctx.lineTo(trail[i].x, trail[i].y);
      }
      if (hyperbolic) {
        ctx.strokeStyle = '#FF9933';
        ctx.lineWidth = 2.2;
      } else {
        ctx.strokeStyle = 'rgba(220,230,255,0.55)';
        ctx.lineWidth = 1.3;
      }
      ctx.stroke();
    };

    for (let i = 1; i < trail.length; i++) {
      if (trail[i].isHyperbolic !== currentHyp) {
        drawSegment(startIdx, i - 1, currentHyp);
        currentHyp = trail[i].isHyperbolic;
        startIdx = i - 1;
      }
    }
    drawSegment(startIdx, trail.length - 1, currentHyp);

    ctx.beginPath();
    let acc = 0;
    for (let i = 1; i < trail.length; i++) {
      const a = trail[i - 1], b = trail[i];
      const dx = b.x - a.x, dy = b.y - a.y;
      const segLen = Math.hypot(dx, dy);
      acc += segLen;
      while (acc >= 10) {
        const t = (segLen - (acc - 10)) / segLen;
        const px = a.x + dx * t;
        const py = a.y + dy * t;
        ctx.moveTo(px + 1, py);
        ctx.arc(px, py, 1.1, 0, Math.PI * 2);
        acc -= 10;
      }
    }
    ctx.fillStyle = 'rgba(200,220,255,0.55)';
    ctx.fill();
    ctx.restore();
  }

  private renderParticles(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const p of this.particles) {
      const t = p.life / p.maxLife;
      const r = 2 + (1 - t) * 4;
      const alpha = 0.12 + t * 0.5;
      const rC = Math.round(255);
      const gC = Math.round(180 + (t - 0.5) * 120);
      const bC = Math.round(40 + (1 - t) * 80);
      ctx.fillStyle = `rgba(${rC},${gC},${bC},${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private renderManeuverPoints(ctx: CanvasRenderingContext2D): void {
    for (const mp of this.maneuverPoints) {
      const activated = mp.activated;
      const active = this.activeManeuverId === mp.id;
      ctx.save();
      if (activated) {
        ctx.fillStyle = 'rgba(160,160,160,0.5)';
      } else if (active) {
        ctx.fillStyle = '#FFD700';
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 14;
      } else {
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = '#FFFFFF';
        ctx.shadowBlur = 8;
      }
      ctx.beginPath();
      ctx.arc(mp.x, mp.y, active ? 7.5 : 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private renderCraft(ctx: CanvasRenderingContext2D): void {
    const c = this.craft;
    const speed = Math.hypot(c.vx, c.vy);
    let angle = 0;
    if (speed > 0.001) angle = Math.atan2(c.vy, c.vx);

    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(angle);

    if (this.launched && speed > 0.5) {
      const flameLen = 4 + Math.min(18, speed * 0.2);
      const flameGrad = ctx.createLinearGradient(-flameLen, 0, -2, 0);
      flameGrad.addColorStop(0, 'rgba(255,140,40,0)');
      flameGrad.addColorStop(0.5, 'rgba(255,180,60,0.8)');
      flameGrad.addColorStop(1, 'rgba(255,240,180,0.95)');
      ctx.fillStyle = flameGrad;
      ctx.beginPath();
      ctx.moveTo(-2, -4);
      ctx.lineTo(-flameLen - Math.random() * 3, 0);
      ctx.lineTo(-2, 4);
      ctx.closePath();
      ctx.fill();
    }

    const bodyGrad = ctx.createLinearGradient(0, -7, 0, 7);
    bodyGrad.addColorStop(0, '#E8F0FF');
    bodyGrad.addColorStop(0.5, '#B0C4DE');
    bodyGrad.addColorStop(1, '#607090');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.moveTo(11, 0);
    ctx.lineTo(-6, -6);
    ctx.lineTo(-3, 0);
    ctx.lineTo(-6, 6);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 0.7;
    ctx.stroke();

    ctx.fillStyle = '#4FC3F7';
    ctx.beginPath();
    ctx.arc(2, 0, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
