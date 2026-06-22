import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { AudioAnalyzer } from './AudioAnalyzer';
import { ParticleSystem, ParticleShape } from './ParticleSystem';
import { UI } from './UI';

class App {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  
  private audioAnalyzer: AudioAnalyzer;
  private particleSystem: ParticleSystem;
  private ui: UI;
  
  private clock: THREE.Clock;
  private animationFrameId: number | null = null;
  private isInitialized: boolean = false;

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container with id "${containerId}" not found`);
    }
    this.container = container;
    
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, 8);
    
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000, 1);
    this.container.appendChild(this.renderer.domElement);
    
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.enablePan = false;
    this.controls.minDistance = 3;
    this.controls.maxDistance = 15;
    this.controls.rotateSpeed = 0.5;
    this.controls.zoomSpeed = 0.8;
    
    this.setupSceneBackground();
    
    this.audioAnalyzer = new AudioAnalyzer();
    
    this.particleSystem = new ParticleSystem(this.scene, {
      particleCount: 2000,
      radius: 5,
      shape: 'point'
    });
    
    this.ui = new UI(this.container, {
      onFileSelect: this.handleFileSelect.bind(this),
      onPlayPause: this.handlePlayPause.bind(this),
      onParticleSizeChange: this.handleParticleSizeChange.bind(this),
      onRotationSpeedChange: this.handleRotationSpeedChange.bind(this),
      onGradientChange: this.handleGradientChange.bind(this),
      onShapeChange: this.handleShapeChange.bind(this)
    });
    
    this.clock = new THREE.Clock();
    
    this.setupEventListeners();
    this.isInitialized = true;
  }

  private setupSceneBackground(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#000008');
    gradient.addColorStop(0.5, '#000020');
    gradient.addColorStop(1, '#000010');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2, 512);
    
    const texture = new THREE.CanvasTexture(canvas);
    this.scene.background = texture;
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.handleResize.bind(this));
    
    this.audioAnalyzer.setOnPlaybackComplete(() => {
      this.ui.setIsPlaying(false);
    });
  }

  private async handleFileSelect(file: File): Promise<void> {
    try {
      await this.audioAnalyzer.loadFile(file);
      await this.audioAnalyzer.play();
      this.ui.setIsPlaying(true);
    } catch (error) {
      console.error('Error loading audio file:', error);
      alert('无法加载音频文件，请确保文件格式正确。');
    }
  }

  private async handlePlayPause(): Promise<void> {
    if (!this.isInitialized) return;
    
    const wasPlaying = this.audioAnalyzer.getIsPlaying();
    await this.audioAnalyzer.togglePlayPause();
    const isNowPlaying = this.audioAnalyzer.getIsPlaying();
    
    if (wasPlaying !== isNowPlaying) {
      this.ui.setIsPlaying(isNowPlaying);
    }
  }

  private handleParticleSizeChange(size: number): void {
    this.particleSystem.setParticleSize(size);
  }

  private handleRotationSpeedChange(speed: number): void {
    this.particleSystem.setRotationSpeedMultiplier(speed);
  }

  private handleGradientChange(index: number): void {
    this.particleSystem.setColorGradient(index);
    this.ui.setActiveGradient(index);
  }

  private handleShapeChange(shape: ParticleShape): void {
    this.particleSystem.setShape(shape);
    this.ui.setActiveShape(shape);
  }

  private handleResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private animate(): void {
    this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
    
    const deltaTime = Math.min(this.clock.getDelta(), 0.1);
    
    const audioData = this.audioAnalyzer.getAudioData();
    
    this.particleSystem.update(deltaTime, audioData);
    
    const progress = this.audioAnalyzer.getPlaybackProgress();
    const highEnergy = this.particleSystem.getCurrentHighEnergy();
    this.ui.setProgress(progress, highEnergy);
    
    this.controls.update();
    
    this.renderer.render(this.scene, this.camera);
  }

  start(): void {
    if (this.animationFrameId === null) {
      this.animate();
    }
  }

  stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  dispose(): void {
    this.stop();
    
    window.removeEventListener('resize', this.handleResize.bind(this));
    
    this.audioAnalyzer.dispose();
    this.particleSystem.dispose();
    
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
    
    if (this.scene.background instanceof THREE.Texture) {
      this.scene.background.dispose();
    }
    
    this.isInitialized = false;
  }
}

let app: App | null = null;

function initApp() {
  if (app) {
    app.dispose();
  }
  
  app = new App('app');
  app.start();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

window.addEventListener('beforeunload', () => {
  if (app) {
    app.dispose();
    app = null;
  }
});
