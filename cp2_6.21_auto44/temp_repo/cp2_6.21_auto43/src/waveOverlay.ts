import * as THREE from 'three';
import { CognitiveStatus, hexToRgbVec } from './statusStore';

const PARTICLE_COUNT = 5000;
const BRAIN_RADIUS = 1.65;

const VERTEX_SHADER = /* glsl */ `
  attribute float aSeed;
  attribute float aSizeBase;

  uniform float uTime;
  uniform float uIntensity;
  uniform float uPointScale;

  varying float vSeed;
  varying float vIntensity;

  void main() {
    vSeed = aSeed;
    vIntensity = uIntensity;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

    float pulse = sin(uTime * (1.5 + aSeed * 5.0) + aSeed * 20.0) * 0.5 + 0.5;
    float size = aSizeBase * (1.0 + pulse * 2.5) * uPointScale;
    size *= (0.6 + uIntensity * 1.2);

    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform vec3  uColor;
  uniform float uIntensity;
  uniform float uTime;

  varying float vSeed;
  varying float vIntensity;

  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;

    float alpha = smoothstep(0.5, 0.15, dist);
    float core = smoothstep(0.5, 0.0, dist);

    float flicker = sin(uTime * (3.0 + vSeed * 8.0)) * 0.35 + 0.65;
    float baseAlpha = 0.3 * flicker;

    vec3 glow = uColor * (1.0 + core * (0.8 + vIntensity * 1.5));
    vec3 whiteCore = vec3(1.0) * core * 0.6 * vIntensity;

    vec3 finalColor = glow + whiteCore;
    float finalAlpha = (baseAlpha + core * 0.35 * vIntensity) * alpha;

    gl_FragColor = vec4(finalColor, clamp(finalAlpha, 0.0, 0.85));
  }
`;

type MotionMode = 'circle' | 'brownian' | 'pulse' | 'linear';

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
}

export class WaveOverlay {
  public readonly points: THREE.Points;
  private geometry: THREE.BufferGeometry;
  private material: THREE.ShaderMaterial;
  private positions: Float32Array;
  private seeds: Float32Array;
  private sizeBases: Float32Array;
  private positionAttr: THREE.BufferAttribute;

  private particles: ParticleData[];
  private startTime: number;
  private lastTime: number;
  private currentStatus: CognitiveStatus;
  private currentColorHex: string;
  private intensity: number;

  constructor() {
    this.startTime = performance.now();
    this.lastTime = this.startTime;
    this.currentStatus = 'focus';
    this.currentColorHex = '#00aaff';
    this.intensity = 0.75;

    this.geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(PARTICLE_COUNT * 3);
    this.seeds = new Float32Array(PARTICLE_COUNT);
    this.sizeBases = new Float32Array(PARTICLE_COUNT);
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

      const axisX = Math.random() - 0.5;
      const axisY = Math.random() - 0.5;
      const axisZ = Math.random() - 0.5;
      const axisLen = Math.sqrt(axisX * axisX + axisY * axisY + axisZ * axisZ) || 1;

      const speed = 0.5;
      const dirTheta = Math.random() * Math.PI * 2;
      const dirPhi = Math.acos(2 * Math.random() - 1);

      this.particles[i] = {
        baseX: x,
        baseY: y,
        baseZ: z,
        phase: Math.random() * Math.PI * 2,
        radius: 0.04 + Math.random() * 0.03,
        axisX: axisX / axisLen,
        axisY: axisY / axisLen,
        axisZ: axisZ / axisLen,
        vx: Math.sin(dirPhi) * Math.cos(dirTheta) * speed,
        vy: Math.sin(dirPhi) * Math.sin(dirTheta) * speed,
        vz: Math.cos(dirPhi) * speed,
        seed: Math.random(),
        sizeBase: 1.0 + Math.random() * 3.0,
      };

      this.positions[i * 3 + 0] = x;
      this.positions[i * 3 + 1] = y;
      this.positions[i * 3 + 2] = z;
      this.seeds[i] = this.particles[i].seed;
      this.sizeBases[i] = this.particles[i].sizeBase;
    }

    this.positionAttr = new THREE.BufferAttribute(this.positions, 3);
    this.geometry.setAttribute('position', this.positionAttr);
    this.geometry.setAttribute('aSeed', new THREE.BufferAttribute(this.seeds, 1));
    this.geometry.setAttribute('aSizeBase', new THREE.BufferAttribute(this.sizeBases, 1));

    const [r, g, b] = hexToRgbVec(this.currentColorHex);

