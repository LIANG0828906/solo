import * as THREE from 'three';

const MAX_PARTICLES = 5000;
const PARTICLE_BASE_SIZE = 0.08;
const PARTICLE_SPEED = 0.5;
const PARTICLE_DRIFT = 0.02;
const FADE_DURATION = 1.8;
const STAGGER_DURATION = 1.2;
const SHRINK_DURATION = 0.5;
const BRIGHTNESS_BOOST = 1.2;
const SHRINK_SIZE = 0.02;
const COLOR_TRANSITION_DURATION = 0.5;

const vertexShader = `
  attribute float aSize;
  attribute float aAlpha;
  attribute vec3 aColor;
  attribute float aBrightness;

  varying vec3 vColor;
  varying float vAlpha;
  varying float vBrightness;

  void main() {
    vColor = aColor;
    vAlpha = aAlpha;
    vBrightness = aBrightness;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (300.0 / -mvPosition.z);
    gl_PointSize = max(gl_PointSize, 0.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;
  varying float vBrightness;

  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    float softEdge = 1.0 - smoothstep(0.2, 0.5, dist);
    vec3 finalColor = vColor * vBrightness;
    gl_FragColor = vec4(finalColor, vAlpha * softEdge);
  }
`;

interface StrokeRecord {
  particleIndices: number[];
  points: THREE.Vector3[];
  color: THREE.Color;
  timestamp: number;
}

class ParticleSystem {
  private scene: THREE.Scene;
  private maxParticles: number;
  private geometry: THREE.BufferGeometry;
  private material: THREE.ShaderMaterial;
  private points: THREE.Points;

  private positions: Float32Array;
  private velocities: Float32Array;
  private colors: Float32Array;
  private targetColors: Float32Array;
  private alphas: Float32Array;
  private sizes: Float32Array;
  private baseSizes: Float32Array;
  private brightnesses: Float32Array;
  private activeFlags: Uint8Array;
  private fadeStartTimes: Float32Array;
  private strokeOrders: Float32Array;
  private drifts: Float32Array;

  private strokes: StrokeRecord[] = [];
  private currentStroke: StrokeRecord | null = null;
  private globalTime: number = 0;
  private colorTransitionStart: number = 0;
  private colorTransitioning: boolean = false;

  private freeIndices: number[] = [];

