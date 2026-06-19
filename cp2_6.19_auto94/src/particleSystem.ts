import * as THREE from 'three';
import { FrequencyBands } from './audioAnalyzer';

export interface ParticleSystemOptions {
  count: number;
  opacity: number;
  speedMultiplier: number;
  sensitivity: number;
}

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const smoothstep = (edge0: number, edge1: number, x: number): number => {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};
const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);
const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));

const FADE_STATE_NORMAL = 0;
const FADE_STATE_OUT = 1;
const FADE_STATE_IN = 2;
const FADE_DURATION = 0.5;

const vertexShader = `
  attribute float size;
  attribute float alpha;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = color;
    vAlpha = alpha;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * 300.0 / -mvPosition.z;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;
  uniform float globalOpacity;

  void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    if (dist > 0.5) discard;
    float softEdge = smoothstep(0.5, 0.15, dist);
    gl_FragColor = vec4(vColor, softEdge * vAlpha * globalOpacity);
  }
`;

export class ParticleSystem {
  private scene: THREE.Scene;
  private particleCount: number;
  private points: THREE.Points;
  private geometry: THREE.BufferGeometry;
  private material: THREE.ShaderMaterial;

  private positions: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;
  private alphas: Float32Array;

  private basePositionsX: Float32Array;
  private basePositionsZ: Float32Array;

  private baseSizes: Float32Array;
  private rotations: Float32Array;
  private rotationSpeeds: Float32Array;
  private speedJitters: Float32Array;
  private targetSizes: Float32Array;
  private currentSizes: Float32Array;

  private driftAmplitudes: Float32Array;
  private driftFrequenciesX: Float32Array;
  private driftFrequenciesZ: Float32Array;
  private driftPhasesX: Float32Array;
  private driftPhasesZ: Float32Array;
  private globalTime: number;

  private targetColors: Float32Array;
  private currentColors: Float32Array;
  private tempColor: THREE.Color;
  private tempHsl: { h: number; s: number; l: number };

  private targetVelocities: Float32Array;
  private currentVelocities: Float32Array;

  private fadeStates: Int8Array;
  private fadeTimers: Float32Array;

  private opacity: number;
  private speedMultiplier: number;
  private sensitivity: number;

  private readonly TOP_Y = 10;
  private readonly BOTTOM_Y = -10;
  private readonly FADE_OUT_Y = -9.2;
  private readonly X_MIN = -8;
  private readonly X_MAX = 8;
  private readonly Z_MIN = -6;
  private readonly Z_MAX = 6;

  private readonly MIN_SIZE = 0.05;
  private readonly MAX_SIZE = 0.4;
  private readonly MIN_SPEED = 0.1;
  private readonly MAX_SPEED = 2.0;

  private readonly COLOR_WHITE = new THREE.Color(0xffffff);

  private hasAudio: boolean = false;

  private positionAttribute: THREE.BufferAttribute;
  private colorAttribute: THREE.BufferAttribute;
  private sizeAttribute: THREE.BufferAttribute;
  private alphaAttribute: THREE.BufferAttribute;

