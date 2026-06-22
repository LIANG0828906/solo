import * as THREE from 'three';
import type { MotionVector } from './opticalFlow';

const COLOR_BLUE = new THREE.Color(0x1e90ff);
const COLOR_RED = new THREE.Color(0xff4500);
const DEFAULT_MAX_MAGNITUDE = 10;
const MAX_TRAIL_SEGMENTS = 50;
const BUFFER_GROWTH_FACTOR = 1.5;
const MIN_BUFFER_CAPACITY = 1000;

interface ParticleState {
  px: number; py: number; pz: number;
  vx: number; vy: number; vz: number;
  cr: number; cg: number; cb: number;
  size: number;
  life: number;
  maxTrail: number;
  trailHead: number;
  trailLen: number;
}

export class ParticleSystem {
  private scene: THREE.Scene;
  private particles: ParticleState[] = [];
  private points!: THREE.Points;
  private pointsGeometry!: THREE.BufferGeometry;
  private lines!: THREE.LineSegments;
  private linesGeometry!: THREE.BufferGeometry;
  public particleCount: number;
  private particleCapacity: number;

  private positionBuffer!: Float32Array;
  private colorBuffer!: Float32Array;
  private sizeBuffer!: Float32Array;
  private linePositionBuffer!: Float32Array;
  private lineColorBuffer!: Float32Array;

  private trailX!: Float32Array;
  private trailY!: Float32Array;
  private trailZ!: Float32Array;
  private trailCapacity: number;

  private lastDrawRange = 0;
  private prevMaxMagnitude = DEFAULT_MAX_MAGNITUDE;
  private prevMADScale = DEFAULT_MAX_MAGNITUDE;

  constructor(scene: THREE.Scene, particleCount: number = 2000) {
    this.scene = scene;
    this.particleCount = particleCount;
    this.particleCapacity = Math.max(particleCount, MIN_BUFFER_CAPACITY);
    this.trailCapacity = this.particleCapacity * MAX_TRAIL_SEGMENTS;
    this.initBuffers();
    this.initParticles();
    console.log(`[ParticleSystem] 初始化完成, 粒子数: ${particleCount}, 容量: ${this.particleCapacity}, 尾迹缓冲: ${this.trailCapacity}`);
  }

