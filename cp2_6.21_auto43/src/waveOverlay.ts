import * as THREE from 'three';
import { CognitiveStatus, hexToRgbVec, easeInOutCubic } from './statusStore';

const PARTICLE_COUNT = 5000;
const BRAIN_RADIUS = 1.65;
const MAX_UPDATE_MS = 8;

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
      sizePulse = 0.6 + sin(aSizePhase + uTime * aSizeSpeed * 3.0) * 0.4;
    } else if (uSizeMode == 1) {
      sizePulse = 0.7 + sin(aSizePhase + uTime * (aSizeSpeed + 2.0)) * 0.3;
    } else if (uSizeMode == 2) {
      float p = sin(uTime * uSizePulseSpeed + aSeed * 30.0);
      sizePulse = 0.3 + smoothstep(-0.2, 1.0, p) * uSizePulseAmount;
    } else if (uSizeMode == 3) {
      sizePulse = 0.5 + sin(aSizePhase + uTime * aSizeSpeed * 5.0) * 0.5;
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

    float alpha = smoothstep(0.5, 0.1, dist);
    float core = smoothstep(0.5, 0.0, dist);

    float flicker = sin(uTime * (2.0 + vSeed * 6.0) + vSeed * 25.0) * 0.3 + 0.7;
    float baseAlpha = uAlphaBase * flicker;

    vec3 glow = uColor * (1.0 + core * (0.8 + vIntensity * 1.5));
    vec3 whiteCore = vec3(1.0) * core * 0.5 * vIntensity;

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
  radius: number;
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

  private perfSampleCount: number;
  private perfTotalMs: number;
  private perfLastLog: number;
  private lastUpdateDuration: number;

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

    this.perfSampleCount = 0;
    this.perfTotalMs = 0;
    this.perfLastLog = this.startTime;
    this.lastUpdateDuration = 0;

    this.geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(PARTICLE_COUNT * 3);
    this.seeds = new Float32Array(PARTICLE_COUNT);
    this.sizeBases = new Float32Array(PARTICLE_COUNT);
    this.sizePhases = new Float32Array(PARTICLE_COUNT);
    this.sizeSpeeds = new Float32Array(PARTICLE_COUNT);
    this.particles = new Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
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

      const speed = 0.45 + Math.random() * 0.5;
      const dirTheta = Math.random() * Math.PI * 2;
      const dirPhi = Math.acos(2 * Math.random() - 1);

      const seed = Math.random();

      this.particles[i] = {
        baseX: x,
        baseY: y,
        baseZ: z,
        phase: Math.random() * Math.PI * 2,
        radius: 0.035 + Math.random() * 0.035,
        axisX,
        axisY,
        axisZ,
        vx: Math.sin(dirPhi) * Math.cos(dirTheta) * speed,
        vy: Math.sin(dirPhi) * Math.sin(dirTheta) * speed,
        vz: Math.cos(dirPhi) * speed,
        seed,
        sizeBase: 1.2 + Math.random() * 2.8,
        sizePhase: Math.random() * Math.PI * 2,
        sizeSpeed: 0.5 + Math.random() * 2.5,
      };

      this.positions[i * 3 + 0] = x;
      this.positions[i * 3 + 1] = y;
      this.positions[i * 3 + 2] = z;
      this.seeds[i] = seed;
      this.sizeBases[i] = this.particles[i].sizeBase;
      this.sizePhases[i] = this.particles[i].sizePhase;
      this.sizeSpeeds[i] = this.particles[i].sizeSpeed;
    }

    this.positionAttr = new THREE.BufferAttribute(this.positions, 3);
    this.geometry.setAttribute('position', this.positionAttr);
    this.geometry.setAttribute('aSeed', new THREE.BufferAttribute(this.seeds, 1));
    this.geometry.setAttribute('aSizeBase', new THREE.BufferAttribute(this.sizeBases, 1));
    this.geometry.setAttribute('aSizePhase', new THREE.BufferAttribute(this.sizePhases, 1));
    this.geometry.setAttribute('aSizeSpeed', new THREE.BufferAttribute(this.sizeSpeeds, 1));

    const [r, g, b] = hexToRgbVec(this.currentColorHex);

    this.material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: this.intensity },
        uColor: { value: new THREE.Color(r, g, b) },
        uPointScale: { value: 1.0 },
        uSizeMode: { value: 0 },
        uSizePulseSpeed: { value: 2.0 },
        uSizePulseAmount: { value: 2.0 },
        uAlphaBase: { value: 0.3 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;

    this.applySizeModeForStatus('focus');
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
        this.material.uniforms.uSizePulseAmount.value = 1.8;
        this.material.uniforms.uAlphaBase.value = 0.32;
        break;
      case 'relax':
        this.material.uniforms.uSizePulseSpeed.value = 1.5;
        this.material.uniforms.uSizePulseAmount.value = 1.5;
        this.material.uniforms.uAlphaBase.value = 0.28;
        break;
      case 'sleep':
        this.material.uniforms.uSizePulseSpeed.value = 1.2;
        this.material.uniforms.uSizePulseAmount.value = 2.8;
        this.material.uniforms.uAlphaBase.value = 0.22;
        break;
      case 'excited':
        this.material.uniforms.uSizePulseSpeed.value = 5.0;
        this.material.uniforms.uSizePulseAmount.value = 2.5;
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
    const maxR2 = this.maxR2;
    const minR2 = this.minR2;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = particles[i];
      const ix = i * 3;

      const phase = p.phase + t * (1.5 + p.sizeSpeed * 0.8);
      const cr = p.radius * (0.5 + intensity * 1.1);

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

      const dx = positions[ix] - p.baseX;
      const dy = positions[ix + 1] - p.baseY;
      const dz = positions[ix + 2] - p.baseZ;
      const dist2 = dx * dx + dy * dy + dz * dz;
      const maxDist = 0.25;
      if (dist2 > maxDist * maxDist) {
        const s = maxDist / Math.sqrt(dist2);
        positions[ix] = p.baseX + dx * s;
        positions[ix + 1] = p.baseY + dy * s;
        positions[ix + 2] = p.baseZ + dz * s;
      }

      void dt;
      void maxR2;
      void minR2;
    }
  }

  private updateBrownian(t: number, intensity: number, dt: number): void {
    const positions = this.positions;
    const particles = this.particles;
    const maxR2 = this.maxR2;
    const minR2 = this.minR2;
    const stepMul = 0.02 * (0.5 + intensity * 1.3) * dt * 60;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
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

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = particles[i];
      const ix = i * 3;

      const pulseSpeed = 0.8 + intensity * 1.2;
      const pulse = Math.sin(t * pulseSpeed + p.seed * 15.0) * 0.5 + 0.5;
      const expand = 1.0 + pulse * 0.06 * (0.5 + intensity * 0.8);

      const noiseAmp = 0.002 + intensity * 0.003;
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
    const speedMul = 0.4 + intensity * 0.9;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = particles[i];
      const ix = i * 3;

      let x = positions[ix] + p.vx * dt * speedMul;
      let y = positions[ix + 1] + p.vy * dt * speedMul;
      let z = positions[ix + 2] + p.vz * dt * speedMul;

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

      if (Math.random() < 0.004) {
        const spd = 0.3 + Math.random() * 0.7;
        const dTh = Math.random() * Math.PI * 2;
        const dPh = Math.acos(2 * Math.random() - 1);
        p.vx = Math.sin(dPh) * Math.cos(dTh) * spd;
        p.vy = Math.sin(dPh) * Math.sin(dTh) * spd;
        p.vz = Math.cos(dPh) * spd;
      }

      positions[ix] = x;
      positions[ix + 1] = y;
      positions[ix + 2] = z;

      void t;
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
    this.perfSampleCount++;
    this.perfTotalMs += dur;

    if (now - this.perfLastLog > 5000) {
      const avg = this.perfTotalMs / this.perfSampleCount;
      if (avg > MAX_UPDATE_MS * 0.8) {
        this.material.uniforms.uPointScale.value = Math.max(0.6, this.material.uniforms.uPointScale.value - 0.05);
      } else if (avg < MAX_UPDATE_MS * 0.4 && this.material.uniforms.uPointScale.value < 1.0) {
        this.material.uniforms.uPointScale.value = Math.min(1.0, this.material.uniforms.uPointScale.value + 0.05);
      }
      this.perfSampleCount = 0;
      this.perfTotalMs = 0;
      this.perfLastLog = now;
    }
  }

  public getLastUpdateDuration(): number {
    return this.lastUpdateDuration;
  }

  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}
