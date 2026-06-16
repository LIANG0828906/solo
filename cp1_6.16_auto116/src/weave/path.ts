import * as THREE from 'three';

export function generateBezierPath(points: THREE.Vector3[], segments: number = 50): THREE.Vector3[] {
  if (points.length < 2) return [...points];

  const result: THREE.Vector3[] = [];

  if (points.length === 2) {
    const mid = new THREE.Vector3().addVectors(points[0], points[1]).multiplyScalar(0.5);
    const direction = new THREE.Vector3().subVectors(points[1], points[0]);
    const perpendicular = new THREE.Vector3(-direction.y, direction.x, direction.z * 0.3).normalize();
    const offset = perpendicular.multiplyScalar(direction.length() * 0.2);
    const control = mid.add(offset);

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const point = quadraticBezier(points[0], control, points[1], t);
      result.push(point);
    }
    return result;
  }

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const cp1 = getControlPoint(p0, p1, p2, true);
    const cp2 = getControlPoint(p1, p2, p3, false);

    const segCount = Math.floor(segments / (points.length - 1));
    for (let j = 0; j <= segCount; j++) {
      const t = j / segCount;
      const point = cubicBezier(p1, cp1, cp2, p2, t);
      if (i === 0 || j > 0) {
        result.push(point);
      }
    }
  }

  return result;
}

function quadraticBezier(p0: THREE.Vector3, p1: THREE.Vector3, p2: THREE.Vector3, t: number): THREE.Vector3 {
  const mt = 1 - t;
  return new THREE.Vector3(
    mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
    mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
    mt * mt * p0.z + 2 * mt * t * p1.z + t * t * p2.z
  );
}

function cubicBezier(
  p0: THREE.Vector3,
  p1: THREE.Vector3,
  p2: THREE.Vector3,
  p3: THREE.Vector3,
  t: number
): THREE.Vector3 {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;

  return new THREE.Vector3(
    mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
    mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y,
    mt3 * p0.z + 3 * mt2 * t * p1.z + 3 * mt * t2 * p2.z + t3 * p3.z
  );
}

function getControlPoint(p0: THREE.Vector3, p1: THREE.Vector3, p2: THREE.Vector3, isStart: boolean): THREE.Vector3 {
  const d01 = p0.distanceTo(p1);
  const d12 = p1.distanceTo(p2);
  const dTotal = d01 + d12;

  if (dTotal === 0) return p1.clone();

  const direction = new THREE.Vector3().subVectors(p2, p0);
  const scale = 0.3;

  const perpendicular = new THREE.Vector3(-direction.y, direction.x, direction.z * 0.5).normalize();

  const mid = new THREE.Vector3().addVectors(p0, p2).multiplyScalar(0.5);
  const offset = perpendicular.multiplyScalar(direction.length() * scale * (isStart ? 0.5 : -0.5));

  const cp = new THREE.Vector3().addVectors(mid, offset);
  cp.lerp(p1, 0.3);

  return cp;
}

export class PathAnimator {
  private path: THREE.CatmullRomCurve3 | null = null;
  private currentT: number = 0;
  private speed: number = 0.005;
  private active: boolean = false;
  private onPointReached: ((index: number) => void) | null = null;
  private lastReachedIndex: number = -1;
  private controlPoints: THREE.Vector3[] = [];

  setPath(points: THREE.Vector3[]): void {
    this.controlPoints = [...points];
    this.path = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
    this.currentT = 0;
    this.lastReachedIndex = -1;
  }

  start(): void {
    if (!this.path) return;
    this.active = true;
    this.currentT = 0;
    this.lastReachedIndex = -1;
  }

  stop(): void {
    this.active = false;
  }

  isActive(): boolean {
    return this.active;
  }

  setSpeed(speed: number): void {
    this.speed = speed;
  }

  setOnPointReached(callback: (index: number) => void): void {
    this.onPointReached = callback;
  }

  update(deltaTime: number): THREE.Vector3 | null {
    if (!this.active || !this.path) return null;

    this.currentT += this.speed * deltaTime * 60;

    if (this.currentT >= 1) {
      this.currentT = 1;
      this.active = false;
    }

    const pos = this.path.getPoint(this.currentT);

    const segCount = this.controlPoints.length - 1;
    if (segCount > 0) {
      const rawIndex = Math.floor(this.currentT * segCount);
      const index = Math.min(rawIndex, segCount - 1);
      if (index > this.lastReachedIndex && this.onPointReached) {
        this.lastReachedIndex = index;
        this.onPointReached(index);
      }
    }

    return pos;
  }

  getProgress(): number {
    return this.currentT;
  }
}

export function generateGradientColors(startColor: string, endColor: string, steps: number): THREE.Color[] {
  const start = new THREE.Color(startColor);
  const end = new THREE.Color(endColor);
  const colors: THREE.Color[] = [];

  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const c = start.clone().lerp(end, t);
    colors.push(c);
  }

  return colors;
}
