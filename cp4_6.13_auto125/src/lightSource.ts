import { RGBColor, Point, Ray, RaySegment, CANVAS_WIDTH, CANVAS_HEIGHT, MAX_BOUNCES, RAY_COUNT_PER_LIGHT, BEAM_MAX_DISTANCE } from './types';
import { Mirror } from './mirror';

export class LightSource {
  public x: number;
  public y: number;
  public angle: number;
  public coneAngle: number;
  public color: RGBColor;
  public enabled: boolean;
  public id: number;
  public name: string;

  private static idCounter = 0;

  constructor(
    x: number,
    y: number,
    angle: number = 0,
    coneAngle: number = 30,
    color: RGBColor = { r: 255, g: 100, b: 100 },
    enabled: boolean = true,
    name?: string
  ) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.coneAngle = coneAngle;
    this.color = color;
    this.enabled = enabled;
    this.id = LightSource.idCounter++;
    this.name = name ?? `光源 ${this.id + 1}`;
  }

  containsPoint(px: number, py: number, radius: number = 14): boolean {
    const dx = px - this.x;
    const dy = py - this.y;
    return dx * dx + dy * dy <= radius * radius;
  }

  getRotationHandlePos(): Point {
    const handleDist = 40;
    const rad = (this.angle * Math.PI) / 180;
    return {
      x: this.x + Math.cos(rad) * handleDist,
      y: this.y + Math.sin(rad) * handleDist
    };
  }

  isOnRotationHandle(px: number, py: number, radius: number = 10): boolean {
    const handle = this.getRotationHandlePos();
    const dx = px - handle.x;
    const dy = py - handle.y;
    return dx * dx + dy * dy <= radius * radius;
  }

  emitRays(): Ray[] {
    if (!this.enabled) return [];

    const rays: Ray[] = [];
    const startRad = ((this.angle - this.coneAngle / 2) * Math.PI) / 180;
    const endRad = ((this.angle + this.coneAngle / 2) * Math.PI) / 180;
    const step = (endRad - startRad) / (RAY_COUNT_PER_LIGHT - 1);

    for (let i = 0; i < RAY_COUNT_PER_LIGHT; i++) {
      const rad = startRad + step * i;
      rays.push({
        origin: { x: this.x, y: this.y },
        direction: { x: Math.cos(rad), y: Math.sin(rad) },
        color: { ...this.color },
        intensity: 1.0,
        bounceCount: 0,
        maxBounces: MAX_BOUNCES
      });
    }
    return rays;
  }

  traceRays(mirrors: Mirror[]): RaySegment[] {
    if (!this.enabled) return [];

    const segments: RaySegment[] = [];
    const rays = this.emitRays();

    for (const ray of rays) {
      this.traceRayRecursive(ray, mirrors, segments, 0);
    }
    return segments;
  }

  private traceRayRecursive(ray: Ray, mirrors: Mirror[], segments: RaySegment[], depth: number): void {
    if (depth > MAX_BOUNCES) return;
    if (ray.intensity <= 0) return;

    const origin = ray.origin;
    const dir = ray.direction;
    const farPoint: Point = {
      x: origin.x + dir.x * BEAM_MAX_DISTANCE,
      y: origin.y + dir.y * BEAM_MAX_DISTANCE
    };

    let closestHit: { point: Point; distance: number; mirror: Mirror; normal: Point } | null = null;

    for (const mirror of mirrors) {
      const edges = mirror.getEdges();
      for (const edge of edges) {
        const hit = this.rayLineIntersection(origin, dir, edge.start, edge.end);
        if (hit) {
          const dist = Math.hypot(hit.point.x - origin.x, hit.point.y - origin.y);
          if (dist > 0.5 && (!closestHit || dist < closestHit.distance)) {
            const edgeVec: Point = {
              x: edge.end.x - edge.start.x,
              y: edge.end.y - edge.start.y
            };
            const len = Math.hypot(edgeVec.x, edgeVec.y) || 1;
            let normal: Point = { x: -edgeVec.y / len, y: edgeVec.x / len };
            if (normal.x * dir.x + normal.y * dir.y > 0) {
              normal = { x: -normal.x, y: -normal.y };
            }
            closestHit = { point: hit.point, distance: dist, mirror, normal };
          }
        }
      }
    }

    const canvasEdges: [Point, Point][] = [
      [{ x: 0, y: 0 }, { x: CANVAS_WIDTH, y: 0 }],
      [{ x: CANVAS_WIDTH, y: 0 }, { x: CANVAS_WIDTH, y: CANVAS_HEIGHT }],
      [{ x: CANVAS_WIDTH, y: CANVAS_HEIGHT }, { x: 0, y: CANVAS_HEIGHT }],
      [{ x: 0, y: CANVAS_HEIGHT }, { x: 0, y: 0 }]
    ];

    let boundaryHit: Point | null = null;
    let boundaryDist = Infinity;
    for (const [a, b] of canvasEdges) {
      const hit = this.rayLineIntersection(origin, dir, a, b);
      if (hit) {
        const dist = Math.hypot(hit.point.x - origin.x, hit.point.y - origin.y);
        if (dist > 0.5 && dist < boundaryDist) {
          boundaryHit = hit.point;
          boundaryDist = dist;
        }
      }
    }

    let endPoint: Point;
    if (closestHit && closestHit.distance < boundaryDist) {
      endPoint = closestHit.point;
    } else if (boundaryHit) {
      endPoint = boundaryHit;
    } else {
      endPoint = farPoint;
    }

    const clipped = this.clipToCanvas(origin, endPoint);
    if (clipped) {
      segments.push({
        start: clipped.start,
        end: clipped.end,
        color: { ...ray.color },
        intensity: ray.intensity
      });
    }

    if (closestHit && closestHit.distance < boundaryDist) {
      if (ray.bounceCount >= MAX_BOUNCES) {
        return;
      }

      const n = closestHit.normal;
      const dot = dir.x * n.x + dir.y * n.y;
      const reflectDir: Point = {
        x: dir.x - 2 * dot * n.x,
        y: dir.y - 2 * dot * n.y
      };
      const rlen = Math.hypot(reflectDir.x, reflectDir.y) || 1;

      const newRay: Ray = {
        origin: {
          x: closestHit.point.x + reflectDir.x / rlen * 0.5,
          y: closestHit.point.y + reflectDir.y / rlen * 0.5
        },
        direction: { x: reflectDir.x / rlen, y: reflectDir.y / rlen },
        color: { ...ray.color },
        intensity: ray.intensity * 0.8,
        bounceCount: ray.bounceCount + 1,
        maxBounces: MAX_BOUNCES
      };

      this.traceRayRecursive(newRay, mirrors, segments, depth + 1);
    }
  }

  private rayLineIntersection(
    origin: Point, dir: Point,
    a: Point, b: Point
  ): { point: Point; t: number } | null {
    const rdx = dir.x;
    const rdy = dir.y;
    const sdx = b.x - a.x;
    const sdy = b.y - a.y;

    const denom = rdx * sdy - rdy * sdx;
    if (Math.abs(denom) < 1e-9) return null;

    const diffx = a.x - origin.x;
    const diffy = a.y - origin.y;
    const t = (diffx * sdy - diffy * sdx) / denom;
    const u = (diffx * rdy - diffy * rdx) / denom;

    if (t >= 0 && u >= 0 && u <= 1) {
      return {
        point: {
          x: origin.x + t * rdx,
          y: origin.y + t * rdy
        },
        t
      };
    }
    return null;
  }

  private clipToCanvas(a: Point, b: Point): { start: Point; end: Point } | null {
    const ax = Math.max(0, Math.min(CANVAS_WIDTH, a.x));
    const ay = Math.max(0, Math.min(CANVAS_HEIGHT, a.y));
    const bx = Math.max(0, Math.min(CANVAS_WIDTH, b.x));
    const by = Math.max(0, Math.min(CANVAS_HEIGHT, b.y));
    if (Math.hypot(bx - ax, by - ay) < 0.5) return null;
    return { start: { x: ax, y: ay }, end: { x: bx, y: by } };
  }

  draw(ctx: CanvasRenderingContext2D, showHandles: boolean = false): void {
    ctx.save();

    if (this.enabled) {
      this.drawConeBeam(ctx);
    }

    const glowColor = `rgb(${this.color.r},${this.color.g},${this.color.b})`;

    if (this.enabled) {
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 20;
    }

    ctx.beginPath();
    ctx.arc(this.x, this.y, 12, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, 12);
    if (this.enabled) {
      grad.addColorStop(0, glowColor);
      grad.addColorStop(0.6, glowColor);
      grad.addColorStop(1, 'rgba(255,255,255,0.3)');
    } else {
      grad.addColorStop(0, '#555');
      grad.addColorStop(1, '#333');
    }
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = this.enabled ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = this.enabled ? '#fff' : '#888';
    ctx.fill();

    if (showHandles) {
      this.drawAngleIndicator(ctx);
      const hp = this.getRotationHandlePos();
      ctx.beginPath();
      ctx.arc(hp.x, hp.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fill();
      ctx.strokeStyle = this.enabled ? glowColor : '#666';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawAngleIndicator(ctx: CanvasRenderingContext2D): void {
    const rad = (this.angle * Math.PI) / 180;
    const len = 26;
    const ex = this.x + Math.cos(rad) * len;
    const ey = this.y + Math.sin(rad) * len;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(ex, ey);
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);
  }

  private drawConeBeam(ctx: CanvasRenderingContext2D): void {
    const halfCone = (this.coneAngle / 2) * Math.PI / 180;
    const centerRad = (this.angle * Math.PI) / 180;
    const maxDist = 300;
    const steps = 12;

    for (let i = steps; i >= 1; i--) {
      const t = i / steps;
      const angleSpread = halfCone * t;
      const leftRad = centerRad - angleSpread;
      const rightRad = centerRad + angleSpread;
      const dist = maxDist;

      const left: Point = {
        x: this.x + Math.cos(leftRad) * dist,
        y: this.y + Math.sin(leftRad) * dist
      };
      const right: Point = {
        x: this.x + Math.cos(rightRad) * dist,
        y: this.y + Math.sin(rightRad) * dist
      };

      const alpha = (1 - t) * 0.12;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(left.x, left.y);
      ctx.lineTo(right.x, right.y);
      ctx.closePath();
      ctx.fillStyle = `rgba(${this.color.r},${this.color.g},${this.color.b},${alpha})`;
      ctx.fill();
    }
  }

  getCSSColor(): string {
    return `rgb(${this.color.r},${this.color.g},${this.color.b})`;
  }

  getHexColor(): string {
    const toHex = (n: number) => Math.round(n).toString(16).padStart(2, '0');
    return `#${toHex(this.color.r)}${toHex(this.color.g)}${toHex(this.color.b)}`;
  }

  setHexColor(hex: string): void {
    const h = hex.replace('#', '');
    this.color = {
      r: parseInt(h.substring(0, 2), 16),
      g: parseInt(h.substring(2, 4), 16),
      b: parseInt(h.substring(4, 6), 16)
    };
  }

  clone(): LightSource {
    return new LightSource(
      this.x, this.y, this.angle, this.coneAngle, { ...this.color }, this.enabled, this.name
    );
  }
}
