import * as THREE from 'three';

export interface EmotionParams {
  score: number;
  keywords: string[];
}

interface ParticleData {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  life: number;
  maxLife: number;
  opacity: number;
  shapeIndex: number;
  size: number;
}

type EmotionType = 'positive' | 'negative' | 'neutral';

const PARTICLE_COUNT = 2000;
const CONNECTION_MAX = 800;
const CONNECTION_DISTANCE = 30;
const PARTICLE_LIFETIME = 5;

const POSITIVE_COLORS = [
  new THREE.Color(0xff9f43),
  new THREE.Color(0xffd700),
  new THREE.Color(0xff6b9d),
];
const NEGATIVE_COLORS = [
  new THREE.Color(0x4a69bd),
  new THREE.Color(0x8854d0),
  new THREE.Color(0x95a5a6),
];
const NEUTRAL_COLORS = [
  new THREE.Color(0x00d2d3),
  new THREE.Color(0x55efc4),
  new THREE.Color(0xdfe6e9),
];

export class ParticleSystem {
  private particles: ParticleData[] = [];
  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;
  private points: THREE.Points;
  private lineGeometry: THREE.BufferGeometry;
  private lineMaterial: THREE.LineBasicMaterial;
  private lines: THREE.LineSegments;
  private emotionType: EmotionType = 'neutral';
  private emotionScore: number = 0;
  private keywordCount: number = 0;
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.geometry = new THREE.BufferGeometry();
    this.material = new THREE.PointsMaterial({
      size: 2.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);

    this.lineGeometry = new THREE.BufferGeometry();
    this.lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.lines = new THREE.LineSegments(this.lineGeometry, this.lineMaterial);
    this.scene.add(this.lines);

    this.initParticles();
  }

