import { Particle, Vec2 } from './Particle';

export interface Polygon {
  vertices: Vec2[];
  center: Vec2;
  velocity: Vec2;
  type: 'rect' | 'triangle';
  dragging: boolean;
}

export class CollisionSystem {
  private polygons: Polygon[] = [];
  private particles: Particle[] = [];
  private splashParticles: Particle[] = [];

  public setParticles(particles: Particle[]): void {
    this.particles = particles;
  }

  public setPolygons(polygons: Polygon[]): void {
    this.polygons = polygons;
  }

  public getSplashParticles(): Particle[] {
    const result = this.splashParticles;
    this.splashParticles = [];
    return result;
  }

  public resolve(): void {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      for (let j = 0; j < this.polygons.length; j++) {
        this.resolveParticlePolygon(p, this.polygons[j]);
      }
    }
  }

  public movePolygon(index: number, newCenter: Vec2): void {
    if (index < 0 || index >= this.polygons.length) return;
    const poly = this.polygons[index];
    const dx = newCenter.x - poly.center.x;
    const dy = newCenter.y - poly.center.y;

    poly.velocity.x = dx * 60;
    poly.velocity.y = dy * 60;

    for (let i = 0; i < poly.vertices.length; i++) {
      poly.vertices[i].x += dx;
      poly.vertices[i].y += dy;
    }
    poly.center.x = newCenter.x;
    poly.center.y = newCenter.y;

    this.pushNearbyParticles(poly, dx, dy);
  }

  public resetPolygonVelocity(): void {
    for (const poly of this.polygons) {
      poly.velocity.x = 0;
      poly.velocity.y = 0;
    }
  }

  public hitTestPolygon(x: number, y: number): number {
    for (let i = 0; i < this.polygons.length; i++) {
      if (this.pointInPolygon(x, y, this.polygons[i])) return i;
    }
    return -1;
  }

  private pushNearbyParticles(poly: Polygon, dx: number, dy: number): void {
    const pushDist = 50;
    const pushDist2 = pushDist * pushDist;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const closest = this.closestPointOnPolygon(p.pos, poly);
      const cdx = p.pos.x - closest.x;
      const cdy = p.pos.y - closest.y;
      const d2 = cdx * cdx + cdy * cdy;

      if (d2 < pushDist2 && d2 > 0.0001) {
        const d = Math.sqrt(d2);
        const strength = (1 - d / pushDist);
        const pushX = dx * strength * 0.8 + (cdx / d) * strength * 20;
        const pushY = dy * strength * 0.8 + (cdy / d) * strength * 20;
        p.vel.x += pushX;
        p.vel.y += pushY;
      }
    }
  }

  private resolveParticlePolygon(p: Particle, poly: Polygon): void {
    const closest = this.closestPointOnPolygon(p.pos, poly);
    const dx = p.pos.x - closest.x;
    const dy = p.pos.y - closest.y;
    const dist2 = dx * dx + dy * dy;
    const r = p.radius;
    const r2 = r * r;

    if (dist2 < r2) {
      let dist = Math.sqrt(dist2);
      if (dist < 0.0001) {
        dist = 0.0001;
      }

      const nx = dx / dist;
      const ny = dy / dist;
      const penetration = r - dist;

      p.pos.x += nx * penetration;
      p.pos.y += ny * penetration;

      const dot = p.vel.x * nx + p.vel.y * ny;
      if (dot < 0) {
        const restitution = 0.4;
        const tx = -ny;
        const ty = nx;
        const velTangent = p.vel.x * tx + p.vel.y * ty;
        const friction = 0.7;
        p.vel.x = (p.vel.x - (1 + restitution) * dot * nx) * friction + velTangent * tx * (1 - friction);
        p.vel.y = (p.vel.y - (1 + restitution) * dot * ny) * friction + velTangent * ty * (1 - friction);

        p.vel.x += poly.velocity.x * 0.3;
        p.vel.y += poly.velocity.y * 0.3;

        if (Math.abs(dot) > 80 && Math.random() < 0.3) {
          this.createSplash(p.pos.x, p.pos.y, -nx, -ny, p.type);
        }
      }
    }
  }

  private createSplash(x: number, y: number, nx: number, ny: number, type: 'water' | 'smoke'): void {
    const count = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const spread = (Math.random() - 0.5) * 0.8;
      const sx = nx * Math.cos(spread) - ny * Math.sin(spread);
      const sy = nx * Math.sin(spread) + ny * Math.cos(spread);
      const speed = 40 + Math.random() * 80;
      this.splashParticles.push(
        new Particle(x + nx * 2, y + ny * 2, sx * speed, sy * speed, type, 2)
      );
    }
  }

  private closestPointOnPolygon(point: Vec2, poly: Polygon): Vec2 {
    let bestDist = Infinity;
    let bestX = poly.vertices[0].x;
    let bestY = poly.vertices[0].y;

    for (let i = 0; i < poly.vertices.length; i++) {
      const a = poly.vertices[i];
      const b = poly.vertices[(i + 1) % poly.vertices.length];
      const cp = this.closestPointOnSegment(point, a, b);
      const dx = point.x - cp.x;
      const dy = point.y - cp.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestDist) {
        bestDist = d2;
        bestX = cp.x;
        bestY = cp.y;
      }
    }

    if (this.pointInPolygon(point.x, point.y, poly)) {
      return { x: bestX, y: bestY };
    }

    return { x: bestX, y: bestY };
  }

  private closestPointOnSegment(p: Vec2, a: Vec2, b: Vec2): Vec2 {
    const abx = b.x - a.x;
    const aby = b.y - a.y;
    const apx = p.x - a.x;
    const apy = p.y - a.y;
    const abLen2 = abx * abx + aby * aby;

    if (abLen2 < 0.0001) return { x: a.x, y: a.y };

    let t = (apx * abx + apy * aby) / abLen2;
    t = Math.max(0, Math.min(1, t));

    return {
      x: a.x + t * abx,
      y: a.y + t * aby,
    };
  }

  private pointInPolygon(x: number, y: number, poly: Polygon): boolean {
    let inside = false;
    const verts = poly.vertices;
    for (let i = 0, j = verts.length - 1; i < verts.length; j = i++) {
      const xi = verts[i].x, yi = verts[i].y;
      const xj = verts[j].x, yj = verts[j].y;
      const intersect =
        yi > y !== yj > y &&
        x < ((xj - xi) * (y - yi)) / (yj - yi + 0.0001) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }
}

export function createDefaultPolygons(width: number, height: number): Polygon[] {
  const cx = width * 0.35;
  const cy = height * 0.6;
  const rectW = 180;
  const rectH = 40;

  const rect: Polygon = {
    vertices: [
      { x: cx - rectW / 2, y: cy - rectH / 2 },
      { x: cx + rectW / 2, y: cy - rectH / 2 },
      { x: cx + rectW / 2, y: cy + rectH / 2 },
      { x: cx - rectW / 2, y: cy + rectH / 2 },
    ],
    center: { x: cx, y: cy },
    velocity: { x: 0, y: 0 },
    type: 'rect',
    dragging: false,
  };

  const tx = width * 0.68;
  const ty = height * 0.4;
  const ts = 80;

  const triangle: Polygon = {
    vertices: [
      { x: tx, y: ty - ts },
      { x: tx + ts, y: ty + ts * 0.6 },
      { x: tx - ts, y: ty + ts * 0.6 },
    ],
    center: { x: tx, y: ty },
    velocity: { x: 0, y: 0 },
    type: 'triangle',
    dragging: false,
  };

  return [rect, triangle];
}