    this.material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: this.intensity },
        uColor: { value: new THREE.Color(r, g, b) },
        uPointScale: { value: 1.0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
  }

  public setWaveIntensity(status: CognitiveStatus, colorHex: string, intensity: number): void {
    this.currentStatus = status;
    this.currentColorHex = colorHex;
    this.intensity = intensity;
    const [r, g, b] = hexToRgbVec(colorHex);
    this.material.uniforms.uColor.value.setRGB(r, g, b);
    this.material.uniforms.uIntensity.value = intensity;
  }

  private modeFromStatus(status: CognitiveStatus): MotionMode {
    switch (status) {
      case 'focus':   return 'circle';
      case 'relax':   return 'brownian';
      case 'sleep':   return 'pulse';
      case 'excited': return 'linear';
    }
  }

  public update(now: number): void {
    const t = (now - this.startTime) * 0.001;
    const dt = Math.min(0.05, (now - this.lastTime) * 0.001);
    this.lastTime = now;
    this.material.uniforms.uTime.value = t;

    const mode = this.modeFromStatus(this.currentStatus);
    const positions = this.positions;
    const particles = this.particles;
    const intensity = this.intensity;
    const maxR2 = (BRAIN_RADIUS * 1.25) * (BRAIN_RADIUS * 1.25);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = particles[i];
      const ix = i * 3;
      let x: number, y: number, z: number;

      switch (mode) {
        case 'circle': {
          const phase = p.phase + t * 2.0;
          const cr = p.radius * (0.6 + intensity * 0.9);
          const cosPh = Math.cos(phase) * cr;
          const sinPh = Math.sin(phase) * cr;
          const tx = p.axisX, ty = p.axisY, tz = p.axisZ;
          const px = -ty, py = tx, pz = 0;
          let pl = Math.sqrt(px * px + py * py + pz * pz) || 1;
          const pxn = px / pl, pyn = py / pl, pzn = pz / pl;
          const qx = ty * pzn - tz * pyn;
          const qy = tz * pxn - tx * pzn;
          const qz = tx * pyn - ty * pxn;
          x = p.baseX + cosPh * pxn + sinPh * qx;
          y = p.baseY + cosPh * pyn + sinPh * qy;
          z = p.baseZ + cosPh * pzn + sinPh * qz;
          break;
        }
        case 'brownian': {
          const step = 0.02 * (0.5 + intensity * 1.2) * dt * 60;
          const bx = (Math.random() - 0.5) * step;
          const by = (Math.random() - 0.5) * step;
          const bz = (Math.random() - 0.5) * step;
          x = p.baseX + bx;
          y = p.baseY + by;
          z = p.baseZ + bz;
          p.baseX = x;
          p.baseY = y;
          p.baseZ = z;
          const dr2 = x * x + y * y + z * z;
          if (dr2 > maxR2) {
            const scale = BRAIN_RADIUS / Math.sqrt(dr2);
            x *= scale; y *= scale; z *= scale;
            p.baseX = x; p.baseY = y; p.baseZ = z;
          } else if (dr2 < (BRAIN_RADIUS * 0.8) * (BRAIN_RADIUS * 0.8)) {
            const scale = BRAIN_RADIUS * 0.95 / Math.sqrt(dr2);
            x *= scale; y *= scale; z *= scale;
            p.baseX = x; p.baseY = y; p.baseZ = z;
          }
          break;
        }
        case 'pulse': {
          const pulse = Math.sin(t * 1.4 + p.seed * 12.0) * 0.5 + 0.5;
          const noiseX = (Math.random() - 0.5) * 0.003;
          const noiseY = (Math.random() - 0.5) * 0.003;
          const noiseZ = (Math.random() - 0.5) * 0.003;
          const expand = 1.0 + pulse * 0.04 * (0.4 + intensity * 0.6);
          x = p.baseX * expand + noiseX;
          y = p.baseY * expand + noiseY;
          z = p.baseZ * expand + noiseZ;
          break;
        }
        case 'linear': {
          const speedMul = (0.4 + intensity * 0.8);
          x = (positions[ix] || p.baseX) + p.vx * dt * speedMul;
          y = (positions[ix + 1] || p.baseY) + p.vy * dt * speedMul;
          z = (positions[ix + 2] || p.baseZ) + p.vz * dt * speedMul;
          const dr2 = x * x + y * y + z * z;
          if (dr2 > maxR2 || dr2 < (BRAIN_RADIUS * 0.8) * (BRAIN_RADIUS * 0.8)) {
            const normalX = x, normalY = y, normalZ = z;
            const nl = Math.sqrt(normalX * normalX + normalY * normalY + normalZ * normalZ) || 1;
            const nx = normalX / nl, ny = normalY / nl, nz = normalZ / nl;
            const dotV = p.vx * nx + p.vy * ny + p.vz * nz;
            p.vx = p.vx - 2 * dotV * nx;
            p.vy = p.vy - 2 * dotV * ny;
            p.vz = p.vz - 2 * dotV * nz;
            if (dr2 > maxR2) {
              const s = BRAIN_RADIUS * 1.2 / Math.sqrt(dr2);
              x *= s; y *= s; z *= s;
            } else {
              const s = BRAIN_RADIUS * 0.82 / Math.sqrt(dr2);
              x *= s; y *= s; z *= s;
            }
          }
          if (Math.random() < 0.01) {
            const spd = 0.35 + Math.random() * 0.5;
            const dTh = Math.random() * Math.PI * 2;
            const dPh = Math.acos(2 * Math.random() - 1);
            p.vx = Math.sin(dPh) * Math.cos(dTh) * spd;
            p.vy = Math.sin(dPh) * Math.sin(dTh) * spd;
            p.vz = Math.cos(dPh) * spd;
          }
          break;
        }
      }

      positions[ix] = x;
      positions[ix + 1] = y;
      positions[ix + 2] = z;
    }

    this.positionAttr.needsUpdate = true;
  }

  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}
