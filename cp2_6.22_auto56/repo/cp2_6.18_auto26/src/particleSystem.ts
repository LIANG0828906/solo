import * as THREE from 'three';
import { gsap } from 'gsap';
import { eventBus } from './eventBus';

interface ParticleData {
  x: number;
  y: number;
  z: number;
  baseY: number;
  baseSize: number;
  currentSize: number;
  baseBrightness: number;
  currentBrightness: number;
  fadeOpacity: number;
  phase: number;
  flickerPhase: number;
  hovered: boolean;
  targetSize: number;
  targetBrightness: number;
  glowRadius: number;
  glowOpacity: number;
  targetGlowRadius: number;
  targetGlowOpacity: number;
  tweenId: number;
}

interface ColorStop {
  r: number;
  g: number;
  b: number;
}

const COLOR_THEMES: Record<string, ColorStop[]> = {
  aurora: [
    { r: 0x00 / 255, g: 0x33 / 255, b: 0xff / 255 },
    { r: 0x99 / 255, g: 0x00 / 255, b: 0xff / 255 },
    { r: 0xff / 255, g: 0x00 / 255, b: 0xcc / 255 },
  ],
  fire: [
    { r: 0xff / 255, g: 0x00 / 255, b: 0x00 / 255 },
    { r: 0xff / 255, g: 0x66 / 255, b: 0x00 / 255 },
    { r: 0xff / 255, g: 0xff / 255, b: 0x00 / 255 },
  ],
  ocean: [
    { r: 0x00 / 255, g: 0x66 / 255, b: 0xff / 255 },
    { r: 0x00 / 255, g: 0xcc / 255, b: 0x99 / 255 },
    { r: 0x00 / 255, g: 0xff / 255, b: 0xff / 255 },
  ],
};

const WAVELENGTH = 5;
const HOVER_RADIUS = 0.3;
const DEFAULT_GLOW_RADIUS = 2;
const DEFAULT_GLOW_OPACITY = 0.3;
const HOVER_GLOW_RADIUS = 4;
const HOVER_GLOW_OPACITY = 0.6;
const HOVER_SIZE_MULTIPLIER = 1.8;
const HOVER_BRIGHTNESS = 1.5;
const FADE_DURATION = 0.2;
const RECOVERY_DURATION = 0.3;

const vertexShader = /* glsl */ `
  attribute float size;
  attribute vec3 color;
  varying vec3 vColor;
  void main() {
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    if (dist > 0.5) discard;
    float alpha = smoothstep(0.5, 0.0, dist);
    alpha = pow(alpha, 1.5);
    gl_FragColor = vec4(vColor, alpha);
  }
`;

export class ParticleSystem {
  private particles: ParticleData[] = [];
  public geometry: THREE.BufferGeometry;
  public material: THREE.ShaderMaterial;
  public points: THREE.Points;

  private positions: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;

  private amplitude = 0.5;
  private speed = 0.8;
  private colorTheme = 'aurora';
  private time = 0;
  private nearestHoverIndex = -1;

