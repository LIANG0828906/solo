import * as THREE from 'three';

interface ThemeParams {
  colors: string[];
  particleColor: string;
  glowIntensity: number;
  particleSize: number;
  floatAmplitude: number;
  floatSpeed: number;
  scalePulseAmplitude: number;
  scalePulseSpeed: number;
  driftX: number;
  opacityGradient: number;
  flickerFrequency: number;
  flickerAmplitude: number;
}

const THEMES: Record<string, ThemeParams> = {
  flame: {
    colors: ['#ff4400', '#ff8800', '#ffcc00', '#ff2200'],
    particleColor: '#ff6600',
    glowIntensity: 1.2,
    particleSize: 1.5,
    floatAmplitude: 0.3,
    floatSpeed: 2.0,
    scalePulseAmplitude: 0.3,
    scalePulseSpeed: 1.5,
    driftX: 0,
    opacityGradient: 0,
    flickerFrequency: 0.5,
    flickerAmplitude: 0.1,
  },
  aurora: {
    colors: ['#00ff88', '#00ccff', '#8800ff', '#00ffcc'],
    particleColor: '#00ffaa',
    glowIntensity: 0.8,
    particleSize: 1.0,
    floatAmplitude: 0.05,
    floatSpeed: 0.5,
    scalePulseAmplitude: 0.05,
    scalePulseSpeed: 0.3,
    driftX: 0.5,
    opacityGradient: 0.6,
    flickerFrequency: 0.2,
    flickerAmplitude: 0.05,
  },
  neon: {
    colors: ['#ff00ff', '#00ffff', '#ff0088', '#8800ff'],
    particleColor: '#ff00ff',
    glowIntensity: 2.0,
    particleSize: 1.2,
    floatAmplitude: 0.1,
    floatSpeed: 1.0,
    scalePulseAmplitude: 0.1,
    scalePulseSpeed: 0.8,
    driftX: 0,
    opacityGradient: 0,
    flickerFrequency: 3.0,
    flickerAmplitude: 0.4,
  },
};

const NUMERIC_KEYS: (keyof ThemeParams)[] = [
  'glowIntensity',
  'particleSize',
  'floatAmplitude',
  'floatSpeed',
  'scalePulseAmplitude',
  'scalePulseSpeed',
  'driftX',
  'opacityGradient',
  'flickerFrequency',
  'flickerAmplitude',
];

