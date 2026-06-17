import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { SharedConfig, ParticleData } from './sharedConfig';
import { ImageParser } from './imageParser';

interface ParamTransition {
  startValue: number;
  targetValue: number;
  elapsed: number;
  duration: number;
}

export class ParticleCloud {
  private container: HTMLElement;
  private config: SharedConfig;

  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private clock: THREE.Clock;

  private particles: ParticleData[] = [];
  private points: THREE.Points | null = null;
  private geometry: THREE.BufferGeometry | null = null;
  private material: THREE.PointsMaterial | null = null;
  private time = 0;
  private paused = false;
  private animationId: number | null = null;

  private baseCameraDistance = 6;

  private basePositions = new Float32Array();
  private colors = new Float32Array();
  private sizes = new Float32Array();
  private phases = new Float32Array();
  private periods = new Float32Array();

  private spreadTransition: ParamTransition = { startValue: 1.5, targetValue: 1.5, elapsed: 0, duration: 0.5 };
  private pulseTransition: ParamTransition = { startValue: 1.0, targetValue: 1.0, elapsed: 0, duration: 0.5 };
  private sizeTransition: ParamTransition = { startValue: 4.0, targetValue: 4.0, elapsed: 0, duration: 0.5 };

  private currentSpread = 1.5;
  private currentPulse = 1.0;
  private currentSize = 4.0;

  private onFrameCallback: ((deltaTime: number) => void) | null = null;

  constructor(container: HTMLElement, config: SharedConfig) {
    this.container = container;
    this.config = config;

    this.clock = new THREE.Clock();

    this.scene = new THREE.Scene();
    this.setupBackground();

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.adjustCameraForMobile();
    this.camera.position.set(0, 0, this.baseCameraDistance);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000, 0);
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1;
    this.controls.rotateSpeed = 1;
    this.controls.enablePan = false;
    this.controls.minDistance = this.baseCameraDistance * 0.5;
    this.controls.maxDistance = this.baseCameraDistance * 5;

    this.initTransitions();

