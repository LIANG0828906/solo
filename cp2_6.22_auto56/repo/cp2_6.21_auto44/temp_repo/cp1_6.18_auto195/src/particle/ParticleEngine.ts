import { eventBus } from '../utils/EventBus';
import {
  StyleType,
  StyleConfig,
  GestureState,
  ParticleBehavior,
  ParticleData,
  STYLE_CONFIGS,
  DEFAULT_BEHAVIOR
} from '../types';

export class ParticleEngine {
  private particleCount: number = 10000;
  private maxParticles: number = 12000;
  private minParticles: number = 8000;

  private positions: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;

  private basePositions: Float32Array;
  private baseSizes: Float32Array;
  private baseColors: Float32Array;

  private currentStyle: StyleType = 'neon';
  private targetStyle: StyleType = 'neon';
  private styleTransitionProgress: number = 1;
  private styleTransitionDuration: number = 0.5;

  private currentBehavior: ParticleBehavior = { ...DEFAULT_BEHAVIOR };
  private targetBehavior: ParticleBehavior = { ...DEFAULT_BEHAVIOR };
  private behaviorTransitionProgress: number = 1;
  private behaviorTransitionDuration: number = 1;

  private rotationAngle: number = 0;

  private frameWidth: number = 120;
  private frameHeight: number = 90;
  private activeParticleCount: number = 0;

  private jitterOffsets: Float32Array;
  private demoMode: boolean = true;
  private demoTime: number = 0;
  private demoInitialPositions: Float32Array;

  constructor() {
    this.positions = new Float32Array(this.maxParticles * 3);
    this.colors = new Float32Array(this.maxParticles * 3);
    this.sizes = new Float32Array(this.maxParticles);

    this.basePositions = new Float32Array(this.maxParticles * 3);
    this.baseSizes = new Float32Array(this.maxParticles);
    this.baseColors = new Float32Array(this.maxParticles * 3);

    this.jitterOffsets = new Float32Array(this.maxParticles * 3);
    for (let i = 0; i < this.maxParticles * 3; i++) {
      this.jitterOffsets[i] = Math.random() - 0.5;
    }

    this.demoInitialPositions = new Float32Array(this.maxParticles * 3);

    this.setupEventListeners();
    this.initDemoParticles();
  }

  private setupEventListeners(): void {
    eventBus.on('camera:frame', (imageData: ImageData) => {
      this.demoMode = false;
      this.updateFromFrame(imageData);
    });

    eventBus.on('gesture:change', (state: GestureState) => {
      this.updateGestureBehavior(state);
    });

    eventBus.on('style:change', (style: StyleType) => {
      this.setStyle(style);
    });
  }

  private initDemoParticles(): void {
    this.activeParticleCount = 10000;

    for (let i = 0; i < this.activeParticleCount; i++) {
      const posIdx = i * 3;
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 6;
      const height = (Math.random() - 0.5) * 8;

      const x = Math.cos(angle) * radius;
      const y = height;
      const z = Math.sin(angle) * radius;

      this.basePositions[posIdx] = x;
      this.basePositions[posIdx + 1] = y;
      this.basePositions[posIdx + 2] = z;

      this.demoInitialPositions[posIdx] = x;
      this.demoInitialPositions[posIdx + 1] = y;
      this.demoInitialPositions[posIdx + 2] = z;

      this.baseSizes[i] = 0.3 + Math.random() * 0.8;

      const hue = (i / this.activeParticleCount * 360 + 180) % 360;
      const rgb = this.hslToRgb(hue / 360, 0.8, 0.6);
      this.baseColors[posIdx] = rgb.r;
      this.baseColors[posIdx + 1] = rgb.g;
      this.baseColors[posIdx + 2] = rgb.b;
    }

    eventBus.emit('particles:updated', this.getParticleData());
  }

