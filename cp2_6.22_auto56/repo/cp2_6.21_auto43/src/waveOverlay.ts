import * as THREE from 'three';
import { CognitiveStatus, hexToRgbVec, easeInOutCubic } from './statusStore';

const INITIAL_PARTICLE_COUNT = 5000;
const MIN_PARTICLE_COUNT = 2000;
const MAX_PARTICLE_COUNT = 5000;
const PARTICLE_COUNT_STEP = 500;
const BRAIN_RADIUS = 1.65;
const MAX_UPDATE_MS = 8;
const FPS_TARGET = 50;
const FRAME_TIME_TARGET = 1000 / FPS_TARGET;

type MotionMode = 'circle' | 'brownian' | 'pulse' | 'linear';
type SizeMode = 'angle' | 'random' | 'pulse' | 'speed';

const VERTEX_SHADER = /* glsl */ `
  attribute float aSeed;
  attribute float aSizeBase;
  attribute float aSizePhase;
  attribute float aSizeSpeed;

  uniform float uTime;
  uniform float uIntensity;
  uniform float uPointScale;
  uniform int   uSizeMode;
  uniform float uSizePulseSpeed;
  uniform float uSizePulseAmount;

  varying float vSeed;
  varying float vIntensity;
  varying float vSizePulse;

  void main() {
    vSeed = aSeed;
    vIntensity = uIntensity;

    float sizePulse = 1.0;

    if (uSizeMode == 0) {
      sizePulse = 0.55 + sin(aSizePhase + uTime * aSizeSpeed * 3.0) * 0.45;
    } else if (uSizeMode == 1) {
      sizePulse = 0.7 + sin(aSizePhase + uTime * (aSizeSpeed + 2.0)) * 0.3;
    } else if (uSizeMode == 2) {
      float p = sin(uTime * uSizePulseSpeed + aSeed * 30.0);
      float sharp = smoothstep(-0.3, 1.0, p);
      sizePulse = 0.25 + sharp * uSizePulseAmount;
    } else if (uSizeMode == 3) {
      sizePulse = 0.45 + sin(aSizePhase + uTime * aSizeSpeed * 5.0) * 0.55;
    }

    vSizePulse = sizePulse;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

    float size = aSizeBase * sizePulse * uPointScale;
    size *= (0.5 + uIntensity * 1.4);

    gl_PointSize = size * (280.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform vec3  uColor;
  uniform float uIntensity;
  uniform float uTime;
  uniform float uAlphaBase;

  varying float vSeed;
  varying float vIntensity;
  varying float vSizePulse;

  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;

    float alpha = smoothstep(0.5, 0.08, dist);
    float core = smoothstep(0.5, 0.0, dist);

    float flicker = sin(uTime * (2.0 + vSeed * 6.0) + vSeed * 25.0) * 0.3 + 0.7;
    float baseAlpha = uAlphaBase * flicker;

    vec3 glow = uColor * (1.0 + core * (0.8 + vIntensity * 1.5));
    vec3 whiteCore = vec3(1.0) * core * 0.5 * vIntensity * vSizePulse;

    vec3 finalColor = glow + whiteCore;
    float finalAlpha = (baseAlpha + core * 0.35 * vIntensity) * alpha;

    gl_FragColor = vec4(finalColor, clamp(finalAlpha, 0.0, 0.9));
  }
`;

interface ParticleData {
  baseX: number;
  baseY: number;
  baseZ: number;
  phase: number;
  orbitRadius: number;
  orbitSpeed: number;
  axisX: number;
  axisY: number;
  axisZ: number;
  vx: number;
  vy: number;
  vz: number;
  seed: number;
  sizeBase: number;
  sizePhase: number;
  sizeSpeed: number;
  flickerFreq: number;
  blinkPhase: number;
}

interface PerfMetrics {
  updateDurations: number[];
  frameTimes: number[];
  lastFrameTimestamp: number;
  lastSampleTime: number;
  sampleCount: number;
  avgUpdateMs: number;
  avgFps: number;
  particleCount: number;
  scale: number;
}

export class WaveOverlay {
  public readonly points: THREE.Points;
  private geometry: THREE.BufferGeometry;
  private material: THREE.ShaderMaterial;
  private positions: Float32Array;
  private seeds: Float32Array;
  private sizeBases: Float32Array;
  private sizePhases: Float32Array;
  private sizeSpeeds: Float32Array;
  private positionAttr: THREE.BufferAttribute;

