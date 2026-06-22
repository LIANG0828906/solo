import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { VisualMode } from '../store/useAppStore';

export interface RendererConfig {
  container: HTMLElement;
  minicontainer: HTMLElement;
  particleCount?: number;
}

export interface ParticleData {
  basePosition: THREE.Vector3;
  targetPosition: THREE.Vector3;
  currentPosition: THREE.Vector3;
  frequencyBand: number;
  frequencyBin: number;
}

const BASS_COLOR = new THREE.Color(0xffe66d);
const MID_COLOR = new THREE.Color(0x4ecdc4);
const TREBLE_LOW_COLOR = new THREE.Color(0xff6b6b);
const TREBLE_HIGH_COLOR = new THREE.Color(0xc084fc);

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export class ThreeRenderer {
  private container: HTMLElement;
  private minicontainer: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private miniCamera: THREE.OrthographicCamera;
  private miniRenderer: THREE.WebGLRenderer;
  private miniIndicator: THREE.Mesh;
  private miniDirectionArrow: THREE.ArrowHelper;

  private particleCount: number;
  private particleGeometry: THREE.BufferGeometry;
  private particleMaterial: THREE.PointsMaterial;
  private particles: THREE.Points;
  private particleData: ParticleData[] = [];

  private lineGeometry: THREE.BufferGeometry;
  private lineMaterial: THREE.LineBasicMaterial;
  private lines: THREE.LineSegments;

  private backgroundMesh: THREE.Mesh;
  private clock: THREE.Clock;
  private rafId: number | null = null;
  private visible: boolean = true;
  private visualMode: VisualMode = 'nebula';
  private modeTransitionProgress: number = 1;
  private lastMode: VisualMode = 'nebula';
  private explosionTime: number = 0;

  private lastFrequencyData: Uint8Array;
  private smoothedPositions: Float32Array;
  private smoothedColors: Float32Array;
  private smoothedSizes: Float32Array;

  constructor(config: RendererConfig) {
    console.log('[ThreeRenderer] Constructor called');
    console.log('[ThreeRenderer] container exists:', !!config.container, 'minicontainer exists:', !!config.minicontainer);
    this.container = config.container;
    this.minicontainer = config.minicontainer;
    this.particleCount = config.particleCount ?? 2000;
    this.clock = new THREE.Clock();
    this.lastFrequencyData = new Uint8Array(256);

    this.scene = new THREE.Scene();
    this.camera = this.createCamera();
    this.renderer = this.createRenderer();
    console.log('[ThreeRenderer] Main renderer created, container children now:', this.container.children.length);
    this.controls = this.createControls();

    this.particleGeometry = new THREE.BufferGeometry();
    this.particleMaterial = this.createParticleMaterial();
    this.particles = new THREE.Points(this.particleGeometry, this.particleMaterial);
    this.scene.add(this.particles);

    this.lineGeometry = new THREE.BufferGeometry();
    this.lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.2,
      linewidth: 1.5,
    });
    this.lines = new THREE.LineSegments(this.lineGeometry, this.lineMaterial);
    this.scene.add(this.lines);

    this.backgroundMesh = this.createBackground();
    this.scene.add(this.backgroundMesh);

    this.smoothedPositions = new Float32Array(this.particleCount * 3);
    this.smoothedColors = new Float32Array(this.particleCount * 3);
    this.smoothedSizes = new Float32Array(this.particleCount);

    this.initParticles();
    this.initMiniView();
    console.log('[ThreeRenderer] MiniView created, minicontainer children now:', this.minicontainer.children.length);
    this.setupEventListeners();
    console.log('[ThreeRenderer] Constructor done');
  }

  private createCamera(): THREE.PerspectiveCamera {
    const aspect = this.container.clientWidth / this.container.clientHeight;
    const camera = new THREE.PerspectiveCamera(60, aspect, 1, 1000);
    camera.position.set(0, 80, 180);
    camera.lookAt(0, 0, 0);
    return camera;
  }

  private createRenderer(): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0a0a1a, 1);
    this.container.appendChild(renderer.domElement);
    return renderer;
  }

  private createControls(): OrbitControls {
    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.3;
    controls.zoomSpeed = 0.8;
    controls.panSpeed = 0.5;
    controls.minDistance = 50;
    controls.maxDistance = 400;
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN,
    };
    return controls;
  }

  private createParticleMaterial(): THREE.PointsMaterial {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.3, 'rgba(255,255,255,0.8)');
    gradient.addColorStop(0.6, 'rgba(255,255,255,0.2)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    const texture = new THREE.CanvasTexture(canvas);

    return new THREE.PointsMaterial({
      size: 5,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.8,
      vertexColors: true,
      map: texture,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }

  private createBackground(): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(600, 32, 32);
    const material = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        uTime: { value: 0 },
        uInnerColor: { value: new THREE.Color(0x1a1a3e) },
        uOuterColor: { value: new THREE.Color(0x0a0a1a) },
      },
      vertexShader: `
        varying vec3 vPosition;
        void main() {
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uInnerColor;
        uniform vec3 uOuterColor;
        varying vec3 vPosition;

        void main() {
          float dist = length(vPosition.xy) / 600.0;
          float angle = atan(vPosition.y, vPosition.x) + uTime * 0.033;
          float swirl = sin(angle * 3.0) * 0.05;
          float t = clamp(dist + swirl, 0.0, 1.0);
          vec3 color = mix(uInnerColor, uOuterColor, t);
          gl_FragColor = vec4(color, 1.0);
        }
      `,
    });
    return new THREE.Mesh(geometry, material);
  }

  private initParticles(): void {
    const positions = new Float32Array(this.particleCount * 3);
    const colors = new Float32Array(this.particleCount * 3);
    const sizes = new Float32Array(this.particleCount);

    for (let i = 0; i < this.particleCount; i++) {
      const basePos = this.generateNebulaPosition(i);
      const band = this.getFrequencyBandForIndex(i);

      this.particleData.push({
        basePosition: basePos.clone(),
        targetPosition: basePos.clone(),
        currentPosition: basePos.clone(),
        frequencyBand: band,
        frequencyBin: this.getBinForIndex(i),
      });

      positions[i * 3] = basePos.x;
      positions[i * 3 + 1] = basePos.y;
      positions[i * 3 + 2] = basePos.z;

      const color = this.getColorForBand(band, 0.5);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = 5;

      this.smoothedPositions[i * 3] = basePos.x;
      this.smoothedPositions[i * 3 + 1] = basePos.y;
      this.smoothedPositions[i * 3 + 2] = basePos.z;
      this.smoothedColors[i * 3] = color.r;
      this.smoothedColors[i * 3 + 1] = color.g;
      this.smoothedColors[i * 3 + 2] = color.b;
      this.smoothedSizes[i] = 5;
    }

    this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  }

  private getBinForIndex(index: number): number {
    const normalized = index / this.particleCount;
    return Math.floor(normalized * this.lastFrequencyData.length);
  }

  private getFrequencyBandForIndex(index: number): number {
    const bin = this.getBinForIndex(index);
    const totalBins = this.lastFrequencyData.length;
    if (bin < totalBins * 0.1) return 0;
    if (bin < totalBins * 0.5) return 1;
    return 2;
  }

  private getColorForBand(band: number, intensity: number): THREE.Color {
    const color = new THREE.Color();
    switch (band) {
      case 0:
        color.copy(BASS_COLOR);
        break;
      case 1:
        color.copy(MID_COLOR);
        break;
      case 2:
      default: {
        const normalizedBin = (this.getBinForIndex(Math.floor(band * this.particleCount / 3)) - this.lastFrequencyData.length * 0.5) / (this.lastFrequencyData.length * 0.5);
        color.copy(TREBLE_LOW_COLOR).lerp(TREBLE_HIGH_COLOR, Math.max(0, Math.min(1, normalizedBin)));
        break;
      }
    }
    const saturationBoost = 0.5 + intensity * 0.5;
    const hsl = { h: 0, s: 0, l: 0 };
    color.getHSL(hsl);
    color.setHSL(hsl.h, Math.min(1, hsl.s * saturationBoost), Math.min(0.85, hsl.l * (0.7 + intensity * 0.3)));
    return color;
  }

  private generateNebulaPosition(index: number): THREE.Vector3 {
    const t = index / this.particleCount;
    const arm = Math.floor(t * 4);
    const armAngle = (arm / 4) * Math.PI * 2;
    const radius = 100 + (t * 100);
    const angle = t * Math.PI * 8 + armAngle;
    const heightOffset = (Math.random() - 0.5) * 40;
    const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 20;
    const z = Math.sin(angle) * radius + (Math.random() - 0.5) * 20;
    const y = heightOffset + Math.sin(t * Math.PI * 4) * 15;
    return new THREE.Vector3(x, y, z);
  }

  private generateWaveformPosition(index: number): THREE.Vector3 {
    const x = (index / this.particleCount) * 300 - 150;
    const y = 0;
    const z = (Math.random() - 0.5) * 20;
    return new THREE.Vector3(x, y, z);
  }

  private generateExplosionPosition(index: number): THREE.Vector3 {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const radius = 100 + Math.random() * 100;
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);
    return new THREE.Vector3(x, y, z);
  }

  private getBasePositionForMode(index: number, mode: VisualMode): THREE.Vector3 {
    switch (mode) {
      case 'waveform':
        return this.generateWaveformPosition(index);
      case 'explosion':
        return this.generateExplosionPosition(index);
      case 'nebula':
      default:
        return this.generateNebulaPosition(index);
    }
  }

  public setVisualMode(mode: VisualMode): void {
    if (this.visualMode === mode) return;
    this.lastMode = this.visualMode;
    this.visualMode = mode;
    this.modeTransitionProgress = 0;

    for (let i = 0; i < this.particleCount; i++) {
      const newBase = this.getBasePositionForMode(i, mode);
      this.particleData[i].basePosition.copy(newBase);
    }
  }

  public updateFrequencyData(data: Uint8Array): void {
    this.lastFrequencyData = data;
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  private updateParticles(): void {
    const positions = this.particleGeometry.attributes.position.array as Float32Array;
    const colors = this.particleGeometry.attributes.color.array as Float32Array;
    const sizes = this.particleGeometry.attributes.size.array as Float32Array;

    if (this.modeTransitionProgress < 1) {
      this.modeTransitionProgress = Math.min(1, this.modeTransitionProgress + 0.016);
    }
    const modeT = this.easeOutCubic(this.modeTransitionProgress);

    if (this.visualMode === 'explosion') {
      this.explosionTime += 0.016;
    }

    for (let i = 0; i < this.particleCount; i++) {
      const pd = this.particleData[i];
      const bin = pd.frequencyBin;
      const energy = this.lastFrequencyData[bin] / 255;

      let baseX = pd.basePosition.x;
      let baseY = pd.basePosition.y;
      let baseZ = pd.basePosition.z;

      if (this.visualMode === 'waveform') {
        baseY = (energy - 0.5) * 100;
      } else if (this.visualMode === 'explosion') {
        const phase = (Math.sin(this.explosionTime * 2 + i * 0.01) + 1) / 2;
        const explosionScale = 1 + phase * energy * 1.5;
        baseX *= explosionScale;
        baseY *= explosionScale;
        baseZ *= explosionScale;
      }

      const direction = new THREE.Vector3(baseX, baseY, baseZ).normalize();
      const displacement = energy * 60;

      const targetX = baseX + direction.x * displacement;
      const targetY = baseY + direction.y * displacement;
      const targetZ = baseZ + direction.z * displacement;

      this.smoothedPositions[i * 3] = lerp(this.smoothedPositions[i * 3], targetX, 0.1);
      this.smoothedPositions[i * 3 + 1] = lerp(this.smoothedPositions[i * 3 + 1], targetY, 0.1);
      this.smoothedPositions[i * 3 + 2] = lerp(this.smoothedPositions[i * 3 + 2], targetZ, 0.1);

      positions[i * 3] = this.smoothedPositions[i * 3];
      positions[i * 3 + 1] = this.smoothedPositions[i * 3 + 1];
      positions[i * 3 + 2] = this.smoothedPositions[i * 3 + 2];

      const color = this.getColorForBand(pd.frequencyBand, energy);
      this.smoothedColors[i * 3] = lerp(this.smoothedColors[i * 3], color.r, 0.1);
      this.smoothedColors[i * 3 + 1] = lerp(this.smoothedColors[i * 3 + 1], color.g, 0.1);
      this.smoothedColors[i * 3 + 2] = lerp(this.smoothedColors[i * 3 + 2], color.b, 0.1);

      colors[i * 3] = this.smoothedColors[i * 3];
      colors[i * 3 + 1] = this.smoothedColors[i * 3 + 1];
      colors[i * 3 + 2] = this.smoothedColors[i * 3 + 2];

      const targetSize = 3 + energy * 7;
      this.smoothedSizes[i] = lerp(this.smoothedSizes[i], targetSize, 0.1);
      sizes[i] = this.smoothedSizes[i];

      this.particleMaterial.opacity = 0.3 + energy * 0.7;
    }

    this.particleGeometry.attributes.position.needsUpdate = true;
    this.particleGeometry.attributes.color.needsUpdate = true;
    this.particleGeometry.attributes.size.needsUpdate = true;

    this.updateLines(positions, colors);
  }

  private updateLines(positions: Float32Array, colors: Float32Array): void {
    const maxLines = 4000;
    const linePositions: number[] = [];
    const lineColors: number[] = [];
    const thresholdSq = 80 * 80;
    let lineCount = 0;

    const sampleStep = Math.max(1, Math.floor(this.particleCount / 400));

    for (let i = 0; i < this.particleCount && lineCount < maxLines; i += sampleStep) {
      for (let j = i + sampleStep; j < this.particleCount && lineCount < maxLines; j += sampleStep) {
        const dx = positions[i * 3] - positions[j * 3];
        const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
        const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
        const distSq = dx * dx + dy * dy + dz * dz;

        if (distSq < thresholdSq) {
          linePositions.push(
            positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2],
            positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]
          );
          lineColors.push(
            colors[i * 3], colors[i * 3 + 1], colors[i * 3 + 2],
            colors[j * 3], colors[j * 3 + 1], colors[j * 3 + 2]
          );
          lineCount++;
        }
      }
    }

    this.lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    this.lineGeometry.setAttribute('color', new THREE.Float32BufferAttribute(lineColors, 3));
    this.lineGeometry.attributes.position.needsUpdate = true;
    this.lineGeometry.attributes.color.needsUpdate = true;
  }

  private initMiniView(): void {
    const miniScene = new THREE.Scene();

    const miniAspect = 160 / 120;
    this.miniCamera = new THREE.OrthographicCamera(
      -250 * miniAspect, 250 * miniAspect, 250, -250, 0.1, 1000
    );
    this.miniCamera.position.set(0, 500, 0);
    this.miniCamera.lookAt(0, 0, 0);

    const gridHelper = new THREE.GridHelper(400, 10, 0x4ecdc4, 0x2a2a44);
    miniScene.add(gridHelper);

    const centerSphere = new THREE.Mesh(
      new THREE.SphereGeometry(8, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x4ecdc4 })
    );
    miniScene.add(centerSphere);

    const triShape = new THREE.Shape();
    triShape.moveTo(0, 20);
    triShape.lineTo(-10, -10);
    triShape.lineTo(10, -10);
    triShape.closePath();
    const triGeometry = new THREE.ShapeGeometry(triShape);
    const triMaterial = new THREE.MeshBasicMaterial({ color: 0xff6b6b, side: THREE.DoubleSide });
    this.miniIndicator = new THREE.Mesh(triGeometry, triMaterial);
    this.miniIndicator.rotation.x = -Math.PI / 2;
    miniScene.add(this.miniIndicator);

    this.miniRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.miniRenderer.setSize(160, 120);
    this.miniRenderer.setClearColor(0x000000, 0);
    this.minicontainer.appendChild(this.miniRenderer.domElement);

    (this.miniRenderer as any).miniScene = miniScene;
  }

  private updateMiniView(): void {
    const miniScene = (this.miniRenderer as any).miniScene as THREE.Scene;
    if (!miniScene) return;

    const camDir = new THREE.Vector3();
    this.camera.getWorldDirection(camDir);
    const angle = Math.atan2(camDir.x, camDir.z);

    this.miniIndicator.rotation.z = -angle + Math.PI;

    this.miniRenderer.render(miniScene, this.miniCamera);
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.handleResize);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  private handleResize = (): void => {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private handleVisibilityChange = (): void => {
    this.visible = !document.hidden;
    if (this.visible && this.rafId === null) {
      this.start();
    }
  };

  private animate = (): void => {
    if (!this.visible) return;
    this.rafId = requestAnimationFrame(this.animate);

    const elapsed = this.clock.getElapsedTime();
    (this.backgroundMesh.material as THREE.ShaderMaterial).uniforms.uTime.value = elapsed;

    this.updateParticles();
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this.updateMiniView();
  };

  public start(): void {
    if (this.rafId !== null) return;
    this.visible = true;
    this.animate();
  }

  public stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  public dispose(): void {
    this.stop();
    window.removeEventListener('resize', this.handleResize);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    this.controls.dispose();
    this.renderer.dispose();
    this.miniRenderer.dispose();
    this.particleGeometry.dispose();
    this.lineGeometry.dispose();
    this.particleMaterial.dispose();
    this.lineMaterial.dispose();
    this.backgroundMesh.geometry.dispose();
    (this.backgroundMesh.material as THREE.Material).dispose();
  }
}