    window.addEventListener('resize', () => this.onWindowResize());
  }

  private setupBackground(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 2;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createLinearGradient(0, 0, 2, 2);
    gradient.addColorStop(0, '#0D0B1E');
    gradient.addColorStop(1, '#1A143A');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2, 2);

    const texture = new THREE.CanvasTexture(canvas);
    this.scene.background = texture;
  }

  private initTransitions(): void {
    this.spreadTransition = { startValue: this.config.spreadRadius, targetValue: this.config.spreadRadius, elapsed: 0.5, duration: 0.5 };
    this.pulseTransition = { startValue: this.config.pulseSpeed, targetValue: this.config.pulseSpeed, elapsed: 0.5, duration: 0.5 };
    this.sizeTransition = { startValue: this.config.particleSize, targetValue: this.config.particleSize, elapsed: 0.5, duration: 0.5 };
    this.currentSpread = this.config.spreadRadius;
    this.currentPulse = this.config.pulseSpeed;
    this.currentSize = this.config.particleSize;
  }

  private adjustCameraForMobile(): void {
    if (window.innerWidth < 768) {
      this.baseCameraDistance = 6 * 0.7;
    } else {
      this.baseCameraDistance = 6;
    }
  }

  private onWindowResize(): void {
    const wasMobile = this.baseCameraDistance < 6;
    this.adjustCameraForMobile();
    const isMobileNow = this.baseCameraDistance < 6;

    if (wasMobile !== isMobileNow) {
      this.camera.position.set(0, 0, this.baseCameraDistance);
      this.controls.minDistance = this.baseCameraDistance * 0.5;
      this.controls.maxDistance = this.baseCameraDistance * 5;
      this.controls.update();
    }

    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  loadParticles(particles: ParticleData[]): void {
    this.disposeParticles();
    this.particles = particles;

    const count = particles.length;
    this.basePositions = new Float32Array(count * 3);
    this.colors = new Float32Array(count * 3);
    this.sizes = new Float32Array(count);
    this.phases = new Float32Array(count);
    this.periods = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const p = particles[i];
      this.basePositions[i * 3] = p.x;
      this.basePositions[i * 3 + 1] = p.y;
      this.basePositions[i * 3 + 2] = p.z;
      this.phases[i] = p.phase;
      this.periods[i] = p.period;
      this.sizes[i] = p.size;
    }

    this.applyColors();

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.basePositions), 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

    const adaptiveSize = count > 3000 ? 2 : this.config.particleSize;
    this.currentSize = adaptiveSize;
    this.sizeTransition.startValue = adaptiveSize;
    this.sizeTransition.targetValue = adaptiveSize;
    this.sizeTransition.elapsed = 0.5;

    this.material = new THREE.PointsMaterial({
      size: adaptiveSize,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);
  }

  applyColors(): void {
    const count = this.particles.length;

    for (let i = 0; i < count; i++) {
      const p = this.particles[i];
      let r = p.r;
      let g = p.g;
      let b = p.b;

      if (this.config.colorMode === 'hueGroup') {
        const groupedHue = ImageParser.groupHue(p.h);
        const rgb = ImageParser.hsvToRgb(groupedHue, p.s, 1);
        r = rgb.r;
        g = rgb.g;
        b = rgb.b;
      }

      this.colors[i * 3] = r;
      this.colors[i * 3 + 1] = g;
      this.colors[i * 3 + 2] = b;
    }

    if (this.geometry) {
      const colorAttr = this.geometry.getAttribute('color') as THREE.BufferAttribute;
      colorAttr.needsUpdate = true;
    }
  }

  updateColorMode(): void {
    this.applyColors();

    if (this.material) {
      if (this.config.colorMode === 'brightnessMix') {
        this.material.opacity = 0.9;
      } else {
        this.material.opacity = 1.0;
      }
    }
  }

  onParamChange(): void {
    if (this.config.spreadRadius !== this.spreadTransition.targetValue) {
      this.spreadTransition.startValue = this.currentSpread;
      this.spreadTransition.targetValue = this.config.spreadRadius;
      this.spreadTransition.elapsed = 0;
    }

    if (this.config.pulseSpeed !== this.pulseTransition.targetValue) {
      this.pulseTransition.startValue = this.currentPulse;
      this.pulseTransition.targetValue = this.config.pulseSpeed;
      this.pulseTransition.elapsed = 0;
    }

    const adaptiveSize = this.particles.length > 3000 ? 2 : this.config.particleSize;
    if (adaptiveSize !== this.sizeTransition.targetValue) {
      this.sizeTransition.startValue = this.currentSize;
      this.sizeTransition.targetValue = adaptiveSize;
      this.sizeTransition.elapsed = 0;
    }
  }

  private advanceTransition(t: ParamTransition, deltaTime: number): number {
    if (t.elapsed >= t.duration) return t.targetValue;
    t.elapsed = Math.min(t.elapsed + deltaTime, t.duration);
    const progress = t.elapsed / t.duration;
    const eased = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    return t.startValue + (t.targetValue - t.startValue) * eased;
  }

  private updateParticles(deltaTime: number): void {
    if (this.paused || !this.points || !this.geometry || this.particles.length === 0) return;

    this.time += deltaTime;

    this.currentSpread = this.advanceTransition(this.spreadTransition, deltaTime);
    this.currentPulse = this.advanceTransition(this.pulseTransition, deltaTime);
    this.currentSize = this.advanceTransition(this.sizeTransition, deltaTime);

    const positions = this.geometry.getAttribute('position') as THREE.BufferAttribute;
    const posArray = positions.array as Float32Array;
    const count = this.particles.length;
    const amplitude = this.currentSpread * 0.15;
    const scaleRatio = this.currentSpread / this.config.spreadRadius;

    for (let i = 0; i < count; i++) {
      const bx = this.basePositions[i * 3] * scaleRatio;
      const by = this.basePositions[i * 3 + 1] * scaleRatio;
      const bz = this.basePositions[i * 3 + 2] * scaleRatio;

      const pulse = Math.sin(this.time * this.currentPulse / this.periods[i] + this.phases[i]) * amplitude;
      const len = Math.sqrt(bx * bx + by * by + bz * bz) || 1;

      posArray[i * 3] = bx + (bx / len) * pulse;
      posArray[i * 3 + 1] = by + (by / len) * pulse;
      posArray[i * 3 + 2] = bz + (bz / len) * pulse;
    }

    positions.needsUpdate = true;

    if (this.material) {
      this.material.size = this.currentSize;
      if (this.config.colorMode === 'brightnessMix') {
        this.material.opacity = 0.9;
      } else {
        this.material.opacity = 1.0;
      }
    }
  }

  pauseAnimation(): void {
    this.paused = true;
  }

  resumeAnimation(): void {
    this.paused = false;
  }

  renderFrame(): void {
    this.renderer.render(this.scene, this.camera);
  }

  getCanvasDataURL(): string {
    return this.renderer.domElement.toDataURL('image/png');
  }

  start(): void {
    this.animate();
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);

    const deltaTime = Math.min(this.clock.getDelta(), 0.1);

    this.updateParticles(deltaTime);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);

    if (this.onFrameCallback) {
      this.onFrameCallback(deltaTime);
    }
  };

  setOnFrameCallback(cb: (deltaTime: number) => void): void {
    this.onFrameCallback = cb;
  }

  isMobileView(): boolean {
    return window.innerWidth < 768;
  }

  private disposeParticles(): void {
    if (this.points) {
      this.scene.remove(this.points);
      this.points = null;
    }
    if (this.geometry) {
      this.geometry.dispose();
      this.geometry = null;
    }
    if (this.material) {
      this.material.dispose();
      this.material = null;
    }
    this.particles = [];
  }

  dispose(): void {
    this.disposeParticles();
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.controls.dispose();
    this.renderer.dispose();
  }
}
