import * as THREE from 'three';
import type { MotionVector } from './opticalFlow';

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  size: number;
  trail: THREE.Vector3[];
  life: number;
  maxTrail: number;
}

const COLOR_BLUE = new THREE.Color(0x1e90ff);
const COLOR_RED = new THREE.Color(0xff4500);
const MAX_MAGNITUDE = 10;

export class ParticleSystem {
  private scene: THREE.Scene;
  private particles: Particle[] = [];
  private points!: THREE.Points;
  private pointsGeometry!: THREE.BufferGeometry;
  private lines!: THREE.LineSegments;
  private linesGeometry!: THREE.BufferGeometry;
  public particleCount: number;
  private maxTrailSegments = 10;

  constructor(scene: THREE.Scene, particleCount: number = 2000) {
    this.scene = scene;
    this.particleCount = particleCount;
    this.initGeometry();
    this.initParticles();
  }

  private initGeometry(): void {
    this.pointsGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particleCount * 3);
    const colors = new Float32Array(this.particleCount * 3);
    const sizes = new Float32Array(this.particleCount);

    this.pointsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.pointsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.pointsGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

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
    const maxLinePositions = this.particleCount * this.maxTrailSegments * 6;
    const linePositions = new Float32Array(maxLinePositions);
    const lineColors = new Float32Array(maxLinePositions);