  private hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return { r, g, b };
  }

  private updateDemoParticles(deltaTime: number): void {
    this.demoTime += deltaTime;

    for (let i = 0; i < this.activeParticleCount; i++) {
      const posIdx = i * 3;
      
      const baseX = this.demoInitialPositions[posIdx];
      const baseY = this.demoInitialPositions[posIdx + 1];
      const baseZ = this.demoInitialPositions[posIdx + 2];
      
      const offsetY = Math.sin(this.demoTime * 0.5 + i * 0.01) * 0.5;
      const offsetX = Math.sin(this.demoTime + i * 0.01) * 0.3;
      const offsetZ = Math.cos(this.demoTime * 0.7 + i * 0.01) * 0.3;
      
      this.basePositions[posIdx] = baseX + offsetX;
      this.basePositions[posIdx + 1] = baseY + offsetY;
      this.basePositions[posIdx + 2] = baseZ + offsetZ;
    }
  }

  private updateFromFrame(imageData: ImageData): void {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    this.frameWidth = width;
    this.frameHeight = height;

    const totalPixels = width * height;
    const step = Math.max(1, Math.floor(totalPixels / this.particleCount));
    this.activeParticleCount = Math.min(
      Math.floor(totalPixels / step),
      this.maxParticles
    );
    this.activeParticleCount = Math.max(this.activeParticleCount, this.minParticles);

    const aspectRatio = width / height;
    const scaleX = 10 * aspectRatio;
    const scaleY = 10;

    let particleIndex = 0;

    for (let i = 0; i < totalPixels && particleIndex < this.activeParticleCount; i += step) {
      const pixelIndex = i * 4;
      const r = data[pixelIndex];
      const g = data[pixelIndex + 1];
      const b = data[pixelIndex + 2];

      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

      const x = ((i % width) / width - 0.5) * scaleX;
      const y = (0.5 - Math.floor(i / width) / height) * scaleY;
      const z = (luminance / 255) * 10 - 5;

      const size = 0.1 + (luminance / 255) * 1.1;

      const posIdx = particleIndex * 3;
      this.basePositions[posIdx] = x;
      this.basePositions[posIdx + 1] = y;
      this.basePositions[posIdx + 2] = z;

      this.baseSizes[particleIndex] = size;

      this.baseColors[posIdx] = r / 255;
      this.baseColors[posIdx + 1] = g / 255;
      this.baseColors[posIdx + 2] = b / 255;

      particleIndex++;
    }

    eventBus.emit('particles:updated', this.getParticleData());
  }

  private updateGestureBehavior(state: GestureState): void {
    let spreadRadius = DEFAULT_BEHAVIOR.spreadRadius;
    let rotationSpeed = DEFAULT_BEHAVIOR.rotationSpeed;

    if (state.bothHands) {
      rotationSpeed = 30;
    } else if (state.leftHand) {
      spreadRadius = 8;
    } else if (state.rightHand) {
      spreadRadius = 0.5;
    }

    this.targetBehavior = {
      spreadRadius,
      rotationSpeed,
      transitionProgress: 0
    };
    this.behaviorTransitionProgress = 0;
  }

  private setStyle(style: StyleType): void {
    if (this.targetStyle === style) return;
    this.targetStyle = style;
    this.styleTransitionProgress = 0;
  }

  update(deltaTime: number): void {
    if (this.demoMode) {
      this.updateDemoParticles(deltaTime);
    }

    if (this.styleTransitionProgress < 1) {
      this.styleTransitionProgress = Math.min(
        1,
        this.styleTransitionProgress + deltaTime / this.styleTransitionDuration
      );
    }

    if (this.behaviorTransitionProgress < 1) {
      this.behaviorTransitionProgress = Math.min(
        1,
        this.behaviorTransitionProgress + deltaTime / this.behaviorTransitionDuration
      );
    }

    const t = this.easeOut(this.behaviorTransitionProgress);
    this.currentBehavior.spreadRadius = this.lerp(
      this.currentBehavior.spreadRadius,
      this.targetBehavior.spreadRadius,
      t
    );
    this.currentBehavior.rotationSpeed = this.lerp(
      this.currentBehavior.rotationSpeed,
      this.targetBehavior.rotationSpeed,
      t
    );

    this.rotationAngle += this.currentBehavior.rotationSpeed * deltaTime * (Math.PI / 180);

    this.applyParticleTransforms();
  }

  private applyParticleTransforms(): void {
    const currentStyleConfig = STYLE_CONFIGS[this.currentStyle];
    const targetStyleConfig = STYLE_CONFIGS[this.targetStyle];
    const styleT = this.styleTransitionProgress;

    const spreadFactor = this.currentBehavior.spreadRadius / DEFAULT_BEHAVIOR.spreadRadius;
    const rotationAngle = this.rotationAngle;
    const cosAngle = Math.cos(rotationAngle);
    const sinAngle = Math.sin(rotationAngle);

    const currentJitter = currentStyleConfig.jitter;
    const targetJitter = targetStyleConfig.jitter;
    const jitterAmount = this.lerp(currentJitter, targetJitter, styleT);

    const currentSat = currentStyleConfig.saturation;
    const targetSat = targetStyleConfig.saturation;
    const saturation = this.lerp(currentSat, targetSat, styleT);

    const currentOpacity = currentStyleConfig.opacity;
    const targetOpacity = targetStyleConfig.opacity;
    const opacity = this.lerp(currentOpacity, targetOpacity, styleT);

    const currentFixedSize = currentStyleConfig.fixedSize;
    const targetFixedSize = targetStyleConfig.fixedSize;

    for (let i = 0; i < this.activeParticleCount; i++) {
      const posIdx = i * 3;

      let x = this.basePositions[posIdx];
      let y = this.basePositions[posIdx + 1];
      let z = this.basePositions[posIdx + 2];

      const length = Math.sqrt(x * x + y * y + z * z);
      if (length > 0) {
        const factor = spreadFactor;
        x = x * factor;
        z = z * factor;
      }

      const rotatedX = x * cosAngle - z * sinAngle;
      const rotatedZ = x * sinAngle + z * cosAngle;

      if (jitterAmount > 0) {
        this.positions[posIdx] = rotatedX + this.jitterOffsets[posIdx] * jitterAmount;
        this.positions[posIdx + 1] = y + this.jitterOffsets[posIdx + 1] * jitterAmount;
        this.positions[posIdx + 2] = rotatedZ + this.jitterOffsets[posIdx + 2] * jitterAmount;
      } else {
        this.positions[posIdx] = rotatedX;
        this.positions[posIdx + 1] = y;
        this.positions[posIdx + 2] = rotatedZ;
      }

      let r = this.baseColors[posIdx];
      let g = this.baseColors[posIdx + 1];
      let b = this.baseColors[posIdx + 2];

      if (saturation !== 1) {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        r = gray + (r - gray) * saturation;
        g = gray + (g - gray) * saturation;
        b = gray + (b - gray) * saturation;
      }

      this.colors[posIdx] = r;
      this.colors[posIdx + 1] = g;
      this.colors[posIdx + 2] = b;

      let size = this.baseSizes[i];
      if (currentFixedSize !== null || targetFixedSize !== null) {
        const fromSize = currentFixedSize !== null ? currentFixedSize : size;
        const toSize = targetFixedSize !== null ? targetFixedSize : size;
        size = this.lerp(fromSize, toSize, styleT);
      }

      this.sizes[i] = size * opacity;
    }

    eventBus.emit('particles:render', this.getParticleData());
  }

  getParticleData(): ParticleData {
    return {
      positions: this.positions,
      colors: this.colors,
      sizes: this.sizes,
      count: this.activeParticleCount
    };
  }

  getCurrentStyle(): StyleType {
    return this.styleTransitionProgress >= 1 ? this.targetStyle : this.currentStyle;
  }

  getStyleConfig(): StyleConfig {
    const current = STYLE_CONFIGS[this.currentStyle];
    const target = STYLE_CONFIGS[this.targetStyle];
    const t = this.styleTransitionProgress;

    return {
      bloom: t > 0.5 ? target.bloom : current.bloom,
      bloomIntensity: this.lerp(current.bloomIntensity, target.bloomIntensity, t),
      saturation: this.lerp(current.saturation, target.saturation, t),
      opacity: this.lerp(current.opacity, target.opacity, t),
      jitter: this.lerp(current.jitter, target.jitter, t),
      fixedSize: t > 0.5 ? target.fixedSize : current.fixedSize,
      pixelated: t > 0.5 ? target.pixelated : current.pixelated
    };
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  private easeOut(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  getActiveParticleCount(): number {
    return this.activeParticleCount;
  }
}