  private particles: ParticleData[];
  private startTime: number;
  private lastTime: number;
  private currentStatus: CognitiveStatus;
  private targetStatus: CognitiveStatus;
  private transitionStart: number;
  private transitionDuration: number;
  private isTransitioning: boolean;
  private currentColorHex: string;
  private targetColorHex: string;
  private baseColorHex: string;
  private intensity: number;
  private targetIntensity: number;
  private baseIntensity: number;

  private maxR2: number;
  private minR2: number;

  private perf: PerfMetrics;
  private lastUpdateDuration: number;
  private particleCount: number;
  private needsRebuild: boolean;
  private lastAdaptTime: number;

  constructor() {
    this.startTime = performance.now();
    this.lastTime = this.startTime;
    this.currentStatus = 'focus';
    this.targetStatus = 'focus';
    this.transitionStart = 0;
    this.transitionDuration = 1500;
    this.isTransitioning = false;
    this.currentColorHex = '#00aaff';
    this.targetColorHex = '#00aaff';
    this.baseColorHex = '#00aaff';
    this.intensity = 0.75;
    this.targetIntensity = 0.75;
    this.baseIntensity = 0.75;

    this.maxR2 = (BRAIN_RADIUS * 1.25) * (BRAIN_RADIUS * 1.25);
    this.minR2 = (BRAIN_RADIUS * 0.8) * (BRAIN_RADIUS * 0.8);

    this.particleCount = INITIAL_PARTICLE_COUNT;
    this.lastUpdateDuration = 0;
    this.needsRebuild = false;
    this.lastAdaptTime = 0;

    this.perf = {
      updateDurations: [],
      frameTimes: [],
      lastFrameTimestamp: this.startTime,
      lastSampleTime: this.startTime,
      sampleCount: 0,
      avgUpdateMs: 0,
      avgFps: 60,
      particleCount: this.particleCount,
      scale: 1.0,
    };

    const built = this.buildParticleSystem(this.particleCount);
    this.geometry = built.geometry;
    this.material = built.material;
    this.particles = built.particles;
    this.positions = built.positions;
    this.seeds = built.seeds;
    this.sizeBases = built.sizeBases;
    this.sizePhases = built.sizePhases;
    this.sizeSpeeds = built.sizeSpeeds;
    this.positionAttr = built.positionAttr;

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;

    this.applySizeModeForStatus('focus');
  }

  private buildParticleSystem(count: number): {
    geometry: THREE.BufferGeometry;
    material: THREE.ShaderMaterial;
    particles: ParticleData[];
    positions: Float32Array;
    seeds: Float32Array;
    sizeBases: Float32Array;
    sizePhases: Float32Array;
    sizeSpeeds: Float32Array;
    positionAttr: THREE.BufferAttribute;
  } {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const sizeBases = new Float32Array(count);
    const sizePhases = new Float32Array(count);
    const sizeSpeeds = new Float32Array(count);
    const particles = new Array(count);

    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = BRAIN_RADIUS * (0.92 + Math.random() * 0.18);
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      let axisX = Math.random() - 0.5;
      let axisY = Math.random() - 0.5;
      let axisZ = Math.random() - 0.5;
      let axisLen = Math.sqrt(axisX * axisX + axisY * axisY + axisZ * axisZ) || 1;
      axisX /= axisLen;
      axisY /= axisLen;
      axisZ /= axisLen;

      const speed = 0.35 + Math.random() * 0.6;
      const dirTheta = Math.random() * Math.PI * 2;
      const dirPhi = Math.acos(2 * Math.random() - 1);

      const seed = Math.random();

      particles[i] = {
        baseX: x,
        baseY: y,
        baseZ: z,
        phase: Math.random() * Math.PI * 2,
        orbitRadius: 0.025 + Math.random() * 0.075,
        orbitSpeed: 0.8 + Math.random() * 2.2,
        axisX,
        axisY,
        axisZ,
        vx: Math.sin(dirPhi) * Math.cos(dirTheta) * speed,
        vy: Math.sin(dirPhi) * Math.sin(dirTheta) * speed,
        vz: Math.cos(dirPhi) * speed,
        seed,
        sizeBase: 1.0 + Math.random() * 3.0,
        sizePhase: Math.random() * Math.PI * 2,
        sizeSpeed: 0.3 + Math.random() * 2.7,
        flickerFreq: 0.6 + Math.random() * 2.5,
        blinkPhase: Math.random() * Math.PI * 2,
      };

      positions[i * 3 + 0] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      seeds[i] = seed;
      sizeBases[i] = particles[i].sizeBase;
      sizePhases[i] = particles[i].sizePhase;
      sizeSpeeds[i] = particles[i].sizeSpeed;
    }