  constructor() {
    this.geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(10000 * 3);
    this.colors = new Float32Array(10000 * 3);
    this.sizes = new Float32Array(10000);

    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

    this.material = new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: false,
    });

    this.points = new THREE.Points(this.geometry, this.material);

    this.initParticles(5000);
    this.bindEvents();
  }

  private bindEvents(): void {
    eventBus.on('param:amplitude', (value: unknown) => {
      this.amplitude = value as number;
    });
    eventBus.on('param:speed', (value: unknown) => {
      this.speed = value as number;
    });
    eventBus.on('param:count', (value: unknown) => {
      this.setParticleCount(value as number);
    });
    eventBus.on('param:colorTheme', (value: unknown) => {
      this.colorTheme = value as string;
      this.updateAllColors();
    });
    eventBus.on('hover:nearest', (data: unknown) => {
      const { index, worldPos } = data as { index: number; worldPos: THREE.Vector3 };
      this.handleHover(index, worldPos);
    });
    eventBus.on('hover:clear', () => {
      this.clearHover();
    });
  }

  private createParticle(_index: number, fadeIn = false): ParticleData {
    const x = Math.random() * 30 - 15;
    const z = Math.random() * 30 - 15;
    const baseY = Math.random() * 2 - 1;
    const baseSize = 4 + Math.random() * 12;

    return {
      x,
      y: baseY,
      z,
      baseY,
      baseSize,
      currentSize: baseSize,
      baseBrightness: 1.0,
      currentBrightness: 1.0,
      fadeOpacity: fadeIn ? 0 : 1,
      phase: Math.random() * Math.PI * 2,
      flickerPhase: Math.random() * Math.PI * 2,
      hovered: false,
      targetSize: baseSize,
      targetBrightness: 1.0,
      glowRadius: DEFAULT_GLOW_RADIUS,
      glowOpacity: DEFAULT_GLOW_OPACITY,
      targetGlowRadius: DEFAULT_GLOW_RADIUS,
      targetGlowOpacity: DEFAULT_GLOW_OPACITY,
      tweenId: 0,
    };
  }

  private initParticles(count: number): void {
    this.particles = [];
    for (let i = 0; i < count; i++) {
      this.particles.push(this.createParticle(i));
    }
    this.updateGeometryAttributes();
  }

  private setParticleCount(newCount: number): void {
    const oldCount = this.particles.length;

    if (newCount > oldCount) {
      for (let i = oldCount; i < newCount; i++) {
        const p = this.createParticle(i, true);
        this.particles.push(p);
        gsap.to(p, {
          fadeOpacity: 1,
          duration: FADE_DURATION,
          ease: 'power1.out',
        });
      }
    } else if (newCount < oldCount) {
      const toRemove = oldCount - newCount;
      const indices: number[] = [];
      while (indices.length < toRemove) {
        const idx = Math.floor(Math.random() * this.particles.length);
        if (!indices.includes(idx)) {
          indices.push(idx);
        }
      }
      indices.sort((a, b) => b - a);
      for (const idx of indices) {
        const p = this.particles[idx];
        gsap.to(p, {
          fadeOpacity: 0,
          duration: FADE_DURATION,
          ease: 'power1.in',
          onComplete: () => {
            const realIdx = this.particles.indexOf(p);
            if (realIdx > -1) {
              this.particles.splice(realIdx, 1);
            }
          },
        });
      }
    }
  }

  private lerpColor(t: number): ColorStop {
    const stops = COLOR_THEMES[this.colorTheme] || COLOR_THEMES.aurora;
    const normalizedT = Math.max(0, Math.min(1, t));
    const segmentCount = stops.length - 1;
    const scaledT = normalizedT * segmentCount;
    const segmentIndex = Math.min(Math.floor(scaledT), segmentCount - 1);
    const localT = scaledT - segmentIndex;
    const s1 = stops[segmentIndex];
    const s2 = stops[segmentIndex + 1];
    return {
      r: s1.r + (s2.r - s1.r) * localT,
      g: s1.g + (s2.g - s1.g) * localT,
      b: s1.b + (s2.b - s1.b) * localT,
    };
  }

  private updateAllColors(): void {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const heightNorm = (p.y + 1) / 2;
      const color = this.lerpColor(heightNorm);
      this.colors[i * 3] = color.r;
      this.colors[i * 3 + 1] = color.g;
      this.colors[i * 3 + 2] = color.b;
    }
    (this.geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
  }

  public handleHover(index: number, _worldPos: THREE.Vector3): void {
    if (index < 0 || index >= this.particles.length) return;
    if (this.nearestHoverIndex === index) return;

    this.clearHover();
    this.nearestHoverIndex = index;

    const p = this.particles[index];
    if (!p) return;

    p.hovered = true;

    gsap.killTweensOf(p);

    p.targetSize = p.baseSize * HOVER_SIZE_MULTIPLIER;
    p.targetBrightness = HOVER_BRIGHTNESS;
    p.targetGlowRadius = HOVER_GLOW_RADIUS;
    p.targetGlowOpacity = HOVER_GLOW_OPACITY;

    gsap.to(p, {
      currentSize: p.targetSize,
      duration: 0.15,
      ease: 'power2.out',
    });
    gsap.to(p, {
      currentBrightness: p.targetBrightness,
      duration: 0.15,
      ease: 'power2.out',
    });
    gsap.to(p, {
      glowRadius: p.targetGlowRadius,
      duration: 0.15,
      ease: 'power2.out',
    });
    gsap.to(p, {
      glowOpacity: p.targetGlowOpacity,
      duration: 0.15,
      ease: 'power2.out',
    });
  }

  public clearHover(): void {
    this.nearestHoverIndex = -1;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (p.hovered) {
        p.hovered = false;

        gsap.killTweensOf(p);

        p.targetSize = p.baseSize;
        p.targetBrightness = 1.0;
        p.targetGlowRadius = DEFAULT_GLOW_RADIUS;
        p.targetGlowOpacity = DEFAULT_GLOW_OPACITY;

        gsap.to(p, {
          currentSize: p.targetSize,
          duration: RECOVERY_DURATION,
          ease: 'power2.out',
        });
        gsap.to(p, {
          currentBrightness: p.targetBrightness,
          duration: RECOVERY_DURATION,
          ease: 'power2.out',
        });
        gsap.to(p, {
          glowRadius: p.targetGlowRadius,
          duration: RECOVERY_DURATION,
          ease: 'power2.out',
        });
        gsap.to(p, {
          glowOpacity: p.targetGlowOpacity,
          duration: RECOVERY_DURATION,
          ease: 'power2.out',
        });
      }
    }
  }

  public update(deltaTime: number): void {
    this.time += deltaTime;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      const waveValue = Math.sin(
        (p.x / WAVELENGTH) * Math.PI * 2 + this.time * this.speed + p.phase
      );
      p.y = p.baseY + waveValue * this.amplitude;

      const heightNorm = (p.y + 1) / 2;
      const flickerAmp = 1.0 + heightNorm * 2.0;
      const flicker = Math.sin(this.time * Math.PI * 4 + p.flickerPhase) * flickerAmp;

      if (!p.hovered) {
        p.currentSize = p.baseSize + flicker;
      }

      const color = this.lerpColor(heightNorm);
      const brightness = p.currentBrightness;

      this.positions[i * 3] = p.x;
      this.positions[i * 3 + 1] = p.y;
      this.positions[i * 3 + 2] = p.z;

      this.colors[i * 3] = color.r * brightness * p.fadeOpacity;
      this.colors[i * 3 + 1] = color.g * brightness * p.fadeOpacity;
      this.colors[i * 3 + 2] = color.b * brightness * p.fadeOpacity;

      this.sizes[i] = p.currentSize * p.fadeOpacity;
    }

    this.updateGeometryAttributes();
  }

  private updateGeometryAttributes(): void {
    (this.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (this.geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
    const sizeAttr = this.geometry.attributes.size as THREE.BufferAttribute;
    sizeAttr.needsUpdate = true;
    this.geometry.setDrawRange(0, this.particles.length);
  }

  public getParticleCount(): number {
    return this.particles.length;
  }

  public getHoverRadius(): number {
    return HOVER_RADIUS;
  }

  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}
