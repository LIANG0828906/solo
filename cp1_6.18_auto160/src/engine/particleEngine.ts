import { v4 as uuidv4 } from 'uuid';
import type {
  EmotionType,
  ParticleData,
  ParticleConfig,
  EmotionAnalysisResult,
  EmotionSegment
} from '../types';
import {
  DEFAULT_PARTICLE_CONFIG,
  EMOTION_COLORS,
  EMOTION_ORDER
} from '../types';

type Vec3 = { x: number; y: number; z: number };

export interface EmotionCluster {
  emotion: EmotionType;
  center: Vec3;
  radius: number;
  count: number;
  segmentMap: Map<string, EmotionSegment>;
}

export interface Ray3D {
  origin: Vec3;
  direction: Vec3;
}

export interface HoverQueryResult {
  particles: ParticleData[];
  dominantEmotion: EmotionType | null;
  dominantSegment: EmotionSegment | null;
  point: Vec3 | null;
}

const EMOTION_POSITIONS: Record<EmotionType, Vec3> = {
  joy: { x: 4.5, y: 3.0, z: -1.5 },
  sadness: { x: -4.5, y: -1.5, z: 2.0 },
  anger: { x: 3.0, y: -2.5, z: 3.5 },
  calm: { x: -3.5, y: 2.0, z: -3.0 }
};

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

class SimplexNoise {
  private perm: number[];

  constructor(seed = Math.random() * 10000) {
    this.perm = [];
    for (let i = 0; i < 512; i++) {
      this.perm[i] = Math.floor(Math.sin(seed + i) * 10000) % 256;
      if (this.perm[i] < 0) this.perm[i] += 256;
    }
  }

  noise3D(x: number, y: number, z: number): number {
    const ix = Math.floor(x) & 255;
    const iy = Math.floor(y) & 255;
    const iz = Math.floor(z) & 255;
    const fx = x - Math.floor(x);
    const fy = y - Math.floor(y);
    const fz = z - Math.floor(z);
    const u = fx * fx * (3 - 2 * fx);
    const v = fy * fy * (3 - 2 * fy);
    const w = fz * fz * (3 - 2 * fz);
    const hash = (a: number, b: number, c: number) =>
      this.perm[(this.perm[(this.perm[a] + b) & 255] + c) & 255] / 255;
    const c000 = hash(ix, iy, iz);
    const c100 = hash(ix + 1, iy, iz);
    const c010 = hash(ix, iy + 1, iz);
    const c110 = hash(ix + 1, iy + 1, iz);
    const c001 = hash(ix, iy, iz + 1);
    const c101 = hash(ix + 1, iy, iz + 1);
    const c011 = hash(ix, iy + 1, iz + 1);
    const c111 = hash(ix + 1, iy + 1, iz + 1);
    const x00 = lerp(c000, c100, u);
    const x10 = lerp(c010, c110, u);
    const x01 = lerp(c001, c101, u);
    const x11 = lerp(c011, c111, u);
    const y0 = lerp(x00, x10, v);
    const y1 = lerp(x01, x11, v);
    return lerp(y0, y1, w) * 2 - 1;
  }
}

export class ParticleEngine {
  private particles: ParticleData[] = [];
  private clusters: Map<EmotionType, EmotionCluster> = new Map();
  private segmentsById: Map<string, EmotionSegment> = new Map();
  private config: ParticleConfig;
  private noise: SimplexNoise;
  private time = 0;
  private burstQueue: Array<{ origin: Vec3; radius: number; maxRadius: number; progress: number }> = [];
  private hoveredEmotion: EmotionType | null = null;
  private selectedEmotion: EmotionType | null = null;

  constructor(config: ParticleConfig = DEFAULT_PARTICLE_CONFIG) {
    this.config = { ...config };
    this.noise = new SimplexNoise();
  }

  getParticles(): readonly ParticleData[] {
    return this.particles;
  }