  private initBuffers(): void {
    const cap = this.particleCapacity;
    const trailCap = this.trailCapacity;

    if (this.positionBuffer && this.positionBuffer.length >= cap * 3) {
      return;
    }

    this.positionBuffer = new Float32Array(cap * 3);
    this.colorBuffer = new Float32Array(cap * 3);
    this.sizeBuffer = new Float32Array(cap);

    this.trailX = new Float32Array(trailCap);
    this.trailY = new Float32Array(trailCap);
    this.trailZ = new Float32Array(trailCap);

    const maxLineVerts = cap * MAX_TRAIL_SEGMENTS * 2;
    this.linePositionBuffer = new Float32Array(maxLineVerts * 3);
    this.lineColorBuffer = new Float32Array(maxLineVerts * 3);

    if (this.pointsGeometry) {
      this.pointsGeometry.dispose();
      this.linesGeometry.dispose();
      this.scene.remove(this.points);
      this.scene.remove(this.lines);
    }

    this.pointsGeometry = new THREE.BufferGeometry();
    this.pointsGeometry.setAttribute('position', new THREE.BufferAttribute(this.positionBuffer, 3));
    this.pointsGeometry.setAttribute('color', new THREE.BufferAttribute(this.colorBuffer, 3));
    this.pointsGeometry.setAttribute('size', new THREE.BufferAttribute(this.sizeBuffer, 1));

    const pointsMaterial = new THREE.PointsMaterial({
      size: 6,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });

    this.points = new THREE.Points(this.pointsGeometry, pointsMaterial);
    this.scene.add(this.points);

    this.linesGeometry = new THREE.BufferGeometry();
    this.linesGeometry.setAttribute('position', new THREE.BufferAttribute(this.linePositionBuffer, 3));
    this.linesGeometry.setAttribute('color', new THREE.BufferAttribute(this.lineColorBuffer, 3));

    const linesMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      linewidth: 0.5
    });

    this.lines = new THREE.LineSegments(this.linesGeometry, linesMaterial);
    this.scene.add(this.lines);

    this.lastDrawRange = 0;
  }

  private ensureCapacity(newCount: number): void {
    if (newCount <= this.particleCapacity) return;

    const oldCapacity = this.particleCapacity;
    const oldParticles = this.particles.slice();

    this.particleCapacity = Math.max(
      Math.ceil(newCount * BUFFER_GROWTH_FACTOR),
      Math.ceil(oldCapacity * BUFFER_GROWTH_FACTOR),
      MIN_BUFFER_CAPACITY
    );
    this.trailCapacity = this.particleCapacity * MAX_TRAIL_SEGMENTS;

    console.log(`[ParticleSystem] 扩容: ${oldCapacity} → ${this.particleCapacity}`);

    this.initBuffers();
    this.initParticles();

    for (let i = 0; i < Math.min(oldParticles.length, this.particleCount); i++) {
      Object.assign(this.particles[i], oldParticles[i]);
      this.particles[i].trailHead = i * MAX_TRAIL_SEGMENTS;
    }
  }

  private initParticles(): void {
    this.particles = [];
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push({
        px: (Math.random() - 0.5) * 4,
        py: (Math.random() - 0.5) * 4,
        pz: Math.random() * 0.5,
        vx: 0, vy: 0, vz: 0,
        cr: COLOR_BLUE.r, cg: COLOR_BLUE.g, cb: COLOR_BLUE.b,
        size: 4 + Math.random() * 4,
        life: 0.5 + Math.random() * 0.5,
        maxTrail: 10,
        trailHead: i * MAX_TRAIL_SEGMENTS,
        trailLen: 0
      });
    }
  }

  private computeRobustMaxMagnitude(vectors: MotionVector[]): number {
    if (vectors.length === 0) return this.prevMaxMagnitude;

    const mags = vectors.map(v => v.magnitude).sort((a, b) => a - b);
    const n = mags.length;

    const median = n % 2 === 0
      ? (mags[n / 2 - 1] + mags[n / 2]) / 2
      : mags[Math.floor(n / 2)];

    const absDev = mags.map(m => Math.abs(m - median)).sort((a, b) => a - b);
    const mad = n % 2 === 0
      ? (absDev[n / 2 - 1] + absDev[n / 2]) / 2
      : absDev[Math.floor(n / 2)];

    const robustUpper = median + 3 * 1.4826 * mad;

    const p99 = mags[Math.min(Math.floor(n * 0.99), n - 1)];

    const dynamic = Math.max(Math.min(robustUpper, p99 * 1.1), median * 1.5, 1.0);

    this.prevMADScale = this.prevMADScale * 0.85 + dynamic * 0.15;
    this.prevMaxMagnitude = this.prevMADScale;

    return this.prevMaxMagnitude;
  }

  private mapMagnitudeToColor(magnitude: number, maxMag: number): { r: number; g: number; b: number } {
    const t = Math.min(magnitude / maxMag, 1);
    const r = COLOR_BLUE.r + (COLOR_RED.r - COLOR_BLUE.r) * t;
    const g = COLOR_BLUE.g + (COLOR_RED.g - COLOR_BLUE.g) * t;
    const b = COLOR_BLUE.b + (COLOR_RED.b - COLOR_BLUE.b) * t;
    const brightness = 0.6 + t * 0.4;
    return { r: r * brightness, g: g * brightness, b: b * brightness };
  }

  public update(vectors: MotionVector[], deltaTime: number): void {
    this.ensureCapacity(this.particleCount);

    const maxMag = this.computeRobustMaxMagnitude(vectors);
    const positions = this.positionBuffer;
    const colors = this.colorBuffer;
    const sizes = this.sizeBuffer;

    for (let i = 0; i < this.particleCount; i++) {
      const p = this.particles[i];

      if (vectors.length > 0) {
        const nearestIdx = this.findNearestVector(p.px, p.py, vectors);
        if (nearestIdx >= 0) {
          const v = vectors[nearestIdx];
          p.vx += v.vx * 0.02;
          p.vy += v.vy * 0.02;
          p.vz += v.magnitude * 0.03;

          const c = this.mapMagnitudeToColor(v.magnitude, maxMag);
          p.cr = c.r; p.cg = c.g; p.cb = c.b;
          p.maxTrail = Math.floor(10 + (v.magnitude / maxMag) * 40);
          p.life = Math.max(p.life, 0.5);
        } else {
          p.vx *= 0.95; p.vy *= 0.95; p.vz *= 0.95;
          p.vz -= 0.01;
          p.cr += (COLOR_BLUE.r - p.cr) * 0.05;
          p.cg += (COLOR_BLUE.g - p.cg) * 0.05;
          p.cb += (COLOR_BLUE.b - p.cb) * 0.05;
        }
      } else {
        p.vx *= 0.95; p.vy *= 0.95; p.vz *= 0.95;
        p.vz -= 0.01;
        p.cr += (COLOR_BLUE.r - p.cr) * 0.05;
        p.cg += (COLOR_BLUE.g - p.cg) * 0.05;
        p.cb += (COLOR_BLUE.b - p.cb) * 0.05;
      }

      const dt60 = deltaTime * 60;
      p.px += p.vx * dt60;
      p.py += p.vy * dt60;
      p.pz += p.vz * dt60;
      p.vx *= 0.97; p.vy *= 0.97; p.vz *= 0.97;

      const ringIdx = p.trailHead + (p.trailLen % MAX_TRAIL_SEGMENTS);
      if (ringIdx < this.trailCapacity) {
        this.trailX[ringIdx] = p.px;
        this.trailY[ringIdx] = p.py;
        this.trailZ[ringIdx] = p.pz;
      }
      p.trailLen++;
      if (p.trailLen > p.maxTrail) {
        p.trailLen = p.maxTrail;
      }

      p.life -= deltaTime;
      if (p.life <= 0 || p.pz < -1) {
        this.resetParticle(p, vectors, maxMag);
      }

      const i3 = i * 3;
      positions[i3] = p.px;
      positions[i3 + 1] = p.py;
      positions[i3 + 2] = p.pz;
      colors[i3] = p.cr;
      colors[i3 + 1] = p.cg;
      colors[i3 + 2] = p.cb;
      sizes[i] = p.size;
    }

    this.pointsGeometry.setDrawRange(0, this.particleCount);
    (this.pointsGeometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    (this.pointsGeometry.getAttribute('color') as THREE.BufferAttribute).needsUpdate = true;
    (this.pointsGeometry.getAttribute('size') as THREE.BufferAttribute).needsUpdate = true;

    this.updateTrailLines();
  }

  private findNearestVector(px: number, py: number, vectors: MotionVector[]): number {
    let bestIdx = -1;
    let bestDist = Infinity;

    for (let i = 0; i < vectors.length; i++) {
      const v = vectors[i];
      const dx = px - v.x * 2;
      const dy = py - v.y * 2;
      const dist = dx * dx + dy * dy;
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }

    return bestIdx;
  }

  private resetParticle(p: ParticleState, vectors: MotionVector[], maxMag: number): void {
    if (vectors.length > 0 && Math.random() < 0.7) {
      const v = vectors[Math.floor(Math.random() * vectors.length)];
      p.px = v.x * 2 + (Math.random() - 0.5) * 0.5;
      p.py = v.y * 2 + (Math.random() - 0.5) * 0.5;
      p.pz = (v.magnitude / maxMag) * 2;
      p.vx = v.vx * 0.02;
      p.vy = v.vy * 0.02;
      p.vz = v.magnitude * 0.02;
      const c = this.mapMagnitudeToColor(v.magnitude, maxMag);
      p.cr = c.r; p.cg = c.g; p.cb = c.b;
      p.maxTrail = Math.floor(10 + (v.magnitude / maxMag) * 40);
    } else {
      p.px = (Math.random() - 0.5) * 4;
      p.py = (Math.random() - 0.5) * 4;
      p.pz = Math.random() * 0.5;
      p.vx = 0; p.vy = 0; p.vz = 0;
      p.cr = COLOR_BLUE.r; p.cg = COLOR_BLUE.g; p.cb = COLOR_BLUE.b;
      p.maxTrail = 10;
    }
    p.trailLen = 0;
    p.life = 0.5 + Math.random() * 0.5;
  }

  private updateTrailLines(): void {
    const lp = this.linePositionBuffer;
    const lc = this.lineColorBuffer;
    let vi = 0;
    const maxLines = this.particleCapacity * MAX_TRAIL_SEGMENTS;

    for (let i = 0; i < this.particleCount && vi < maxLines; i++) {
      const p = this.particles[i];
      const len = p.trailLen;
      if (len < 2) continue;

      const start = (p.trailLen > p.maxTrail) ? (p.trailLen - p.maxTrail) : 0;

      for (let t = start; t < p.trailLen - 1 && vi < maxLines; t++) {
        const idx0 = p.trailHead + (t % MAX_TRAIL_SEGMENTS);
        const idx1 = p.trailHead + ((t + 1) % MAX_TRAIL_SEGMENTS);

        if (idx0 >= this.trailCapacity || idx1 >= this.trailCapacity) continue;

        const alpha = (t - start) / (p.trailLen - start);

        const vi3 = vi * 3;
        lp[vi3] = this.trailX[idx0];
        lp[vi3 + 1] = this.trailY[idx0];
        lp[vi3 + 2] = this.trailZ[idx0];
        lp[vi3 + 3] = this.trailX[idx1];
        lp[vi3 + 4] = this.trailY[idx1];
        lp[vi3 + 5] = this.trailZ[idx1];

        const r = p.cr * alpha;
        const g = p.cg * alpha;
        const b = p.cb * alpha;

        lc[vi3] = r;
        lc[vi3 + 1] = g;
        lc[vi3 + 2] = b;
        lc[vi3 + 3] = r * 0.9;
        lc[vi3 + 4] = g * 0.9;
        lc[vi3 + 5] = b * 0.9;

        vi++;
      }
    }

    const prevBytes = this.lastDrawRange * 6;
    const currBytes = vi * 6;
    if (vi < this.lastDrawRange) {
      for (let i = currBytes; i < prevBytes; i++) {
        lp[i] = 0;
        lc[i] = 0;
      }
    }
    this.lastDrawRange = vi;

    this.linesGeometry.setDrawRange(0, vi * 2);
    (this.linesGeometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    (this.linesGeometry.getAttribute('color') as THREE.BufferAttribute).needsUpdate = true;
  }

  public resizeParticleCount(newCount: number): void {
    if (newCount === this.particleCount) return;

    const oldCount = this.particleCount;
    this.particleCount = newCount;

    if (newCount > this.particleCapacity) {
      this.ensureCapacity(newCount);
      console.log(`[ParticleSystem] 粒子数扩容: ${oldCount} → ${newCount}`);
      return;
    }

    if (newCount > oldCount) {
      for (let i = oldCount; i < newCount; i++) {
        if (i < this.particles.length) {
          Object.assign(this.particles[i], {
            px: (Math.random() - 0.5) * 4,
            py: (Math.random() - 0.5) * 4,
            pz: Math.random() * 0.5,
            vx: 0, vy: 0, vz: 0,
            cr: COLOR_BLUE.r, cg: COLOR_BLUE.g, cb: COLOR_BLUE.b,
            size: 4 + Math.random() * 4,
            life: 0.5 + Math.random() * 0.5,
            maxTrail: 10,
            trailHead: i * MAX_TRAIL_SEGMENTS,
            trailLen: 0
          });
        } else {
          this.particles.push({
            px: (Math.random() - 0.5) * 4,
            py: (Math.random() - 0.5) * 4,
            pz: Math.random() * 0.5,
            vx: 0, vy: 0, vz: 0,
            cr: COLOR_BLUE.r, cg: COLOR_BLUE.g, cb: COLOR_BLUE.b,
            size: 4 + Math.random() * 4,
            life: 0.5 + Math.random() * 0.5,
            maxTrail: 10,
            trailHead: i * MAX_TRAIL_SEGMENTS,
            trailLen: 0
          });
        }
      }
    }

    this.particles.length = newCount;
    console.log(`[ParticleSystem] 粒子数更新为: ${newCount}, 容量: ${this.particleCapacity}`);
  }

  public reset(): void {
    this.initParticles();
    this.lastDrawRange = 0;
    console.log('[ParticleSystem] 粒子系统已重置');
  }
}