    this.linesGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    this.linesGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

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
  }

  private initParticles(): void {
    this.particles = [];
    for (let i = 0; i < this.particleCount; i++) {
      const particle: Particle = {
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 4,
          (Math.random() - 0.5) * 4,
          Math.random() * 0.5
        ),
        velocity: new THREE.Vector3(0, 0, 0),
        color: COLOR_BLUE.clone(),
        size: 4 + Math.random() * 4,
        trail: [],
        life: 0.5 + Math.random() * 0.5,
        maxTrail: 10
      };
      this.particles.push(particle);
    }
  }

  private mapMagnitudeToColor(magnitude: number): THREE.Color {
    const t = Math.min(magnitude / MAX_MAGNITUDE, 1);
    const color = COLOR_BLUE.clone().lerp(COLOR_RED, t);
    const brightness = 0.6 + t * 0.4;
    color.multiplyScalar(brightness);
    return color;
  }

  public update(vectors: MotionVector[], deltaTime: number): void {
    const posAttr = this.pointsGeometry.getAttribute('position') as THREE.BufferAttribute;
    const colorAttr = this.pointsGeometry.getAttribute('color') as THREE.BufferAttribute;
    const sizeAttr = this.pointsGeometry.getAttribute('size') as THREE.BufferAttribute;
    const positions = posAttr.array as Float32Array;
    const colors = colorAttr.array as Float32Array;
    const sizes = sizeAttr.array as Float32Array;

    for (let i = 0; i < this.particleCount; i++) {
      const p = this.particles[i];

      let vector: MotionVector | null = null;
      if (vectors.length > 0) {
        const nearestIdx = this.findNearestVector(p.position, vectors);
        if (nearestIdx >= 0) {
          vector = vectors[nearestIdx];
        }
      }

      if (vector) {
        const influence = 1.0;
        p.velocity.x += vector.vx * 0.02 * influence;
        p.velocity.y += vector.vy * 0.02 * influence;
        p.velocity.z += vector.magnitude * 0.03 * influence;

        p.color.copy(this.mapMagnitudeToColor(vector.magnitude));
        p.maxTrail = Math.floor(10 + (vector.magnitude / MAX_MAGNITUDE) * 40);

        p.life = Math.max(p.life, 0.5);
      } else {
        p.velocity.multiplyScalar(0.95);
        p.velocity.z -= 0.01;
        p.color.lerp(COLOR_BLUE, 0.05);
      }

      p.position.add(p.velocity.clone().multiplyScalar(deltaTime * 60));
      p.velocity.multiplyScalar(0.97);

      p.trail.push(p.position.clone());
      while (p.trail.length > p.maxTrail) {
        p.trail.shift();
      }

      p.life -= deltaTime;
      if (p.life <= 0 || p.position.z < -1) {
        this.resetParticle(p, vectors);
      }

      positions[i * 3] = p.position.x;
      positions[i * 3 + 1] = p.position.y;
      positions[i * 3 + 2] = p.position.z;
      colors[i * 3] = p.color.r;
      colors[i * 3 + 1] = p.color.g;
      colors[i * 3 + 2] = p.color.b;
      sizes[i] = p.size;
    }

    posAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;

    this.updateTrailLines();
  }

  private findNearestVector(pos: THREE.Vector3, vectors: MotionVector[]): number {
    let bestIdx = -1;
    let bestDist = Infinity;

    for (let i = 0; i < vectors.length; i++) {
      const v = vectors[i];
      const dx = pos.x - v.x * 2;
      const dy = pos.y - v.y * 2;
      const dist = dx * dx + dy * dy;
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }

    return bestIdx;
  }

  private resetParticle(p: Particle, vectors: MotionVector[]): void {
    if (vectors.length > 0 && Math.random() < 0.7) {
      const v = vectors[Math.floor(Math.random() * vectors.length)];
      p.position.set(
        v.x * 2 + (Math.random() - 0.5) * 0.5,
        v.y * 2 + (Math.random() - 0.5) * 0.5,
        (v.magnitude / MAX_MAGNITUDE) * 2
      );
      p.velocity.set(v.vx * 0.02, v.vy * 0.02, v.magnitude * 0.02);
      p.color.copy(this.mapMagnitudeToColor(v.magnitude));
      p.maxTrail = Math.floor(10 + (v.magnitude / MAX_MAGNITUDE) * 40);
    } else {
      p.position.set(
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4,
        Math.random() * 0.5
      );
      p.velocity.set(0, 0, 0);
      p.color.copy(COLOR_BLUE);
      p.maxTrail = 10;
    }
    p.trail = [];
    p.life = 0.5 + Math.random() * 0.5;
  }

  private updateTrailLines(): void {
    const linePosAttr = this.linesGeometry.getAttribute('position') as THREE.BufferAttribute;
    const lineColorAttr = this.linesGeometry.getAttribute('color') as THREE.BufferAttribute;
    const linePositions = linePosAttr.array as Float32Array;
    const lineColors = lineColorAttr.array as Float32Array;

    let lineIndex = 0;
    const maxLines = this.particleCount * this.maxTrailSegments;

    for (let p = 0; p < this.particleCount && lineIndex < maxLines; p++) {
      const particle = this.particles[p];
      const trail = particle.trail;

      for (let t = 0; t < trail.length - 1 && lineIndex < maxLines; t++) {
        const p0 = trail[t];
        const p1 = trail[t + 1];
        const alpha = t / trail.length;

        linePositions[lineIndex * 6] = p0.x;
        linePositions[lineIndex * 6 + 1] = p0.y;
        linePositions[lineIndex * 6 + 2] = p0.z;
        linePositions[lineIndex * 6 + 3] = p1.x;
        linePositions[lineIndex * 6 + 4] = p1.y;
        linePositions[lineIndex * 6 + 5] = p1.z;

        const r = particle.color.r * alpha;
        const g = particle.color.g * alpha;
        const b = particle.color.b * alpha;

        lineColors[lineIndex * 6] = r;
        lineColors[lineIndex * 6 + 1] = g;
        lineColors[lineIndex * 6 + 2] = b;
        lineColors[lineIndex * 6 + 3] = r * 0.9;
        lineColors[lineIndex * 6 + 4] = g * 0.9;
        lineColors[lineIndex * 6 + 5] = b * 0.9;

        lineIndex++;
      }
    }

    for (let i = lineIndex * 6; i < linePositions.length; i++) {
      linePositions[i] = 0;
      lineColors[i] = 0;
    }

    this.linesGeometry.setDrawRange(0, lineIndex * 2);
    linePosAttr.needsUpdate = true;
    lineColorAttr.needsUpdate = true;
  }

  public resizeParticleCount(newCount: number): void {
    if (newCount === this.particleCount) return;

    this.scene.remove(this.points);
    this.scene.remove(this.lines);
    this.pointsGeometry.dispose();
    this.linesGeometry.dispose();
    (this.points.material as THREE.Material).dispose();
    (this.lines.material as THREE.Material).dispose();

    this.particleCount = newCount;
    this.initGeometry();
    this.initParticles();
  }

  public reset(): void {
    this.initParticles();
  }
}
