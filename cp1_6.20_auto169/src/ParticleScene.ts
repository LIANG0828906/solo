import * as THREE from 'three';

export type VisualStyle = 'flame' | 'nebula' | 'aurora';

interface StyleConfig {
  colorStart: THREE.Color;
  colorEnd: THREE.Color;
  particleSize: number;
  speed: number;
  fadeRate: number;
  motionPattern: 'radial' | 'wave' | 'spiral';
  twinkle: boolean;
}

const STYLE_CONFIGS: Record<VisualStyle, StyleConfig> = {
  flame: {
    colorStart: new THREE.Color(0xff3300),
    colorEnd: new THREE.Color(0xffcc00),
    particleSize: 3.0,
    speed: 1.5,
    fadeRate: 0.015,
    motionPattern: 'radial',
    twinkle: false,
  },
  nebula: {
    colorStart: new THREE.Color(0x3300ff),
    colorEnd: new THREE.Color(0xff00ff),
    particleSize: 2.0,
    speed: 0.8,
    fadeRate: 0.008,
    motionPattern: 'spiral',
    twinkle: true,
  },
  aurora: {
    colorStart: new THREE.Color(0x00ff88),
    colorEnd: new THREE.Color(0x00aaff),
    particleSize: 2.5,
    speed: 1.0,
    fadeRate: 0.01,
    motionPattern: 'wave',
    twinkle: false,
  },
};

const MAX_PARTICLES = 15000;

interface ParticleData {
  positions: Float32Array;
  colors: Float32Array;
  sizes: Float32Array;
  velocities: Float32Array;
  lifetimes: Float32Array;
  maxLifetimes: Float32Array;
  active: boolean[];
}

export class ParticleScene {
  private container: HTMLElement | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private particles: THREE.Points | null = null;
  private particleData: ParticleData | null = null;
  private geometry: THREE.BufferGeometry | null = null;
  private material: THREE.PointsMaterial | null = null;

  private currentStyle: VisualStyle = 'flame';
  private targetStyle: VisualStyle = 'flame';
  private styleTransitionProgress: number = 1;
  private transitionDuration: number = 1000;
  private lastTime: number = 0;

  private animationId: number | null = null;
  private time: number = 0;

  private lowFrequency: number = 0;
  private midFrequency: number = 0;
  private highFrequency: number = 0;

  private particleCount: number = 0;

  constructor() {}

  init(container: HTMLElement): void {
    this.container = container;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0d0d0d);

    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.z = 50;

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    this.initParticles();