  getClusters(): ReadonlyMap<EmotionType, EmotionCluster> {
    return this.clusters;
  }

  getConfig(): ParticleConfig {
    return { ...this.config };
  }

  setHoveredEmotion(emotion: EmotionType | null): void {
    this.hoveredEmotion = emotion;
  }

  setSelectedEmotion(emotion: EmotionType | null): void {
    this.selectedEmotion = emotion;
    for (const p of this.particles) {
      if (emotion === null) {
        p.targetOpacity = 1.0;
      } else if (p.emotion === emotion) {
        p.targetOpacity = 1.0;
      } else {
        p.targetOpacity = this.config.dimOpacity;
      }
    }
  }

  buildFromAnalysis(analysis: EmotionAnalysisResult): void {
    this.particles.length = 0;
    this.clusters.clear();
    this.segmentsById.clear();

    for (const seg of analysis.segments) {
      this.segmentsById.set(seg.id, seg);
    }

    const totalWeight = EMOTION_ORDER.reduce(
      (sum, e) => sum + (analysis.weights[e] || 0),
      0
    );

    if (totalWeight === 0) {
      this.buildDefaultParticles();
      return;
    }

    for (const emotion of EMOTION_ORDER) {
      const weight = analysis.weights[emotion] || 0;
      if (weight <= 0) continue;

      const proportion = weight / totalWeight;
      const targetCount = Math.floor(this.config.maxParticles * proportion);
      if (targetCount <= 0) continue;

      const center = EMOTION_POSITIONS[emotion];
      const radius = 2.5 + proportion * 2.5;

      const emotionSegments = analysis.segments.filter(s => s.emotion === emotion);
      const segmentMap = new Map<string, EmotionSegment>();
      for (const s of emotionSegments) segmentMap.set(s.id, s);

      this.clusters.set(emotion, {
        emotion,
        center: { ...center },
        radius,
        count: targetCount,
        segmentMap
      });

      const segPool = emotionSegments.length > 0 ? emotionSegments : [{ id: 'default', emotion, weight: 0.5 } as EmotionSegment];

      for (let i = 0; i < targetCount; i++) {
        const seg = segPool[Math.floor(Math.random() * segPool.length)];
        const pos = this.sphericalRandom(center, radius);
        const size = randomRange(this.config.minSize, this.config.maxSize);
        const speed = randomRange(this.config.minSpeed, this.config.maxSpeed);
        const angle1 = Math.random() * Math.PI * 2;
        const angle2 = Math.random() * Math.PI * 2;

        this.particles.push({
          id: uuidv4(),
          emotion,
          basePosition: { ...pos },
          position: { ...pos },
          velocity: {
            x: Math.cos(angle1) * Math.sin(angle2) * speed,
            y: Math.sin(angle1) * Math.sin(angle2) * speed,
            z: Math.cos(angle2) * speed
          },
          size,
          baseSize: size,
          colorHex: EMOTION_COLORS[emotion].hex,
          opacity: 1.0,
          targetOpacity: 1.0,
          segmentId: seg.id,
          clusterRadius: radius,
          phase: Math.random() * Math.PI * 2
        });
      }
    }
  }

  private buildDefaultParticles(): void {
    const perEmotion = Math.floor(this.config.maxParticles / 4);

    for (const emotion of EMOTION_ORDER) {
      const center = EMOTION_POSITIONS[emotion];
      const radius = 2.2;

      this.clusters.set(emotion, {
        emotion,
        center: { ...center },
        radius,
        count: perEmotion,
        segmentMap: new Map()
      });

      for (let i = 0; i < perEmotion; i++) {
        const pos = this.sphericalRandom(center, radius);
        const size = randomRange(this.config.minSize, this.config.maxSize);
        const speed = randomRange(this.config.minSpeed, this.config.maxSpeed);
        const angle1 = Math.random() * Math.PI * 2;
        const angle2 = Math.random() * Math.PI * 2;

        this.particles.push({
          id: uuidv4(),
          emotion,
          basePosition: { ...pos },
          position: { ...pos },
          velocity: {
            x: Math.cos(angle1) * Math.sin(angle2) * speed,
            y: Math.sin(angle1) * Math.sin(angle2) * speed,
            z: Math.cos(angle2) * speed
          },
          size,
          baseSize: size,
          colorHex: EMOTION_COLORS[emotion].hex,
          opacity: 1.0,
          targetOpacity: 1.0,
          segmentId: 'default',
          clusterRadius: radius,
          phase: Math.random() * Math.PI * 2
        });
      }
    }
  }

