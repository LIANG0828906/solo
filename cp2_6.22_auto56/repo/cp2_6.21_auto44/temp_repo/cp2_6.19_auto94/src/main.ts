import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { AudioAnalyzer, FrequencyBands } from './audioAnalyzer';
import { ParticleSystem } from './particleSystem';

class App {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private clock: THREE.Clock;

  private audioAnalyzer: AudioAnalyzer;
  private particleSystem: ParticleSystem;

  private container: HTMLElement;
  private uploadBtn: HTMLButtonElement;
  private fileInput: HTMLInputElement;
  private fileNameEl: HTMLElement;
  private opacitySlider: HTMLInputElement;
  private speedSlider: HTMLInputElement;
  private sensitivitySlider: HTMLInputElement;
  private opacityValue: HTMLElement;
  private speedValue: HTMLElement;
  private sensitivityValue: HTMLElement;

  private isLoading: boolean = false;
  private frameId: number = 0;

  private readonly PARTICLE_COUNT = 6500;

  constructor() {
    this.container = document.getElementById('canvas-container')!;
    this.uploadBtn = document.getElementById('upload-btn') as HTMLButtonElement;
    this.fileInput = document.getElementById('file-input') as HTMLInputElement;
    this.fileNameEl = document.getElementById('file-name') as HTMLElement;
    this.opacitySlider = document.getElementById('opacity-slider') as HTMLInputElement;
    this.speedSlider = document.getElementById('speed-slider') as HTMLInputElement;
    this.sensitivitySlider = document.getElementById('sensitivity-slider') as HTMLInputElement;
    this.opacityValue = document.getElementById('opacity-value') as HTMLElement;
    this.speedValue = document.getElementById('speed-value') as HTMLElement;
    this.sensitivityValue = document.getElementById('sensitivity-value') as HTMLElement;

    this.scene = new THREE.Scene();
    this.scene.background = null;

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 3, 12);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000, 0);
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.2;
    this.controls.enableZoom = true;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 25;
    this.controls.enablePan = false;
    this.controls.rotateSpeed = 0.6;
    this.controls.zoomSpeed = 0.8;
    this.controls.target.set(0, 0, 0);

    const dir = new THREE.Vector3(0, 3, 12);
    dir.normalize();
    const pitchOffset = dir.y;
    const newY = pitchOffset * 12;
    this.camera.position.set(
      dir.x * 12,
      newY + Math.tan(-15 * Math.PI / 180) * 12,
      dir.z * 12
    );
    this.controls.update();

    this.clock = new THREE.Clock();

    this.audioAnalyzer = new AudioAnalyzer();
    this.particleSystem = new ParticleSystem(this.scene, {
      count: this.PARTICLE_COUNT,
      opacity: 0.8,
      speedMultiplier: 1.0,
      sensitivity: 1.0
    });

    this.setupLights();
    this.bindEvents();
    this.animate();
  }

  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
    this.scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x667eea, 1.5, 50);
    pointLight1.position.set(-10, 8, -5);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x764ba2, 1.0, 50);
    pointLight2.position.set(10, 5, 5);
    this.scene.add(pointLight2);
  }

  private bindEvents(): void {
    window.addEventListener('resize', this.onResize);

    this.uploadBtn.addEventListener('click', () => {
      if (!this.isLoading) {
        this.fileInput.click();
      }
    });

    this.fileInput.addEventListener('change', this.onFileChange);

    this.opacitySlider.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.opacityValue.textContent = value.toFixed(2);
      this.particleSystem.setOpacity(value);
    });

    this.speedSlider.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.speedValue.textContent = value.toFixed(2);
      this.particleSystem.setSpeedMultiplier(value);
    });

    this.sensitivitySlider.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.sensitivityValue.textContent = value.toFixed(2);
      this.particleSystem.setSensitivity(value);
    });
  }

  private onResize = (): void => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  };

  private onFileChange = async (e: Event): Promise<void> => {
    const files = (e.target as HTMLInputElement).files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const ext = file.name.split('.').pop()?.toLowerCase();
    const allowedExts = ['mp3', 'wav', 'ogg'];
    if (!ext || !allowedExts.includes(ext)) {
      alert('请选择 MP3、WAV 或 OGG 格式的音频文件');
      return;
    }

    this.isLoading = true;
    this.uploadBtn.classList.add('loading');
    this.fileNameEl.textContent = `正在加载: ${file.name}`;

    try {
      await this.audioAnalyzer.loadAudioFile(file);
      this.fileNameEl.textContent = file.name;
      this.particleSystem.setHasAudio(true);
    } catch (err) {
      console.error('Audio load error:', err);
      this.fileNameEl.textContent = '加载失败，请重试';
      this.particleSystem.setHasAudio(false);
    } finally {
      this.isLoading = false;
      this.uploadBtn.classList.remove('loading');
      this.fileInput.value = '';
    }
  };

  private animate = (): void => {
    this.frameId = requestAnimationFrame(this.animate);

    const deltaTime = this.clock.getDelta();

    let bands: FrequencyBands | null = null;
    if (this.audioAnalyzer.getIsPlaying()) {
      bands = this.audioAnalyzer.getFrequencyBands(this.getSensitivity());
    }

    this.particleSystem.update(bands, deltaTime);
    this.controls.update();

    this.renderer.render(this.scene, this.camera);
  };

  private getSensitivity(): number {
    return parseFloat(this.sensitivitySlider.value);
  }

  dispose(): void {
    cancelAnimationFrame(this.frameId);
    window.removeEventListener('resize', this.onResize);
    this.particleSystem.dispose();
    this.audioAnalyzer.dispose();
    this.renderer.dispose();
    this.controls.dispose();
  }
}

let app: App | null = null;

window.addEventListener('DOMContentLoaded', () => {
  app = new App();
});

window.addEventListener('beforeunload', () => {
  if (app) {
    app.dispose();
    app = null;
  }
});