    window.addEventListener('resize', this.handleResize);
  }

  private initParticles(): void {
    const positions = new Float32Array(MAX_PARTICLES * 3);
    const colors = new Float32Array(MAX_PARTICLES * 3);
    const sizes = new Float32Array(MAX_PARTICLES);
    const velocities = new Float32Array(MAX_PARTICLES * 3);
    const lifetimes = new Float32Array(MAX_PARTICLES);
    const maxLifetimes = new Float32Array(MAX_PARTICLES);
    const active: boolean[] = new Array(MAX_PARTICLES).fill(false);

    this.particleData = {
      positions,
      colors,
      sizes,
      velocities,
      lifetimes,
      maxLifetimes,
      active,
    };

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    this.material = new THREE.PointsMaterial({
      size: STYLE_CONFIGS.flame.particleSize,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this.particles = new THREE.Points(this.geometry, this.material);
    this.scene?.add(this.particles);
  }

  private spawnParticle(index: number, config: StyleConfig): void {
    if (!this.particleData) return;

    const { positions, velocities, colors, sizes, lifetimes, maxLifetimes, active } = this.particleData;

    const i3 = index * 3;

    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    const radius = Math.random() * 2;

    positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = radius * Math.cos(phi);

    const speed = config.speed * (0.5 + Math.random() * 0.5);
    velocities[i3] = (positions[i3] / radius) * speed;
    velocities[i3 + 1] = (positions[i3 + 1] / radius) * speed;
    velocities[i3 + 2] = (positions[i3 + 2] / radius) * speed;

    const color = new THREE.Color().lerpColors(config.colorStart, config.colorEnd, Math.random());
    colors[i3] = color.r;
    colors[i3 + 1] = color.g;
    colors[i3 + 2] = color.b;

    sizes[index] = config.particleSize * (0.5 + Math.random() * 0.5);
    maxLifetimes[index] = 2 + Math.random() * 3;
    lifetimes[index] = maxLifetimes[index];
    active[index] = true;
  }

  update(spectrumData: Uint8Array | null): void {
    if (!spectrumData) return;

    const sampleRate = 44100;
    const fftSize = 256;
    const binCount = spectrumData.length;
    const freqPerBin = sampleRate / 2 / binCount;

    let lowSum = 0;
    let lowCount = 0;
    let midSum = 0;
    let midCount = 0;
    let highSum = 0;
    let highCount = 0;

    for (let i = 0; i < binCount; i++) {
      const freq = i * freqPerBin;
      const value = spectrumData[i] / 255;

      if (freq < 200) {
        lowSum += value;
        lowCount++;
      } else if (freq < 2000) {
        midSum += value;
        midCount++;
      } else if (freq < 8000) {
        highSum += value;
        highCount++;
      }
    }

    this.lowFrequency = lowCount > 0 ? lowSum / lowCount : 0;
    this.midFrequency = midCount > 0 ? midSum / midCount : 0;
    this.highFrequency = highCount > 0 ? highSum / highCount : 0;
  }

  setStyle(style: VisualStyle): void {
    if (style !== this.targetStyle) {
      this.targetStyle = style;
      this.styleTransitionProgress = 0;
    }
  }

  getCurrentStyle(): VisualStyle {
    return this.targetStyle;
  }

  private getInterpolatedConfig(): StyleConfig {
    const currentConfig = STYLE_CONFIGS[this.currentStyle];
    const targetConfig = STYLE_CONFIGS[this.targetStyle];
    const t = this.styleTransitionProgress;

    if (t >= 1) {
      this.currentStyle = this.targetStyle;
      return { ...targetConfig };
    }

    return {
      colorStart: new THREE.Color().lerpColors(currentConfig.colorStart, targetConfig.colorStart, t),
      colorEnd: new THREE.Color().lerpColors(currentConfig.colorEnd, targetConfig.colorEnd, t),
      particleSize: currentConfig.particleSize + (targetConfig.particleSize - currentConfig.particleSize) * t,
      speed: currentConfig.speed + (targetConfig.speed - currentConfig.speed) * t,
      fadeRate: currentConfig.fadeRate + (targetConfig.fadeRate - currentConfig.fadeRate) * t,
      motionPattern: t > 0.5 ? targetConfig.motionPattern : currentConfig.motionPattern,
      twinkle: targetConfig.twinkle,
    };
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);

    const currentTime = performance.now();
    const deltaTime = this.lastTime ? (currentTime - this.lastTime) / 1000 : 0.016;
    this.lastTime = currentTime;

    if (this.styleTransitionProgress < 1) {
      this.styleTransitionProgress = Math.min(
        1,
        this.styleTransitionProgress + deltaTime * 1000 / this.transitionDuration
      );
    }

    this.time += deltaTime;
    this.updateParticles(deltaTime);
    this.renderer?.render(this.scene!, this.camera!);
  };

  private updateParticles(deltaTime: number): void {
    if (!this.particleData || !this.geometry) return;

    const config = this.getInterpolatedConfig();
    const { positions, colors, sizes, velocities, lifetimes, maxLifetimes, active } = this.particleData;

    const spawnRate = Math.floor(this.lowFrequency * 200) + 10;
    let spawned = 0;

    for (let i = 0; i < MAX_PARTICLES && spawned < spawnRate; i++) {
      if (!active[i] && this.particleCount < MAX_PARTICLES) {
        this.spawnParticle(i, config);
        this.particleCount++;
        spawned++;
      }
    }

    const speedMultiplier = 1 + this.highFrequency * 3;
    const saturationBoost = this.midFrequency;

    for (let i = 0; i < MAX_PARTICLES; i++) {
      if (!active[i]) continue;

      const i3 = i * 3;

      lifetimes[i] -= config.fadeRate * (1 + this.highFrequency) * 60 * deltaTime;

      if (lifetimes[i] <= 0) {
        active[i] = false;
        this.particleCount--;
        sizes[i] = 0;
        continue;
      }

      const lifeRatio = lifetimes[i] / maxLifetimes[i];

      switch (config.motionPattern) {
        case 'radial':
          positions[i3] += velocities[i3] * speedMultiplier * deltaTime * 10;
          positions[i3 + 1] += velocities[i3 + 1] * speedMultiplier * deltaTime * 10;
          positions[i3 + 2] += velocities[i3 + 2] * speedMultiplier * deltaTime * 10;
          break;
        case 'spiral':
          const angle = this.time * 2 + i * 0.01;
          const spiralRadius = (1 - lifeRatio) * 20;
          positions[i3] += velocities[i3] * speedMultiplier * deltaTime * 5 + Math.cos(angle) * 0.1;
          positions[i3 + 1] += velocities[i3 + 1] * speedMultiplier * deltaTime * 5 + Math.sin(angle) * 0.1;
          positions[i3 + 2] += velocities[i3 + 2] * speedMultiplier * deltaTime * 5;
          break;
        case 'wave':
          positions[i3] += velocities[i3] * speedMultiplier * deltaTime * 8;
          positions[i3 + 1] += Math.sin(this.time * 3 + i * 0.1) * 0.5 + velocities[i3 + 1] * deltaTime * 2;
          positions[i3 + 2] += velocities[i3 + 2] * speedMultiplier * deltaTime * 8;
          break;
      }

      const color = new THREE.Color().lerpColors(config.colorStart, config.colorEnd, 1 - lifeRatio);
      const sat = 1 + saturationBoost * 0.5;
      colors[i3] = Math.min(1, color.r * sat);
      colors[i3 + 1] = Math.min(1, color.g * sat);
      colors[i3 + 2] = Math.min(1, color.b * sat);

      let size = config.particleSize * lifeRatio * (0.5 + this.midFrequency);
      if (config.twinkle) {
        size *= 0.5 + 0.5 * Math.sin(this.time * 10 + i * 0.5);
      }
      sizes[i] = size;
    }

    const positionAttr = this.geometry.getAttribute('position') as THREE.BufferAttribute;
    const colorAttr = this.geometry.getAttribute('color') as THREE.BufferAttribute;
    positionAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;

    if (this.material) {
      this.material.size = config.particleSize;
    }
  }

  start(): void {
    if (!this.animationId) {
      this.lastTime = 0;
      this.animationId = requestAnimationFrame(this.animate);
    }
  }

  stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private handleResize = (): void => {
    if (!this.container || !this.camera || !this.renderer) return;

    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  };

  dispose(): void {
    this.stop();
    window.removeEventListener('resize', this.handleResize);

    if (this.renderer && this.container) {
      this.container.removeChild(this.renderer.domElement);
      this.renderer.dispose();
    }

    this.geometry?.dispose();
    this.material?.dispose();

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.particles = null;
    this.particleData = null;
    this.geometry = null;
    this.material = null;
  }
}
