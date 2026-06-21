import * as THREE from 'three';
import { AudioAnalyzer } from './audioAnalyzer';
import { ParticleSystem } from './particleSystem';

const PLAY_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
const PAUSE_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`;
const UPLOAD_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>`;

class App {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private particleSystem: ParticleSystem;
  private audioAnalyzer: AudioAnalyzer;
  private pointLight: THREE.PointLight;
  private ambientLight: THREE.AmbientLight;

  private uploadBtn: HTMLButtonElement;
  private btnIcon: HTMLElement;
  private btnText: HTMLSpanElement;
  private fileInput: HTMLInputElement;
  private spectrumBars: HTMLElement[];

  private clock: THREE.Clock;
  private animationId: number | null = null;
  private hasAudio: boolean = false;

  private readonly SPECTRUM_MAX_HEIGHT: number = 100;

  constructor() {
    this.clock = new THREE.Clock();

    const canvasContainer = document.getElementById('canvas-container')!;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, 32);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000, 0);
    canvasContainer.appendChild(this.renderer.domElement);

    this.pointLight = new THREE.PointLight(0xFFFFFF, 1.5, 100);
    this.pointLight.position.copy(this.camera.position);
    this.scene.add(this.pointLight);

    this.ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.1);
    this.scene.add(this.ambientLight);

    this.particleSystem = new ParticleSystem(this.scene);

    this.audioAnalyzer = new AudioAnalyzer();

    this.uploadBtn = document.getElementById('upload-btn') as HTMLButtonElement;
    this.btnIcon = document.getElementById('btn-icon') as HTMLElement;
    this.btnText = document.getElementById('btn-text') as HTMLSpanElement;
    this.fileInput = document.getElementById('file-input') as HTMLInputElement;

    const barElements = document.querySelectorAll('.spectrum-bar');
    this.spectrumBars = Array.from(barElements) as HTMLElement[];

    this.bindEvents();
    this.updateSpectrumBars(new Array(16).fill(0));

    this.animate();
  }

  private bindEvents(): void {
    this.uploadBtn.addEventListener('click', () => {
      if (this.hasAudio) {
        this.togglePlayPause();
      } else {
        this.fileInput.click();
      }
    });

    this.fileInput.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      const files = target.files;
      if (files && files.length > 0) {
        this.loadAudioFile(files[0]);
      }
      target.value = '';
    });

    window.addEventListener('resize', () => this.onWindowResize());

    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (this.hasAudio) {
          this.togglePlayPause();
        }
      } else if (e.code === 'KeyR') {
        this.particleSystem.triggerRotationBoost();
      } else if (e.code === 'KeyT') {
        this.particleSystem.resetParticles();
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.animationId !== null) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      } else if (!document.hidden && this.animationId === null) {
        this.clock.start();
        this.animate();
      }
    });
  }

  private async loadAudioFile(file: File): Promise<void> {
    try {
      this.btnText.textContent = '加载中...';
      this.btnIcon.innerHTML = UPLOAD_ICON;

      await this.audioAnalyzer.loadFile(file, (spectrum: number[]) => {
        this.particleSystem.updateSpectrum(spectrum);
        this.updateSpectrumBars(spectrum);
      });

      this.hasAudio = true;
      this.btnText.textContent = '暂停';
      this.btnIcon.innerHTML = PAUSE_ICON;
    } catch (error) {
      console.error('Failed to load audio:', error);
      this.btnText.textContent = '上传音乐';
      this.btnIcon.innerHTML = UPLOAD_ICON;
      alert('音频文件加载失败，请尝试其他文件');
    }
  }

  private togglePlayPause(): void {
    if (!this.hasAudio) return;
    const isPlaying = this.audioAnalyzer.togglePlayPause();
    this.btnText.textContent = isPlaying ? '暂停' : '继续';
    this.btnIcon.innerHTML = isPlaying ? PAUSE_ICON : PLAY_ICON;
  }

  private updateSpectrumBars(spectrum: number[]): void {
    for (let i = 0; i < this.spectrumBars.length; i++) {
      const value = Math.min(1, Math.max(0, spectrum[i] || 0));
      const height = Math.max(2, value * this.SPECTRUM_MAX_HEIGHT);
      this.spectrumBars[i].style.height = `${height}px`;
    }
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);

    const deltaTime = Math.min(this.clock.getDelta(), 0.1);

    this.particleSystem.animate(deltaTime);

    this.pointLight.position.copy(this.camera.position);

    this.camera.position.x = Math.sin(performance.now() * 0.0001) * 2;
    this.camera.position.y = Math.cos(performance.now() * 0.00008) * 1.5;
    this.camera.lookAt(0, 0, 0);

    this.renderer.render(this.scene, this.camera);
  };

  public dispose(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.audioAnalyzer.dispose();
    this.particleSystem.dispose();
    this.renderer.dispose();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const app = new App();

  window.addEventListener('beforeunload', () => {
    app.dispose();
  });
});