  constructor(scene: THREE.Scene, maxParticles: number = MAX_PARTICLES) {
    this.scene = scene;
    this.maxParticles = maxParticles;

    this.positions = new Float32Array(maxParticles * 3);
    this.velocities = new Float32Array(maxParticles * 3);
    this.colors = new Float32Array(maxParticles * 3);
    this.targetColors = new Float32Array(maxParticles * 3);
    this.alphas = new Float32Array(maxParticles);
    this.sizes = new Float32Array(maxParticles);
    this.baseSizes = new Float32Array(maxParticles);
    this.brightnesses = new Float32Array(maxParticles);
    this.activeFlags = new Uint8Array(maxParticles);
    this.fadeStartTimes = new Float32Array(maxParticles);
    this.strokeOrders = new Float32Array(maxParticles);
    this.drifts = new Float32Array(maxParticles * 3);

    for (let i = 0; i < maxParticles; i++) {
      this.freeIndices.push(i);
      this.alphas[i] = 0;
      this.sizes[i] = 0;
      this.activeFlags[i] = 0;
      this.fadeStartTimes[i] = -1;
      this.strokeOrders[i] = 0;
      this.brightnesses[i] = 1.0;
      this.baseSizes[i] = PARTICLE_BASE_SIZE;
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('aColor', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('aAlpha', new THREE.BufferAttribute(this.alphas, 1));
    this.geometry.setAttribute('aSize', new THREE.BufferAttribute(this.sizes, 1));
    this.geometry.setAttribute('aBrightness', new THREE.BufferAttribute(this.brightnesses, 1));

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    scene.add(this.points);
  }

  beginStroke(color: THREE.Color): void {
    this.currentStroke = {
      particleIndices: [],
      points: [],
      color: color.clone(),
      timestamp: this.globalTime,
    };
  }

  emit(position: THREE.Vector3, color: THREE.Color, count: number = 30): void {
    if (!this.currentStroke) return;

    for (let i = 0; i < count; i++) {
      if (this.freeIndices.length === 0) break;

      const idx = this.freeIndices.pop()!;
      const i3 = idx * 3;

      const offsetX = (Math.random() - 0.5) * 0.03;
      const offsetY = (Math.random() - 0.5) * 0.03;
      const offsetZ = (Math.random() - 0.5) * 0.01;

      this.positions[i3] = position.x + offsetX;
      this.positions[i3 + 1] = position.y + offsetY;
      this.positions[i3 + 2] = position.z + offsetZ;

      const angle = Math.random() * Math.PI * 2;
      const driftX = Math.cos(angle) * PARTICLE_DRIFT * (0.5 + Math.random());
      const driftY = Math.sin(angle) * PARTICLE_DRIFT * (0.5 + Math.random());
      const driftZ = (Math.random() - 0.5) * PARTICLE_DRIFT * 0.3;

      this.velocities[i3] = driftX;
      this.velocities[i3 + 1] = driftY + PARTICLE_SPEED * 0.05;
      this.velocities[i3 + 2] = driftZ;

      this.drifts[i3] = driftX * 2;
      this.drifts[i3 + 1] = driftY * 2;
      this.drifts[i3 + 2] = driftZ * 2;

      this.colors[i3] = color.r;
      this.colors[i3 + 1] = color.g;
      this.colors[i3 + 2] = color.b;
      this.targetColors[i3] = color.r;
      this.targetColors[i3 + 1] = color.g;
      this.targetColors[i3 + 2] = color.b;

      this.alphas[idx] = 1.0;
      this.sizes[idx] = PARTICLE_BASE_SIZE;
      this.baseSizes[idx] = PARTICLE_BASE_SIZE;
      this.brightnesses[idx] = 1.0;
      this.activeFlags[idx] = 1;
      this.fadeStartTimes[idx] = -1;
      this.strokeOrders[idx] = 0;

      this.currentStroke.particleIndices.push(idx);
      this.currentStroke.points.push(position.clone());
    }
  }

  endStroke(): StrokeRecord | null {
    if (!this.currentStroke) return null;

    const stroke = this.currentStroke;
    const totalParticles = stroke.particleIndices.length;

    if (totalParticles > 0) {
      for (let i = 0; i < totalParticles; i++) {
        const idx = stroke.particleIndices[i];
        this.strokeOrders[idx] = i / totalParticles;
        this.fadeStartTimes[idx] = this.globalTime + (i / totalParticles) * STAGGER_DURATION;
      }

      this.strokes.push(stroke);
      if (this.strokes.length > 10) {
        this.strokes.shift();
      }
    }

    this.currentStroke = null;
    return stroke;
  }

  update(delta: number): void {
    this.globalTime += delta;

    if (this.colorTransitioning) {
      const elapsed = this.globalTime - this.colorTransitionStart;
      const t = Math.min(elapsed / COLOR_TRANSITION_DURATION, 1.0);
      const eased = t * t * (3 - 2 * t);

      for (let i = 0; i < this.maxParticles; i++) {
        if (!this.activeFlags[i]) continue;
        const i3 = i * 3;
        this.colors[i3] += (this.targetColors[i3] - this.colors[i3]) * eased;
        this.colors[i3 + 1] += (this.targetColors[i3 + 1] - this.colors[i3 + 1]) * eased;
        this.colors[i3 + 2] += (this.targetColors[i3 + 2] - this.colors[i3 + 2]) * eased;
      }

      if (t >= 1.0) {
        this.colorTransitioning = false;
      }
    }

    for (let i = 0; i < this.maxParticles; i++) {
      if (!this.activeFlags[i]) continue;

      const i3 = i * 3;

      this.positions[i3] += this.velocities[i3] * delta;
      this.positions[i3 + 1] += this.velocities[i3 + 1] * delta;
      this.positions[i3 + 2] += this.velocities[i3 + 2] * delta;

      this.velocities[i3] += this.drifts[i3] * delta * 0.3;
      this.velocities[i3 + 1] += this.drifts[i3 + 1] * delta * 0.3;
      this.velocities[i3 + 2] += this.drifts[i3 + 2] * delta * 0.3;

      this.velocities[i3] *= 0.98;
      this.velocities[i3 + 1] *= 0.98;
      this.velocities[i3 + 2] *= 0.98;

      const fadeStart = this.fadeStartTimes[i];
      if (fadeStart > 0) {
        const elapsed = this.globalTime - fadeStart;
        if (elapsed > 0) {
          const progress = Math.min(elapsed / FADE_DURATION, 1.0);
          this.alphas[i] = Math.max(0, 1.0 - progress);

          const remaining = FADE_DURATION - elapsed;
          if (remaining < SHRINK_DURATION && remaining > 0) {
            const shrinkProgress = 1.0 - (remaining / SHRINK_DURATION);
            this.sizes[i] = this.baseSizes[i] + (SHRINK_SIZE - this.baseSizes[i]) * shrinkProgress;
            this.brightnesses[i] = 1.0 + (BRIGHTNESS_BOOST - 1.0) * shrinkProgress;
          }

          if (this.alphas[i] <= 0) {
            this.deactivateParticle(i);
          }
        }
      }
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.aColor.needsUpdate = true;
    this.geometry.attributes.aAlpha.needsUpdate = true;
    this.geometry.attributes.aSize.needsUpdate = true;
    this.geometry.attributes.aBrightness.needsUpdate = true;
  }

  private deactivateParticle(idx: number): void {
    const i3 = idx * 3;
    this.activeFlags[idx] = 0;
    this.alphas[idx] = 0;
    this.sizes[idx] = 0;
    this.brightnesses[idx] = 1.0;
    this.fadeStartTimes[idx] = -1;
    this.positions[i3] = 0;
    this.positions[i3 + 1] = 0;
    this.positions[i3 + 2] = -1000;
    this.freeIndices.push(idx);
  }

  setThemeColor(color: THREE.Color): void {
    this.colorTransitionStart = this.globalTime;
    this.colorTransitioning = true;

    for (let i = 0; i < this.maxParticles; i++) {
      if (!this.activeFlags[i]) continue;
      const i3 = i * 3;
      this.targetColors[i3] = color.r;
      this.targetColors[i3 + 1] = color.g;
      this.targetColors[i3 + 2] = color.b;
    }
  }

  undo(): StrokeRecord | null {
    if (this.strokes.length === 0) return null;

    const stroke = this.strokes.pop()!;
    for (const idx of stroke.particleIndices) {
      this.deactivateParticle(idx);
    }

    if (this.currentStroke) {
      const currentIndices = this.currentStroke.particleIndices;
      for (const idx of currentIndices) {
        this.deactivateParticle(idx);
      }
      this.currentStroke = null;
    }

    return stroke;
  }

  getLastStroke(): StrokeRecord | null {
    return this.strokes.length > 0 ? this.strokes[this.strokes.length - 1] : null;
  }

  getStrokes(): StrokeRecord[] {
    return [...this.strokes];
  }

  clearAll(): void {
    for (let i = 0; i < this.maxParticles; i++) {
      if (this.activeFlags[i]) {
        this.deactivateParticle(i);
      }
    }
    this.strokes = [];
    this.currentStroke = null;
  }

  emitBurst(position: THREE.Vector3, color: THREE.Color, count: number = 50): void {
    const savedStroke = this.currentStroke;
    this.currentStroke = {
      particleIndices: [],
      points: [],
      color: color.clone(),
      timestamp: this.globalTime,
    };

    this.emit(position, color, count);

    if (this.currentStroke) {
      const stroke = this.currentStroke;
      const total = stroke.particleIndices.length;
      for (let i = 0; i < total; i++) {
        const idx = stroke.particleIndices[i];
        this.strokeOrders[idx] = i / total;
        this.fadeStartTimes[idx] = this.globalTime + (i / total) * STAGGER_DURATION * 0.5;
      }
      this.strokes.push(stroke);
    }

    this.currentStroke = savedStroke;
  }

  getActiveCount(): number {
    let count = 0;
    for (let i = 0; i < this.maxParticles; i++) {
      if (this.activeFlags[i]) count++;
    }
    return count;
  }

  getGlobalTime(): number {
    return this.globalTime;
  }

  setGlobalTime(time: number): void {
    this.globalTime = time;
  }

  getCurrentColor(): THREE.Color {
    for (let i = 0; i < this.maxParticles; i++) {
      if (this.activeFlags[i]) {
        const i3 = i * 3;
        return new THREE.Color(this.targetColors[i3], this.targetColors[i3 + 1], this.targetColors[i3 + 2]);
      }
    }
    return new THREE.Color('#FFD700');
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
    this.scene.remove(this.points);
  }
}

export { ParticleSystem, StrokeRecord, MAX_PARTICLES };
export type { ParticleSystem as ParticleSystemType };