  private sphericalRandom(center: Vec3, radius: Vec3 | number): Vec3 {
    const r = typeof radius === 'number' ? radius : radius.x;
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const rr = Math.cbrt(Math.random()) * r;
    return {
      x: center.x + rr * Math.sin(phi) * Math.cos(theta),
      y: center.y + rr * Math.sin(phi) * Math.sin(theta),
      z: center.z + rr * Math.cos(phi)
    };
  }

  triggerBurst(origin: Vec3): void {
    this.burstQueue.push({
      origin: { ...origin },
      radius: 0,
      maxRadius: 25,
      progress: 0
    });
  }

  update(deltaTime: number): void {
    this.time += deltaTime;
    const t = this.time;

    for (let i = this.burstQueue.length - 1; i >= 0; i--) {
      const burst = this.burstQueue[i];
      burst.progress += deltaTime * 0.9;
      burst.radius = burst.progress * burst.maxRadius;
      if (burst.progress >= 1.0) {
        this.burstQueue.splice(i, 1);
      }
    }

    for (const p of this.particles) {
      const cluster = this.clusters.get(p.emotion);
      if (!cluster) continue;

      const nScale = 0.35;
      const nx = this.noise.noise3D(
        p.position.x * nScale + t * 0.15,
        p.position.y * nScale + t * 0.12,
        p.position.z * nScale + t * 0.18
      );
      const ny = this.noise.noise3D(
        p.position.y * nScale + t * 0.20,
        p.position.z * nScale + t * 0.10,
        p.position.x * nScale + t * 0.22
      );
      const nz = this.noise.noise3D(
        p.position.z * nScale + t * 0.08,
        p.position.x * nScale + t * 0.25,
        p.position.y * nScale + t * 0.14
      );

      const brownian = 0.015;
      p.velocity.x += nx * brownian;
      p.velocity.y += ny * brownian;
      p.velocity.z += nz * brownian;

      const dx = cluster.center.x - p.position.x;
      const dy = cluster.center.y - p.position.y;
      const dz = cluster.center.z - p.position.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const spring = 0.0025;
      if (dist > 0) {
        p.velocity.x += (dx / dist) * spring * Math.min(dist, cluster.radius * 1.5);
        p.velocity.y += (dy / dist) * spring * Math.min(dist, cluster.radius * 1.5);
        p.velocity.z += (dz / dist) * spring * Math.min(dist, cluster.radius * 1.5);
      }

      const damping = 0.985;
      p.velocity.x *= damping;
      p.velocity.y *= damping;
      p.velocity.z *= damping;

      const speed = Math.sqrt(
        p.velocity.x * p.velocity.x +
        p.velocity.y * p.velocity.y +
        p.velocity.z * p.velocity.z
      );
      const maxSpeed = this.config.maxSpeed * (
        (this.hoveredEmotion === p.emotion) ? 2.2 : 1.0
      );
      if (speed > maxSpeed && speed > 0) {
        const s = maxSpeed / speed;
        p.velocity.x *= s;
        p.velocity.y *= s;
        p.velocity.z *= s;
      }

      p.position.x += p.velocity.x;
      p.position.y += p.velocity.y;
      p.position.z += p.velocity.z;

      const pulse = 1 + Math.sin(t * 2.2 + p.phase) * 0.08;
      const hoverBoost = (this.hoveredEmotion === p.emotion) ? this.config.hoverScale : 1.0;
      p.size = p.baseSize * pulse * hoverBoost;

      for (const burst of this.burstQueue) {
        const bdx = p.position.x - burst.origin.x;
        const bdy = p.position.y - burst.origin.y;
        const bdz = p.position.z - burst.origin.z;
        const bdist = Math.sqrt(bdx * bdx + bdy * bdy + bdz * bdz);
        const waveWidth = 2.5;
        if (Math.abs(bdist - burst.radius) < waveWidth) {
          const intensity = 1 - Math.abs(bdist - burst.radius) / waveWidth;
          if (bdist > 0) {
            const force = intensity * 0.4;
            p.position.x += (bdx / bdist) * force;
            p.position.y += (bdy / bdist) * force;
            p.position.z += (bdz / bdist) * force;
          }
        }
      }

      p.opacity = lerp(p.opacity, p.targetOpacity, 0.08);
    }
  }