    const positionAttr = new THREE.BufferAttribute(positions, 3);
    geometry.setAttribute('position', positionAttr);
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    geometry.setAttribute('aSizeBase', new THREE.BufferAttribute(sizeBases, 1));
    geometry.setAttribute('aSizePhase', new THREE.BufferAttribute(sizePhases, 1));
    geometry.setAttribute('aSizeSpeed', new THREE.BufferAttribute(sizeSpeeds, 1));

    const [r, g, b] = hexToRgbVec(this.currentColorHex || '#00aaff');
    const intensity = typeof this.intensity === 'number' ? this.intensity : 0.75;

    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: intensity },
        uColor: { value: new THREE.Color(r, g, b) },
        uPointScale: { value: this.perf?.scale || 1.0 },
        uSizeMode: { value: 0 },
        uSizePulseSpeed: { value: 2.0 },
        uSizePulseAmount: { value: 2.0 },
        uAlphaBase: { value: 0.3 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    return { geometry, material, particles, positions, seeds, sizeBases, sizePhases, sizeSpeeds, positionAttr };
  }

  private rebuildParticleSystem(newCount: number): void {
    if (newCount === this.particleCount) return;
    if (newCount < MIN_PARTICLE_COUNT || newCount > MAX_PARTICLE_COUNT) return;

    const oldPositions = this.positions;
    const oldParticles = this.particles;
    const oldCount = this.particleCount;

    const built = this.buildParticleSystem(newCount);

    const copyCount = Math.min(oldCount, newCount);
    for (let i = 0; i < copyCount; i++) {
      built.positions[i * 3 + 0] = oldPositions[i * 3 + 0];
      built.positions[i * 3 + 1] = oldPositions[i * 3 + 1];
      built.positions[i * 3 + 2] = oldPositions[i * 3 + 2];
      built.particles[i] = { ...oldParticles[i] };
    }

    this.geometry.dispose();
    this.geometry = built.geometry;
    this.material = built.material;
    this.particles = built.particles;
    this.positions = built.positions;
    this.seeds = built.seeds;
    this.sizeBases = built.sizeBases;
    this.sizePhases = built.sizePhases;
    this.sizeSpeeds = built.sizeSpeeds;
    this.positionAttr = built.positionAttr;
    this.particleCount = newCount;
    this.perf.particleCount = newCount;

    this.points.geometry = this.geometry;
    this.points.material = this.material;

    this.applySizeModeForStatus(this.currentStatus);
    this.applyColorAndIntensity();
  }

  private modeFromStatus(status: CognitiveStatus): MotionMode {
    switch (status) {
      case 'focus':   return 'circle';
      case 'relax':   return 'brownian';
      case 'sleep':   return 'pulse';
      case 'excited': return 'linear';
    }
  }

  private sizeModeFromStatus(status: CognitiveStatus): SizeMode {
    switch (status) {
      case 'focus':   return 'angle';
      case 'relax':   return 'random';
      case 'sleep':   return 'pulse';
      case 'excited': return 'speed';
    }
  }

  private sizeModeIndex(mode: SizeMode): number {
    switch (mode) {
      case 'angle':  return 0;
      case 'random': return 1;
      case 'pulse':  return 2;
      case 'speed':  return 3;
    }
  }

  private applySizeModeForStatus(status: CognitiveStatus): void {
    const mode = this.sizeModeFromStatus(status);
    const idx = this.sizeModeIndex(mode);
    this.material.uniforms.uSizeMode.value = idx;

    switch (status) {
      case 'focus':
        this.material.uniforms.uSizePulseSpeed.value = 2.5;
        this.material.uniforms.uSizePulseAmount.value = 1.9;
        this.material.uniforms.uAlphaBase.value = 0.32;
        break;
      case 'relax':
        this.material.uniforms.uSizePulseSpeed.value = 1.5;
        this.material.uniforms.uSizePulseAmount.value = 1.5;
        this.material.uniforms.uAlphaBase.value = 0.28;
        break;
      case 'sleep':
        this.material.uniforms.uSizePulseSpeed.value = 1.3;
        this.material.uniforms.uSizePulseAmount.value = 3.2;
        this.material.uniforms.uAlphaBase.value = 0.22;
        break;
      case 'excited':
        this.material.uniforms.uSizePulseSpeed.value = 5.5;
        this.material.uniforms.uSizePulseAmount.value = 2.7;
        this.material.uniforms.uAlphaBase.value = 0.35;
        break;
    }
  }

  private lerpColor(hexA: string, hexB: string, t: number): string {
    const [r1, g1, b1] = hexToRgbVec(hexA);
    const [r2, g2, b2] = hexToRgbVec(hexB);
    const r = r1 + (r2 - r1) * t;
    const g = g1 + (g2 - g1) * t;
    const b = b1 + (b2 - b1) * t;
    const toHex = (v: number) =>
      Math.max(0, Math.min(255, Math.round(v * 255))).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  public setWaveIntensity(status: CognitiveStatus, colorHex: string, intensity: number): void {
    if (status === this.currentStatus && !this.isTransitioning) return;

    const now = performance.now();
    this.baseColorHex = this.currentColorHex;
    this.baseIntensity = this.intensity;
    this.targetColorHex = colorHex;
    this.targetIntensity = intensity;
    this.targetStatus = status;
    this.transitionStart = now;
    this.transitionDuration = 1500;
    this.isTransitioning = true;

    this.applySizeModeForStatus(status);
  }

  private tickTransition(now: number): void {
    if (!this.isTransitioning) return;

    const rawT = (now - this.transitionStart) / this.transitionDuration;
    if (rawT >= 1) {
      this.currentColorHex = this.targetColorHex;
      this.intensity = this.targetIntensity;
      this.currentStatus = this.targetStatus;
      this.isTransitioning = false;
      this.applyColorAndIntensity();
      return;
    }

    const t = easeInOutCubic(rawT);
    this.currentColorHex = this.lerpColor(this.baseColorHex, this.targetColorHex, t);
    this.intensity = this.baseIntensity + (this.targetIntensity - this.baseIntensity) * t;
    this.applyColorAndIntensity();
  }

  private applyColorAndIntensity(): void {
    const [r, g, b] = hexToRgbVec(this.currentColorHex);
    this.material.uniforms.uColor.value.setRGB(r, g, b);
    this.material.uniforms.uIntensity.value = this.intensity;
  }

  private updateCircle(t: number, intensity: number, dt: number): void {
    const positions = this.positions;
    const particles = this.particles;
    const count = this.particleCount;

    for (let i = 0; i < count; i++) {
      const p = particles[i];
      const ix = i * 3;

      const phase = p.phase + t * p.orbitSpeed;
      const cr = p.orbitRadius * (0.5 + intensity * 1.2);

      const cosPh = Math.cos(phase) * cr;
      const sinPh = Math.sin(phase) * cr;

      const tx = p.axisX, ty = p.axisY, tz = p.axisZ;

      let px = -ty, py = tx, pz = 0;
      let pl = Math.sqrt(px * px + py * py + pz * pz) || 1;
      const pxn = px / pl, pyn = py / pl, pzn = pz / pl;

      const qx = ty * pzn - tz * pyn;
      const qy = tz * pxn - tx * pzn;
      const qz = tx * pyn - ty * pxn;

      positions[ix] = p.baseX + cosPh * pxn + sinPh * qx;
      positions[ix + 1] = p.baseY + cosPh * pyn + sinPh * qy;
      positions[ix + 2] = p.baseZ + cosPh * pzn + sinPh * qz;

      p.sizePhase = phase;

      void dt;
    }
  }

  private updateBrownian(t: number, intensity: number, dt: number): void {
    const positions = this.positions;
    const particles = this.particles;
    const maxR2 = this.maxR2;
    const minR2 = this.minR2;
    const stepMul = 0.02 * (0.5 + intensity * 1.3) * dt * 60;
    const count = this.particleCount;

    for (let i = 0; i < count; i++) {
      const p = particles[i];
      const ix = i * 3;

      const bx = (Math.random() - 0.5) * stepMul;
      const by = (Math.random() - 0.5) * stepMul;
      const bz = (Math.random() - 0.5) * stepMul;

      let x = p.baseX + bx;
      let y = p.baseY + by;
      let z = p.baseZ + bz;

      const dr2 = x * x + y * y + z * z;
      if (dr2 > maxR2) {
        const scale = BRAIN_RADIUS * 1.15 / Math.sqrt(dr2);
        x *= scale; y *= scale; z *= scale;
      } else if (dr2 < minR2) {
        const scale = BRAIN_RADIUS * 0.88 / Math.sqrt(dr2);
        x *= scale; y *= scale; z *= scale;
      }

      p.baseX = x;
      p.baseY = y;
      p.baseZ = z;

      positions[ix] = x;
      positions[ix + 1] = y;
      positions[ix + 2] = z;

      void t;
    }
  }

  private updatePulse(t: number, intensity: number, dt: number): void {
    const positions = this.positions;
    const particles = this.particles;
    const count = this.particleCount;

    for (let i = 0; i < count; i++) {
      const p = particles[i];
      const ix = i * 3;

      const pulseSpeed = p.flickerFreq * (0.8 + intensity * 1.3);
      const pulse = Math.sin(t * pulseSpeed + p.blinkPhase) * 0.5 + 0.5;
      const sharpPulse = Math.pow(pulse, 2.5);
      const expand = 1.0 + sharpPulse * 0.08 * (0.5 + intensity * 0.8);

      p.sizePhase = t * pulseSpeed + p.blinkPhase;

      const noiseAmp = 0.0015 + intensity * 0.0025;
      const noiseX = (Math.random() - 0.5) * noiseAmp;
      const noiseY = (Math.random() - 0.5) * noiseAmp;
      const noiseZ = (Math.random() - 0.5) * noiseAmp;

      positions[ix] = p.baseX * expand + noiseX;
      positions[ix + 1] = p.baseY * expand + noiseY;
      positions[ix + 2] = p.baseZ * expand + noiseZ;

      void dt;
    }
  }

  private updateLinear(t: number, intensity: number, dt: number): void {
    const positions = this.positions;
    const particles = this.particles;
    const maxR2 = this.maxR2;
    const minR2 = this.minR2;
    const speedMul = 0.4 + intensity * 0.95;
    const count = this.particleCount;

    for (let i = 0; i < count; i++) {
      const p = particles[i];
      const ix = i * 3;

      const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy + p.vz * p.vz) || 1;
      const speedPhase = t * 4.0 + p.phase;
      const speedMod = 0.8 + Math.sin(speedPhase) * 0.2;
      p.sizePhase = speedPhase;

      let x = positions[ix] + p.vx * dt * speedMul * speedMod;
      let y = positions[ix + 1] + p.vy * dt * speedMul * speedMod;
      let z = positions[ix + 2] + p.vz * dt * speedMul * speedMod;

      const dr2 = x * x + y * y + z * z;
      if (dr2 > maxR2 || dr2 < minR2) {
        const nx = x, ny = y, nz = z;
        const nl = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
        const nxn = nx / nl, nyn = ny / nl, nzn = nz / nl;
        const dotV = p.vx * nxn + p.vy * nyn + p.vz * nzn;
        p.vx = p.vx - 2 * dotV * nxn;
        p.vy = p.vy - 2 * dotV * nyn;
        p.vz = p.vz - 2 * dotV * nzn;

        if (dr2 > maxR2) {
          const s = BRAIN_RADIUS * 1.18 / Math.sqrt(dr2);
          x *= s; y *= s; z *= s;
        } else {
          const s = BRAIN_RADIUS * 0.85 / Math.sqrt(dr2);
          x *= s; y *= s; z *= s;
        }
      }

      if (Math.random() < 0.005) {
        const spd2 = 0.3 + Math.random() * 0.7;
        const dTh = Math.random() * Math.PI * 2;
        const dPh = Math.acos(2 * Math.random() - 1);
        p.vx = Math.sin(dPh) * Math.cos(dTh) * spd2;
        p.vy = Math.sin(dPh) * Math.sin(dTh) * spd2;
        p.vz = Math.cos(dPh) * spd2;
      }

      void spd;
      positions[ix] = x;
      positions[ix + 1] = y;
      positions[ix + 2] = z;
    }
  }

  private updatePerformanceMetrics(now: number, updateDur: number): void {
    const frameTime = now - this.perf.lastFrameTimestamp;
    this.perf.lastFrameTimestamp = now;

    this.perf.updateDurations.push(updateDur);
    this.perf.frameTimes.push(frameTime);

    const maxSamples = 60;
    if (this.perf.updateDurations.length > maxSamples) {
      this.perf.updateDurations.shift();
      this.perf.frameTimes.shift();
    }

    this.perf.sampleCount++;
    this.perf.avgUpdateMs =
      this.perf.updateDurations.reduce((a, b) => a + b, 0) / this.perf.updateDurations.length;
    const avgFrameTime =
      this.perf.frameTimes.reduce((a, b) => a + b, 0) / this.perf.frameTimes.length;
    this.perf.avgFps = 1000 / Math.max(1, avgFrameTime);
  }

  private adaptivePerformance(now: number): void {
    if (now - this.lastAdaptTime < 3000) return;
    this.lastAdaptTime = now;

    const avgMs = this.perf.avgUpdateMs;
    const avgFps = this.perf.avgFps;

    if (avgMs > MAX_UPDATE_MS * 1.1 || avgFps < FPS_TARGET * 0.9) {
      const newCount = Math.max(MIN_PARTICLE_COUNT, this.particleCount - PARTICLE_COUNT_STEP);
      if (newCount < this.particleCount) {
        this.rebuildParticleSystem(newCount);
        this.material.uniforms.uPointScale.value = Math.min(1.2, this.material.uniforms.uPointScale.value + 0.08);
        this.perf.scale = this.material.uniforms.uPointScale.value;
      } else if (this.material.uniforms.uPointScale.value > 0.6) {
        this.material.uniforms.uPointScale.value = Math.max(0.6, this.material.uniforms.uPointScale.value - 0.1);
        this.perf.scale = this.material.uniforms.uPointScale.value;
      }
    } else if (
      avgMs < MAX_UPDATE_MS * 0.5 &&
      avgFps > FPS_TARGET * 1.1 &&
      this.particleCount < MAX_PARTICLE_COUNT
    ) {
      const newCount = Math.min(MAX_PARTICLE_COUNT, this.particleCount + PARTICLE_COUNT_STEP);
      if (newCount > this.particleCount) {
        this.rebuildParticleSystem(newCount);
      } else if (this.material.uniforms.uPointScale.value < 1.0) {
        this.material.uniforms.uPointScale.value = Math.min(1.0, this.material.uniforms.uPointScale.value + 0.05);
        this.perf.scale = this.material.uniforms.uPointScale.value;
      }
    }
  }

  public update(now: number): void {
    const updateStart = performance.now();

    const t = (now - this.startTime) * 0.001;
    const dt = Math.min(0.05, (now - this.lastTime) * 0.001);
    this.lastTime = now;

    this.material.uniforms.uTime.value = t;

    this.tickTransition(now);

    const mode = this.modeFromStatus(this.currentStatus);
    const intensity = this.intensity;

    switch (mode) {
      case 'circle':   this.updateCircle(t, intensity, dt); break;
      case 'brownian': this.updateBrownian(t, intensity, dt); break;
      case 'pulse':    this.updatePulse(t, intensity, dt); break;
      case 'linear':   this.updateLinear(t, intensity, dt); break;
    }

    this.positionAttr.needsUpdate = true;

    const dur = performance.now() - updateStart;
    this.lastUpdateDuration = dur;

    this.updatePerformanceMetrics(now, dur);
    this.adaptivePerformance(now);
  }

  public getLastUpdateDuration(): number {
    return this.lastUpdateDuration;
  }

  public getPerformanceMetrics(): { avgUpdateMs: number; avgFps: number; particleCount: number; scale: number } {
    return {
      avgUpdateMs: this.perf.avgUpdateMs,
      avgFps: this.perf.avgFps,
      particleCount: this.particleCount,
      scale: this.perf.scale,
    };
  }

  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}
