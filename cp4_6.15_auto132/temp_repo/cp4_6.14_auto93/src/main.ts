import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { AudioAnalyzer } from './audioAnalyzer';
import { ParticleSystem } from './particleSystem';
import { UIController } from './uiController';

const COLOR_LOW_RGB = { r: 0xfbbf24 >> 16, g: (0xfbbf24 >> 8) & 0xff, b: 0xfbbf24 & 0xff };
const COLOR_HIGH_RGB = { r: 0xef4444 >> 16, g: (0xef4444 >> 8) & 0xff, b: 0xef4444 & 0xff };

class App {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private particleSystem: ParticleSystem;
  private ring!: THREE.Mesh;
  private ringLights: THREE.Sprite[] = [];
  private audioAnalyzer: AudioAnalyzer | null = null;
  private uiController: UIController;
  private clock: THREE.Clock;
  private sensitivity: number = 0.01;

  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, 12);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000, 1);

    const container = document.getElementById('canvas-container');
    if (container) {
      container.appendChild(this.renderer.domElement);
    }

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.rotateSpeed = this.sensitivity;
    this.controls.enablePan = false;
    this.controls.minDistance = 8;
    this.controls.maxDistance = 30;
    this.controls.target.set(0, 0, 0);

    this.particleSystem = new ParticleSystem(8000);
    this.scene.add(this.particleSystem.points);

    this.createBackgroundRing();

    this.clock = new THREE.Clock();

    this.uiController = new UIController({
      onFileSelected: (file) => this.handleFileSelected(file),
      onTogglePlay: () => this.handleTogglePlay(),
      onReset: () => this.handleReset(),
      onSensitivityChange: (v) => this.handleSensitivityChange(v),
      getAudioAnalyzer: () => this.audioAnalyzer,
    });

    window.addEventListener('resize', () => this.handleResize());

    this.animate();
  }

  private createBackgroundRing(): void {
    const ringGeometry = new THREE.TorusGeometry(10, 0.05, 8, 128);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.3,
    });
    this.ring = new THREE.Mesh(ringGeometry, ringMaterial);
    this.scene.add(this.ring);

    const spriteCanvas = document.createElement('canvas');
    spriteCanvas.width = 64;
    spriteCanvas.height = 64;
    const ctx = spriteCanvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.3, 'rgba(255,255,255,0.8)');
    gradient.addColorStop(0.7, 'rgba(255,255,255,0.2)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);

    const spriteTexture = new THREE.CanvasTexture(spriteCanvas);

    const lightCount = 24;
    for (let i = 0; i < lightCount; i++) {
      const angle = (i / lightCount) * Math.PI * 2;
      const spriteMaterial = new THREE.SpriteMaterial({
        map: spriteTexture,
        color: 0xfbbf24,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.position.set(
        Math.cos(angle) * 10,
        Math.sin(angle) * 10,
        0
      );
      sprite.scale.set(0.4, 0.4, 1);
      this.ringLights.push(sprite);
      this.scene.add(sprite);
    }
  }

  private async handleFileSelected(file: File): Promise<void> {
    if (this.audioAnalyzer) {
      this.audioAnalyzer.dispose();
    }

    this.audioAnalyzer = new AudioAnalyzer();
    this.audioAnalyzer.setOnEnded(() => {
      this.uiController.updatePlayButton(false);
    });

    await this.audioAnalyzer.loadFile(file);
    this.audioAnalyzer.play();
    this.uiController.showPlayingUI();
  }

  private handleTogglePlay(): boolean {
    if (!this.audioAnalyzer) return false;
    return this.audioAnalyzer.togglePlay();
  }

  private handleReset(): void {
    this.particleSystem.reset();
    this.controls.reset();
    this.camera.position.set(0, 0, 12);
    this.camera.lookAt(0, 0, 0);
  }

  private handleSensitivityChange(value: number): void {
    this.sensitivity = value;
    this.controls.rotateSpeed = value;
  }

  private handleResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();
    const now = performance.now();
    this.uiController.tickFPS(now);

    let lowEnergy = 0;
    let midEnergy = 0;
    let highEnergy = 0;

    if (this.audioAnalyzer && this.audioAnalyzer.isPlaying()) {
      const bands = this.audioAnalyzer.getFrequencyBands();
      lowEnergy = bands.low;
      midEnergy = bands.mid;
      highEnergy = bands.high;

      const bpm = this.audioAnalyzer.getBPM();
      const rotationSpeed = (2 * Math.PI) / (2 * (120 / bpm));
      this.ring.rotation.z += rotationSpeed * delta;

      for (let i = 0; i < this.ringLights.length; i++) {
        const sprite = this.ringLights[i];
        const angle = (i / this.ringLights.length) * Math.PI * 2 + this.ring.rotation.z;
        sprite.position.set(
          Math.cos(angle) * 10,
          Math.sin(angle) * 10,
          0
        );
      }
    } else {
      this.ring.rotation.z += (Math.PI / 2) * delta;
      for (let i = 0; i < this.ringLights.length; i++) {
        const sprite = this.ringLights[i];
        const angle = (i / this.ringLights.length) * Math.PI * 2 + this.ring.rotation.z;
        sprite.position.set(
          Math.cos(angle) * 10,
          Math.sin(angle) * 10,
          0
        );
      }
    }

    this.particleSystem.update({ lowEnergy, midEnergy, highEnergy }, delta);

    const avgEnergy = (lowEnergy + midEnergy + highEnergy) / 3;
    const r = (COLOR_LOW_RGB.r + (COLOR_HIGH_RGB.r - COLOR_LOW_RGB.r) * avgEnergy) / 255;
    const g = (COLOR_LOW_RGB.g + (COLOR_HIGH_RGB.g - COLOR_LOW_RGB.g) * avgEnergy) / 255;
    const b = (COLOR_LOW_RGB.b + (COLOR_HIGH_RGB.b - COLOR_LOW_RGB.b) * avgEnergy) / 255;
    const dominantColor = new THREE.Color(r, g, b);

    for (const sprite of this.ringLights) {
      const mat = sprite.material as THREE.SpriteMaterial;
      mat.color.copy(dominantColor);
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };
}

new App();