  queryHover(ray: Ray3D, maxDist = 30): HoverQueryResult {
    const ox = ray.origin.x, oy = ray.origin.y, oz = ray.origin.z;
    const dx = ray.direction.x, dy = ray.direction.y, dz = ray.direction.z;
    const dlen = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (dlen === 0) return { particles: [], dominantEmotion: null, dominantSegment: null, point: null };
    const ndx = dx / dlen, ndy = dy / dlen, ndz = dz / dlen;

    let nearestCluster: EmotionCluster | null = null;
    let nearestClusterDist = Infinity;
    let nearestPointOnRay: Vec3 | null = null;

    for (const cluster of this.clusters.values()) {
      const cx = cluster.center.x - ox;
      const cy = cluster.center.y - oy;
      const cz = cluster.center.z - oz;
      const t = cx * ndx + cy * ndy + cz * ndz;
      if (t < 0 || t > maxDist) continue;
      const px = ox + ndx * t;
      const py = oy + ndy * t;
      const pz = oz + ndz * t;
      const ddx = cluster.center.x - px;
      const ddy = cluster.center.y - py;
      const ddz = cluster.center.z - pz;
      const perpDist = Math.sqrt(ddx * ddx + ddy * ddy + ddz * ddz);
      const hitRadius = cluster.radius * 1.2;
      if (perpDist <= hitRadius && t < nearestClusterDist) {
        nearestClusterDist = t;
        nearestCluster = cluster;
        nearestPointOnRay = { x: px, y: py, z: pz };
      }
    }

    if (!nearestCluster || !nearestPointOnRay) {
      return { particles: [], dominantEmotion: null, dominantSegment: null, point: null };
    }

    const found: ParticleData[] = [];
    const segmentScores: Map<string, number> = new Map();
    let emotionScore = 0;

    const queryRadius = nearestCluster.radius * 0.8;
    for (const p of this.particles) {
      if (p.emotion !== nearestCluster.emotion) continue;
      const ex = p.position.x - nearestPointOnRay.x;
      const ey = p.position.y - nearestPointOnRay.y;
      const ez = p.position.z - nearestPointOnRay.z;
      const dist = Math.sqrt(ex * ex + ey * ey + ez * ez);
      if (dist < queryRadius) {
        found.push(p);
        emotionScore += p.size;
        const segId = p.segmentId;
        segmentScores.set(segId, (segmentScores.get(segId) || 0) + p.size);
      }
    }

    let dominantSegment: EmotionSegment | null = null;
    let bestSegScore = -1;
    for (const [segId, score] of segmentScores.entries()) {
      if (score > bestSegScore) {
        bestSegScore = score;
        const seg = this.segmentsById.get(segId);
        if (seg) dominantSegment = seg;
      }
    }

    return {
      particles: found,
      dominantEmotion: nearestCluster.emotion,
      dominantSegment,
      point: nearestPointOnRay
    };
  }

  getSegmentById(id: string): EmotionSegment | undefined {
    return this.segmentsById.get(id);
  }
}