const WAVE_BAR_COUNT = 64;
const TRANSITION_DURATION = 1.5;
const DENSITY_MULTIPLIER = 10;

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerpNumber(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpColor(a: THREE.Color, b: THREE.Color, t: number, out: THREE.Color): void {
  out.r = lerpNumber(a.r, b.r, t);
  out.g = lerpNumber(a.g, b.g, t);
  out.b = lerpNumber(a.b, b.b, t);
}

export interface AudioAnalysisData {
  frequencies: Uint8Array | number[];
  waveform: Uint8Array | number[];
  bass: number;
  mid: number;
  treble: number;
  amplitude: number;
  beat: boolean;
  currentTime: number;
  duration: number;
}

export class VisualEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;

  private currentThemeParams: ThemeParams;
  private targetThemeParams: ThemeParams | null = null;
  private transitionProgress = 0;
  private isTransitioning = false;

  private densityValue = 20;
  private particleCount = 200;
  private particles: THREE.Points | null = null;
  private particleGeometry: THREE.BufferGeometry | null = null;
  private basePositions: Float32Array | null = null;
  private particleSizes: Float32Array | null = null;

  private waveBars: THREE.Mesh[] = [];
  private waveBarGroup: THREE.Group;

  private twinklePoints: THREE.Points | null = null;
  private twinkleCount = 80;
  private twinkleGeometry: THREE.BufferGeometry | null = null;

  private progressLine: THREE.Line | null = null;
  private progressGeometry: THREE.BufferGeometry | null = null;
  private playbackProgress = 0;

  private frequencyData: number[] = [];
  private bassEnergy = 0;
  private midEnergy = 0;
  private trebleEnergy = 0;
  private amplitudeValue = 0;
  private beatDetected = false;

  private waveSensitivity = 3;
  private rotationSpeedValue = 1;

  private clock = new THREE.Clock();
  private animationId: number | null = null;

  private tmpColorA = new THREE.Color();
  private tmpColorB = new THREE.Color();

  constructor(container: HTMLElement) {
    this.container = container;
    this.currentThemeParams = { ...THEMES.flame };

    this.scene = new THREE.Scene();

    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    this.camera.position.z = 5;

    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setClearColor(0x000000, 0);
    container.appendChild(this.renderer.domElement);

    this.waveBarGroup = new THREE.Group();
    this.scene.add(this.waveBarGroup);

    this.createParticles();
    this.createWaveBars();
    this.createTwinklePoints();
    this.createProgressIndicator();

    window.addEventListener('resize', this.onResize);
  }

  private onResize = () => {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private createParticles(): void {
    if (this.particles) {
      this.scene.remove(this.particles);
      this.particleGeometry!.dispose();
      (this.particles.material as THREE.Material).dispose();
    }

    const count = this.particleCount;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    this.basePositions = new Float32Array(count * 3);
    this.particleSizes = new Float32Array(count);

    const theme = this.currentThemeParams;
    const baseColor = new THREE.Color(theme.particleColor);
    const radius = 2.0;

    for (let i = 0; i < count; i++) {
      const r = radius * Math.sqrt(Math.random());
      const theta = Math.random() * Math.PI * 2;
      const x = r * Math.cos(theta);
      const y = r * Math.sin(theta);
      const z = (Math.random() - 0.5) * 0.5;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      this.basePositions[i * 3] = x;
      this.basePositions[i * 3 + 1] = y;
      this.basePositions[i * 3 + 2] = z;

      colors[i * 3] = baseColor.r;
      colors[i * 3 + 1] = baseColor.g;
      colors[i * 3 + 2] = baseColor.b;

      sizes[i] = theme.particleSize;
      this.particleSizes[i] = theme.particleSize;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      vertexColors: true,
      sizeAttenuation: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      size: theme.particleSize,
    });

    this.particles = new THREE.Points(geometry, material);
    this.particleGeometry = geometry;
    this.scene.add(this.particles);
  }

  private createWaveBars(): void {
    for (const bar of this.waveBars) {
      this.waveBarGroup.remove(bar);
      bar.geometry.dispose();
      (bar.material as THREE.Material).dispose();
    }
    this.waveBars = [];

    for (let i = 0; i < WAVE_BAR_COUNT; i++) {
      const angle = (i / WAVE_BAR_COUNT) * Math.PI * 2;
      const radius = 2.8;
      const geometry = new THREE.BoxGeometry(0.04, 0.01, 0.04);
      const colorIndex = i % this.currentThemeParams.colors.length;
      const color = new THREE.Color(this.currentThemeParams.colors[colorIndex]);
      const material = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.7,
      });
      const bar = new THREE.Mesh(geometry, material);
      bar.position.set(
        radius * Math.cos(angle),
        0,
        radius * Math.sin(angle)
      );
      bar.lookAt(0, 0, 0);
      this.waveBarGroup.add(bar);
      this.waveBars.push(bar);
    }
  }

  private createTwinklePoints(): void {
    if (this.twinklePoints) {
      this.scene.remove(this.twinklePoints);
      this.twinkleGeometry!.dispose();
      (this.twinklePoints.material as THREE.Material).dispose();
    }

    const count = this.twinkleCount;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const theme = this.currentThemeParams;
    const baseColor = new THREE.Color(theme.particleColor);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 1.5 + Math.random() * 1.5;
      positions[i * 3] = radius * Math.cos(angle);
      positions[i * 3 + 1] = 1.5 + Math.random() * 1.0;
      positions[i * 3 + 2] = radius * Math.sin(angle);

      colors[i * 3] = baseColor.r;
      colors[i * 3 + 1] = baseColor.g;
      colors[i * 3 + 2] = baseColor.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      vertexColors: true,
      sizeAttenuation: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      size: 0.05,
      opacity: 0.0,
    });

    this.twinklePoints = new THREE.Points(geometry, material);
    this.twinkleGeometry = geometry;
    this.scene.add(this.twinklePoints);
  }

  private createProgressIndicator(): void {
    if (this.progressLine) {
      this.scene.remove(this.progressLine);
      this.progressGeometry!.dispose();
      (this.progressLine.material as THREE.Material).dispose();
    }

    const segments = 128;
    const positions = new Float32Array(segments * 3);
    const colors = new Float32Array(segments * 3);
    const radius = 1.0;

    for (let i = 0; i < segments; i++) {
      const t = i / (segments - 1);
      const angle = t * Math.PI * 2;
      positions[i * 3] = radius * Math.cos(angle);
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = radius * Math.sin(angle);

      const blue = new THREE.Color('#0066ff');
      const purple = new THREE.Color('#8800ff');
      const c = blue.clone().lerp(purple, t);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
    });

    this.progressLine = new THREE.Line(geometry, material);
    this.progressGeometry = geometry;
    this.scene.add(this.progressLine);
  }

  private getInterpolatedTheme(): ThemeParams {
    if (!this.isTransitioning || !this.targetThemeParams) {
      return this.currentThemeParams;
    }
    const t = easeInOutCubic(this.transitionProgress);
    const result: ThemeParams = {
      colors: [],
      particleColor: '',
      glowIntensity: 0,
      particleSize: 0,
      floatAmplitude: 0,
      floatSpeed: 0,
      scalePulseAmplitude: 0,
      scalePulseSpeed: 0,
      driftX: 0,
      opacityGradient: 0,
      flickerFrequency: 0,
      flickerAmplitude: 0,
    };

    for (const key of NUMERIC_KEYS) {
      (result as any)[key] = lerpNumber(
        this.currentThemeParams[key] as number,
        this.targetThemeParams[key] as number,
        t
      );
    }

    this.tmpColorA.set(this.currentThemeParams.particleColor);
    this.tmpColorB.set(this.targetThemeParams.particleColor);
    const lerped = new THREE.Color();
    lerpColor(this.tmpColorA, this.tmpColorB, t, lerped);
    result.particleColor = '#' + lerped.getHexString();

    const maxColors = Math.max(
      this.currentThemeParams.colors.length,
      this.targetThemeParams.colors.length
    );
    for (let i = 0; i < maxColors; i++) {
      const a = new THREE.Color(
        this.currentThemeParams.colors[i % this.currentThemeParams.colors.length]
      );
      const b = new THREE.Color(
        this.targetThemeParams.colors[i % this.targetThemeParams.colors.length]
      );
      const c = new THREE.Color();
      lerpColor(a, b, t, c);
      result.colors.push('#' + c.getHexString());
    }

    return result;
  }

  private updateThemeTransition(delta: number): void {
    if (!this.isTransitioning || !this.targetThemeParams) return;

    this.transitionProgress += delta / TRANSITION_DURATION;
    if (this.transitionProgress >= 1) {
      this.transitionProgress = 1;
      this.currentThemeParams = { ...this.targetThemeParams };
      this.targetThemeParams = null;
      this.isTransitioning = false;
    }
  }

  private updateParticles(time: number, theme: ThemeParams): void {
    if (!this.particles || !this.particleGeometry || !this.basePositions || !this.particleSizes) return;

    const positions = this.particleGeometry.attributes.position.array as Float32Array;
    const colors = this.particleGeometry.attributes.color.array as Float32Array;
    const count = this.particleCount;
    const baseColor = new THREE.Color(theme.particleColor);

    const bass = this.bassEnergy / 255;
    const expandFactor = 1.0 + bass * 0.5;

    for (let i = 0; i < count; i++) {
      const bx = this.basePositions[i * 3];
      const by = this.basePositions[i * 3 + 1];
      const bz = this.basePositions[i * 3 + 2];

      const floatOffset = theme.floatAmplitude * Math.sin(time * theme.floatSpeed + i * 1.7);
      const driftOffset = theme.driftX * time;

      let x = bx * expandFactor + driftOffset;
      let y = by * expandFactor + floatOffset;
      const z = bz;

      const maxDrift = 4.0;
      if (theme.driftX !== 0) {
        x = ((x + maxDrift) % (maxDrift * 2)) - maxDrift;
      }

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const pulseScale = 1.0 + theme.scalePulseAmplitude * Math.sin(time * theme.scalePulseSpeed + i * 0.9);
      this.particleSizes[i] = theme.particleSize * pulseScale;

      const dist = Math.sqrt(bx * bx + by * by);
      const maxDist = 2.0;
      const opacityFactor = theme.opacityGradient > 0
        ? 1.0 - (dist / maxDist) * theme.opacityGradient
        : 1.0;

      const flicker = 1.0 - theme.flickerAmplitude *
        (0.5 + 0.5 * Math.sin(time * theme.flickerFrequency * Math.PI * 2 + i * 2.3));

      const brightness = opacityFactor * flicker * theme.glowIntensity;
      colors[i * 3] = baseColor.r * brightness;
      colors[i * 3 + 1] = baseColor.g * brightness;
      colors[i * 3 + 2] = baseColor.b * brightness;
    }

    this.particleGeometry.attributes.position.needsUpdate = true;
    this.particleGeometry.attributes.color.needsUpdate = true;

    (this.particles.material as THREE.PointsMaterial).size = theme.particleSize;
  }

  private updateWaveBars(theme: ThemeParams): void {
    for (let i = 0; i < this.waveBars.length; i++) {
      const dataIndex = Math.floor((i / WAVE_BAR_COUNT) * this.frequencyData.length);
      const raw = this.frequencyData[dataIndex] || 0;
      const value = (raw / 255) * this.waveSensitivity;
      const height = Math.max(0.01, value * 2.0);
      this.waveBars[i].scale.y = height;

      const colorIndex = i % theme.colors.length;
      const color = new THREE.Color(theme.colors[colorIndex]);
      (this.waveBars[i].material as THREE.MeshBasicMaterial).color.copy(color);
    }
  }

  private updateTwinklePoints(theme: ThemeParams): void {
    if (!this.twinklePoints || !this.twinkleGeometry) return;

    const treble = this.trebleEnergy / 255;
    const material = this.twinklePoints.material as THREE.PointsMaterial;
    material.opacity = treble * theme.glowIntensity * 0.8;

    const colors = this.twinkleGeometry.attributes.color.array as Float32Array;
    const baseColor = new THREE.Color(theme.particleColor);
    for (let i = 0; i < this.twinkleCount; i++) {
      colors[i * 3] = baseColor.r;
      colors[i * 3 + 1] = baseColor.g;
      colors[i * 3 + 2] = baseColor.b;
    }
    this.twinkleGeometry.attributes.color.needsUpdate = true;
  }

  private updateProgressIndicator(): void {
    if (!this.progressLine || !this.progressGeometry) return;

    const segments = 128;
    const drawCount = Math.max(2, Math.floor(segments * this.playbackProgress));
    this.progressGeometry.setDrawRange(0, drawCount);
  }

  updateAudioData(data: AudioAnalysisData): void {
    const freq = data.frequencies;
    if (ArrayBuffer.isView(freq)) {
      this.frequencyData = Array.from(freq as Uint8Array);
    } else {
      this.frequencyData = freq as number[];
    }
    this.bassEnergy = data.bass;
    this.midEnergy = data.mid;
    this.trebleEnergy = data.treble;
    this.amplitudeValue = data.amplitude;
    this.beatDetected = data.beat;

    if (data.duration > 0) {
      this.playbackProgress = data.currentTime / data.duration;
    }
  }

  setTheme(themeName: 'flame' | 'aurora' | 'neon'): void {
    const theme = THEMES[themeName];
    if (!theme) return;
    this.targetThemeParams = { ...theme };
    this.transitionProgress = 0;
    this.isTransitioning = true;
  }

  setParticleDensity(density: number): void {
    this.densityValue = density;
    this.particleCount = density * DENSITY_MULTIPLIER;
    this.createParticles();
  }

  setWaveSensitivity(sensitivity: number): void {
    this.waveSensitivity = sensitivity;
  }

  setRotationSpeed(speed: number): void {
    this.rotationSpeedValue = speed;
  }

  animate(): void {
    const delta = this.clock.getDelta();
    const time = this.clock.getElapsedTime();

    this.updateThemeTransition(delta);

    const theme = this.getInterpolatedTheme();

    this.updateParticles(time, theme);
    this.updateWaveBars(theme);
    this.updateTwinklePoints(theme);
    this.updateProgressIndicator();

    const angle = time * this.rotationSpeedValue * 0.15;
    const radius = 5;
    this.camera.position.x = radius * Math.sin(angle);
    this.camera.position.z = radius * Math.cos(angle);
    this.camera.lookAt(0, 0, 0);

    this.renderer.render(this.scene, this.camera);

    this.animationId = requestAnimationFrame(() => this.animate());
  }

  getCanvas(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  dispose(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener('resize', this.onResize);

    if (this.particles) {
      this.scene.remove(this.particles);
      this.particleGeometry?.dispose();
      (this.particles.material as THREE.Material).dispose();
    }
    if (this.twinklePoints) {
      this.scene.remove(this.twinklePoints);
      this.twinkleGeometry?.dispose();
      (this.twinklePoints.material as THREE.Material).dispose();
    }
    if (this.progressLine) {
      this.scene.remove(this.progressLine);
      this.progressGeometry?.dispose();
      (this.progressLine.material as THREE.Material).dispose();
    }
    for (const bar of this.waveBars) {
      this.waveBarGroup.remove(bar);
      bar.geometry.dispose();
      (bar.material as THREE.Material).dispose();
    }
    this.waveBars = [];
    this.scene.remove(this.waveBarGroup);

    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