  constructor(scene: THREE.Scene, options: ParticleSystemOptions) {
    this.scene = scene;
    this.particleCount = options.count;
    this.opacity = options.opacity;
    this.speedMultiplier = options.speedMultiplier;
    this.sensitivity = options.sensitivity;
    this.globalTime = 0;

    this.positions = new Float32Array(this.particleCount * 3);
    this.colors = new Float32Array(this.particleCount * 3);
    this.sizes = new Float32Array(this.particleCount);
    this.alphas = new Float32Array(this.particleCount);

    this.basePositionsX = new Float32Array(this.particleCount);
    this.basePositionsZ = new Float32Array(this.particleCount);

    this.baseSizes = new Float32Array(this.particleCount);
    this.rotations = new Float32Array(this.particleCount);
    this.rotationSpeeds = new Float32Array(this.particleCount);
    this.speedJitters = new Float32Array(this.particleCount);
    this.targetSizes = new Float32Array(this.particleCount);
    this.currentSizes = new Float32Array(this.particleCount);

    this.driftAmplitudes = new Float32Array(this.particleCount);
    this.driftFrequenciesX = new Float32Array(this.particleCount);
    this.driftFrequenciesZ = new Float32Array(this.particleCount);
    this.driftPhasesX = new Float32Array(this.particleCount);
    this.driftPhasesZ = new Float32Array(this.particleCount);

    this.targetColors = new Float32Array(this.particleCount * 3);
    this.currentColors = new Float32Array(this.particleCount * 3);
    this.tempColor = new THREE.Color();
    this.tempHsl = { h: 0, s: 0, l: 0 };

    this.targetVelocities = new Float32Array(this.particleCount);
    this.currentVelocities = new Float32Array(this.particleCount);

    this.fadeStates = new Int8Array(this.particleCount);
    this.fadeTimers = new Float32Array(this.particleCount);

    this.initParticles();

    this.geometry = new THREE.BufferGeometry();
    this.positionAttribute = new THREE.BufferAttribute(this.positions, 3);
    this.colorAttribute = new THREE.BufferAttribute(this.colors, 3);
    this.sizeAttribute = new THREE.BufferAttribute(this.sizes, 1);
    this.alphaAttribute = new THREE.BufferAttribute(this.alphas, 1);

    this.geometry.setAttribute('position', this.positionAttribute);
    this.geometry.setAttribute('color', this.colorAttribute);
    this.geometry.setAttribute('size', this.sizeAttribute);
    this.geometry.setAttribute('alpha', this.alphaAttribute);

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        globalOpacity: { value: this.opacity }
      },
      vertexColors: true,
      vertexShader,
      fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);
  }

  private initParticles(): void {
    for (let i = 0; i < this.particleCount; i++) {
      this.resetParticle(i, true);

      const baseSize = 0.05 + Math.random() * 0.1;
      this.baseSizes[i] = baseSize;
      this.sizes[i] = baseSize;
      this.currentSizes[i] = baseSize;
      this.targetSizes[i] = baseSize;

      this.speedJitters[i] = 0.7 + Math.random() * 0.6;

      this.currentVelocities[i] = 0;
      this.targetVelocities[i] = 0;

      this.rotations[i] = Math.random() * Math.PI * 2;
      this.rotationSpeeds[i] = 0.01 + Math.random() * 0.04;

      this.driftAmplitudes[i] = 0.1 + Math.random() * 0.2;
      this.driftFrequenciesX[i] = 0.5 + Math.random() * 1.5;
      this.driftFrequenciesZ[i] = 0.5 + Math.random() * 1.5;
      this.driftPhasesX[i] = Math.random() * Math.PI * 2;
      this.driftPhasesZ[i] = Math.random() * Math.PI * 2;

      this.fadeStates[i] = FADE_STATE_NORMAL;
      this.fadeTimers[i] = 0;
      this.alphas[i] = 1.0;

      const i3 = i * 3;
      this.colors[i3] = 1;
      this.colors[i3 + 1] = 1;
      this.colors[i3 + 2] = 1;

      this.currentColors[i3] = 1;
      this.currentColors[i3 + 1] = 1;
      this.currentColors[i3 + 2] = 1;

      this.targetColors[i3] = 1;
      this.targetColors[i3 + 1] = 1;
      this.targetColors[i3 + 2] = 1;
    }
  }

  private resetParticle(i: number, initial: boolean = false): void {
    const i3 = i * 3;
    const bx = this.X_MIN + Math.random() * (this.X_MAX - this.X_MIN);
    const bz = this.Z_MIN + Math.random() * (this.Z_MAX - this.Z_MIN);
    this.basePositionsX[i] = bx;
    this.basePositionsZ[i] = bz;
    this.positions[i3] = bx;
    this.positions[i3 + 2] = bz;

    this.driftAmplitudes[i] = 0.1 + Math.random() * 0.2;
    this.driftFrequenciesX[i] = 0.5 + Math.random() * 1.5;
    this.driftFrequenciesZ[i] = 0.5 + Math.random() * 1.5;
    this.driftPhasesX[i] = Math.random() * Math.PI * 2;
    this.driftPhasesZ[i] = Math.random() * Math.PI * 2;

    if (initial) {
      this.positions[i3 + 1] = this.BOTTOM_Y + Math.random() * (this.TOP_Y - this.BOTTOM_Y);
    } else {
      this.positions[i3 + 1] = this.TOP_Y + Math.random() * 2;
    }
  }

  setOpacity(opacity: number): void {
    this.opacity = opacity;
    this.material.uniforms.globalOpacity.value = opacity;
  }

  setSpeedMultiplier(multiplier: number): void {
    this.speedMultiplier = multiplier;
  }

  setSensitivity(sensitivity: number): void {
    this.sensitivity = sensitivity;
  }

  setHasAudio(has: boolean): void {
    this.hasAudio = has;
  }

  update(frequencyBands: FrequencyBands | null, deltaTime: number): void {
    const dt = Math.min(deltaTime * 60, 2);
    const realDt = Math.min(deltaTime, 0.05);
    this.globalTime += realDt;

    let low = 0, mid = 0, high = 0;
    if (frequencyBands) {
      low = easeOutCubic(Math.min(frequencyBands.low * this.sensitivity, 1));
      mid = easeOutCubic(Math.min(frequencyBands.mid * this.sensitivity, 1));
      high = easeOutCubic(Math.min(frequencyBands.high * this.sensitivity, 1));
    }

    const overallIntensity = (low + mid + high) / 3;

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;

      const fadeState = this.fadeStates[i];
      let fadeAlpha = this.alphas[i];

      if (fadeState === FADE_STATE_OUT) {
        this.fadeTimers[i] += realDt;
        const t = clamp01(this.fadeTimers[i] / FADE_DURATION);
        fadeAlpha = 1 - easeOutCubic(t);
        if (t >= 1) {
          this.fadeStates[i] = FADE_STATE_IN;
          this.fadeTimers[i] = 0;
          fadeAlpha = 0;
          this.resetParticle(i, false);
        }
      } else if (fadeState === FADE_STATE_IN) {
        this.fadeTimers[i] += realDt;
        const t = clamp01(this.fadeTimers[i] / FADE_DURATION);
        fadeAlpha = easeOutCubic(t);
        if (t >= 1) {
          this.fadeStates[i] = FADE_STATE_NORMAL;
          this.fadeTimers[i] = 0;
          fadeAlpha = 1;
        }
      }

      const y = this.positions[i3 + 1];
      const totalHeight = this.TOP_Y - this.BOTTOM_Y;
      const normalizedLife = clamp01((this.TOP_Y - y) / totalHeight);

      let lifeAlphaCoef: number;
      if (normalizedLife < 0.15) {
        lifeAlphaCoef = lerp(0.3, 1.0, normalizedLife / 0.15);
      } else if (normalizedLife > 0.8) {
        lifeAlphaCoef = lerp(1.0, 0.2, (normalizedLife - 0.8) / 0.2);
      } else {
        lifeAlphaCoef = 1.0;
      }

      let lifeSizeCoef: number;
      if (normalizedLife < 0.12) {
        lifeSizeCoef = lerp(0.35, 1.0, normalizedLife / 0.12);
      } else if (normalizedLife > 0.85) {
        lifeSizeCoef = lerp(1.0, 0.4, (normalizedLife - 0.85) / 0.15);
      } else {
        lifeSizeCoef = 1.0;
      }

      this.alphas[i] = fadeAlpha * lifeAlphaCoef;

      const noise = (Math.sin(i * 12.9898 + 78.233) * 43758.5453) % 1;
      const jitter = Math.abs(noise) * 0.3;

      const lowFactor = smoothstep(0.0, 0.4, low) * (0.7 + jitter * 0.6);
      const midFactor = smoothstep(0.0, 0.3, mid) * (0.7 + ((Math.sin(i * 0.37) + 1) * 0.15));

      const jitteredLowFactor = lowFactor * this.speedJitters[i];

      const targetSpeed = this.hasAudio
        ? lerp(this.MIN_SPEED, this.MAX_SPEED, clamp01(jitteredLowFactor))
        : this.MIN_SPEED * 0.3 * this.speedJitters[i];
      this.targetVelocities[i] = targetSpeed;

      this.currentVelocities[i] = lerp(this.currentVelocities[i], this.targetVelocities[i], 0.08);

      const newY = y - this.currentVelocities[i] * this.speedMultiplier * dt;
      this.positions[i3 + 1] = newY;

      if (fadeState === FADE_STATE_NORMAL && newY < this.FADE_OUT_Y) {
        this.fadeStates[i] = FADE_STATE_OUT;
        this.fadeTimers[i] = 0;
      }

      const driftAmp = this.driftAmplitudes[i] * (this.hasAudio ? (0.8 + low * 0.6) : 1.0);
      const driftX = Math.sin(this.globalTime * this.driftFrequenciesX[i] + this.driftPhasesX[i]) * driftAmp;
      const driftZ = Math.cos(this.globalTime * this.driftFrequenciesZ[i] + this.driftPhasesZ[i]) * driftAmp;

      let baseX = this.basePositionsX[i];
      let baseZ = this.basePositionsZ[i];

      this.rotations[i] += this.rotationSpeeds[i] * dt;
      const sinR = Math.sin(this.rotations[i]);
      const cosR = Math.cos(this.rotations[i]);
      const rotAmount = this.hasAudio ? (0.02 + low * 0.08) : 0.01;

      const cx = 0;
      const cz = 0;
      const dx = baseX - cx;
      const dz = baseZ - cz;
      const rotatedX = cx + dx * cosR * rotAmount - dz * sinR * rotAmount + baseX * (1 - rotAmount);
      const rotatedZ = cz + dx * sinR * rotAmount + dz * cosR * rotAmount + baseZ * (1 - rotAmount);

      this.positions[i3] = Math.max(this.X_MIN, Math.min(this.X_MAX, rotatedX + driftX));
      this.positions[i3 + 2] = Math.max(this.Z_MIN, Math.min(this.Z_MAX, rotatedZ + driftZ));

      const targetSize = this.hasAudio
        ? lerp(this.MIN_SIZE, this.MAX_SIZE, midFactor) * (0.8 + this.baseSizes[i])
        : this.baseSizes[i];
      this.targetSizes[i] = targetSize;
      this.currentSizes[i] = lerp(this.currentSizes[i], this.targetSizes[i], 0.1);
      this.sizes[i] = this.currentSizes[i] * lifeSizeCoef;

      let r: number, g: number, b: number;
      if (this.hasAudio) {
        const lr = smoothstep(0.0, 0.35, low) * (0.85 + jitter * 0.3);
        const mr = smoothstep(0.0, 0.30, mid) * (0.85 + ((Math.sin(i * 0.19) + 1) * 0.15));
        const hr = smoothstep(0.0, 0.25, high) * (0.85 + ((Math.cos(i * 0.27) + 1) * 0.15));

        const baseLevel = 0.12;
        const maxBand = Math.max(lr, mr, hr);
        const brightnessBoost = 0.5 + overallIntensity * 0.5;

        r = baseLevel + lr * 0.88 * brightnessBoost;
        g = baseLevel + mr * 0.88 * brightnessBoost;
        b = baseLevel + hr * 0.88 * brightnessBoost;

        if (maxBand < 0.15) {
          const warmT = 1 - maxBand / 0.15;
          r = lerp(r, 0.35, warmT * 0.5);
          g = lerp(g, 0.20, warmT * 0.5);
          b = lerp(b, 0.45, warmT * 0.5);
        }

        const peakBoost = 1 + maxBand * 0.3;
        r = Math.min(r * peakBoost, 1);
        g = Math.min(g * peakBoost, 1);
        b = Math.min(b * peakBoost, 1);

        const satFactor = clamp01(0.55 + low * 0.75 - mid * 0.55);
        this.tempColor.setRGB(r, g, b);
        this.tempColor.getHSL(this.tempHsl);
        this.tempHsl.s = lerp(0.18, 1.0, satFactor);
        this.tempColor.setHSL(this.tempHsl.h, this.tempHsl.s, this.tempHsl.l);
        r = this.tempColor.r;
        g = this.tempColor.g;
        b = this.tempColor.b;
      } else {
        r = this.COLOR_WHITE.r;
        g = this.COLOR_WHITE.g;
        b = this.COLOR_WHITE.b;
      }

      this.targetColors[i3] = r;
      this.targetColors[i3 + 1] = g;
      this.targetColors[i3 + 2] = b;

      this.currentColors[i3] = lerp(this.currentColors[i3], this.targetColors[i3], 0.08);
      this.currentColors[i3 + 1] = lerp(this.currentColors[i3 + 1], this.targetColors[i3 + 1], 0.08);
      this.currentColors[i3 + 2] = lerp(this.currentColors[i3 + 2], this.targetColors[i3 + 2], 0.08);

      this.colors[i3] = this.currentColors[i3];
      this.colors[i3 + 1] = this.currentColors[i3 + 1];
      this.colors[i3 + 2] = this.currentColors[i3 + 2];
    }

    this.positionAttribute.needsUpdate = true;
    this.colorAttribute.needsUpdate = true;
    this.sizeAttribute.needsUpdate = true;
    this.alphaAttribute.needsUpdate = true;
  }

  dispose(): void {
    this.scene.remove(this.points);
    this.geometry.dispose();
    this.material.dispose();
  }
}