  private initParticles(): void {
    this.particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      this.particles.push(this.createParticle());
    }
    this.updateGeometry();
  }

  private createParticle(overrideLife?: number): ParticleData {
    const emotionType = this.emotionType;
    const colors = emotionType === 'positive' ? POSITIVE_COLORS
      : emotionType === 'negative' ? NEGATIVE_COLORS
      : NEUTRAL_COLORS;

    const color = colors[Math.floor(Math.random() * colors.length)].clone();
    color.offsetHSL((Math.random() - 0.5) * 0.08, 0, (Math.random() - 0.5) * 0.05);

    let position: THREE.Vector3;
    let velocity: THREE.Vector3;

    const spread = 120;
    if (emotionType === 'positive') {
      position = new THREE.Vector3(
        (Math.random() - 0.5) * spread,
        -spread / 2 - Math.random() * 30,
        (Math.random() - 0.5) * spread
      );
      const speed = 0.5 + Math.random() * 1.0;
      velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.3,
        speed,
        (Math.random() - 0.5) * 0.3
      );
    } else if (emotionType === 'negative') {
      position = new THREE.Vector3(
        (Math.random() - 0.5) * spread,
        spread / 2 + Math.random() * 30,
        (Math.random() - 0.5) * spread
      );
      const speed = -(0.2 + Math.random() * 0.6);
      velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.2,
        speed,
        (Math.random() - 0.5) * 0.2
      );
    } else {
      position = new THREE.Vector3(
        (Math.random() - 0.5) * spread,
        (Math.random() - 0.5) * spread * 0.6,
        (Math.random() - 0.5) * spread
      );
      const speed = 0.1 + Math.random() * 0.3;
      velocity = new THREE.Vector3(
        (Math.random() - 0.5) * speed,
        (Math.random() - 0.5) * speed,
        (Math.random() - 0.5) * speed
      );
    }

    const maxLife = PARTICLE_LIFETIME;
    const life = overrideLife !== undefined ? overrideLife : Math.random() * maxLife;
    const shapeIndex = Math.floor(Math.random() * Math.max(1, this.keywordCount));

    return {
      position,
      velocity,
      color,
      life,
      maxLife,
      opacity: 0.9,
      shapeIndex: shapeIndex % 5,
      size: 1.5 + Math.random() * 2.0,
    };
  }

  setEmotion(params: EmotionParams): void {
    this.emotionScore = params.score;
    this.keywordCount = params.keywords.length || 3;

    if (params.score > 0.3) {
      this.emotionType = 'positive';
    } else if (params.score < -0.3) {
      this.emotionType = 'negative';
    } else {
      this.emotionType = 'neutral';
    }

    const positiveRatio = this.emotionType === 'positive' ? 0.7
      : this.emotionType === 'negative' ? 0.15 : 0.3;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = this.particles[i];
      const isWarm = i / PARTICLE_COUNT < positiveRatio;
      const colors = isWarm ? POSITIVE_COLORS
        : this.emotionType === 'negative' ? NEGATIVE_COLORS : NEUTRAL_COLORS;
      const targetColor = colors[Math.floor(Math.random() * colors.length)];
      p.color.lerp(targetColor, 0.6);

      if (isWarm) {
        if (p.velocity.y < 0.3) {
          p.velocity.y = 0.5 + Math.random() * 1.0;
        }
      } else if (this.emotionType === 'negative') {
        if (p.velocity.y > -0.1) {
          p.velocity.y = -(0.2 + Math.random() * 0.6);
        }
      }

      p.shapeIndex = (i % Math.max(1, this.keywordCount)) % 5;
    }
  }

  update(delta: number): void {
    const halfSpread = 90;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = this.particles[i];
      p.life += delta;

      if (this.emotionType === 'neutral') {
        p.velocity.x += (Math.random() - 0.5) * 0.08;
        p.velocity.y += (Math.random() - 0.5) * 0.08;
        p.velocity.z += (Math.random() - 0.5) * 0.08;
        p.velocity.multiplyScalar(0.98);
      }

      p.position.addScaledVector(p.velocity, delta);

      if (p.life >= p.maxLife) {
        const newP = this.createParticle(0);
        this.particles[i] = newP;
        continue;
      }

      const lifeRatio = p.life / p.maxLife;
      if (lifeRatio > 0.7) {
        p.opacity = 0.9 * (1 - (lifeRatio - 0.7) / 0.3);
      } else {
        p.opacity = Math.min(0.9, lifeRatio / 0.1 * 0.9);
      }

      if (Math.abs(p.position.x) > halfSpread) p.velocity.x *= -0.8;
      if (Math.abs(p.position.y) > halfSpread) p.velocity.y *= -0.8;
      if (Math.abs(p.position.z) > halfSpread) p.velocity.z *= -0.8;
    }

    this.updateGeometry();
    this.updateConnections();
  }

  private updateGeometry(): void {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = this.particles[i];
      positions[i * 3] = p.position.x;
      positions[i * 3 + 1] = p.position.y;
      positions[i * 3 + 2] = p.position.z;
      const c = p.color.clone();
      c.multiplyScalar(p.opacity);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
      sizes[i] = p.size * (this.getShapeScale(p.shapeIndex));
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
  }

  private getShapeScale(index: number): number {
    switch (index % 5) {
      case 0: return 1.0;
      case 1: return 1.3;
      case 2: return 1.1;
      case 3: return 0.9;
      case 4: return 0.85;
      default: return 1.0;
    }
  }

  private updateConnections(): void {
    const step = Math.max(1, Math.floor(PARTICLE_COUNT / 400));
    const candidates: { i: number; j: number; dist: number }[] = [];

    for (let i = 0; i < PARTICLE_COUNT; i += step) {
      const a = this.particles[i];
      if (a.opacity < 0.1) continue;
      for (let j = i + step; j < PARTICLE_COUNT; j += step) {
        const b = this.particles[j];
        if (b.opacity < 0.1) continue;
        const dx = a.position.x - b.position.x;
        const dy = a.position.y - b.position.y;
        const dz = a.position.z - b.position.z;
        const distSq = dx * dx + dy * dy + dz * dz;
        if (distSq < CONNECTION_DISTANCE * CONNECTION_DISTANCE) {
          candidates.push({ i, j, dist: Math.sqrt(distSq) });
        }
      }
    }

    candidates.sort((a, b) => a.dist - b.dist);
    const limited = candidates.slice(0, CONNECTION_MAX);

    const linePositions = new Float32Array(limited.length * 6);
    const lineColors = new Float32Array(limited.length * 6);

    for (let k = 0; k < limited.length; k++) {
      const { i, j, dist } = limited[k];
      const a = this.particles[i];
      const b = this.particles[j];
      const alpha = 0.4 * (1 - dist / CONNECTION_DISTANCE);
      const mixR = (a.color.r + b.color.r) / 2;
      const mixG = (a.color.g + b.color.g) / 2;
      const mixB = (a.color.b + b.color.b) / 2;

      linePositions[k * 6] = a.position.x;
      linePositions[k * 6 + 1] = a.position.y;
      linePositions[k * 6 + 2] = a.position.z;
      linePositions[k * 6 + 3] = b.position.x;
      linePositions[k * 6 + 4] = b.position.y;
      linePositions[k * 6 + 5] = b.position.z;

      lineColors[k * 6] = mixR * alpha;
      lineColors[k * 6 + 1] = mixG * alpha;
      lineColors[k * 6 + 2] = mixB * alpha;
      lineColors[k * 6 + 3] = mixR * alpha;
      lineColors[k * 6 + 4] = mixG * alpha;
      lineColors[k * 6 + 5] = mixB * alpha;
    }

    this.lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    this.lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));
    this.lineGeometry.attributes.position.needsUpdate = true;
    this.lineGeometry.attributes.color.needsUpdate = true;
    this.lineGeometry.setDrawRange(0, limited.length * 2);
  }

  getParticleCount(): number {
    return PARTICLE_COUNT;
  }

  getAliveCount(): number {
    return this.particles.filter(p => p.opacity > 0.01).length;
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
    this.lineGeometry.dispose();
    this.lineMaterial.dispose();
    this.scene.remove(this.points);
    this.scene.remove(this.lines);
  }
}
