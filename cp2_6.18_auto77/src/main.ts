import * as THREE from 'three';
import { AudioManager, AudioSourceType } from './audioManager';
import { Visualization, VisualParams } from './visualization';
import { UIControls } from './uiControls';

class App {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private audioManager: AudioManager;
  private visualization: Visualization;
  private uiControls: UIControls;
  private clock: THREE.Clock;
  private params: VisualParams;
  private animationId: number | null = null;
  private isMobile: boolean;

  constructor() {
    this.isMobile = window.innerWidth < 768;

    this.params = {
      sensitivity: 1.0,
      rotationSpeed: 0.5,
      spread: 0.5,
      mode: 'both',
      isMobile: this.isMobile
    };

    this.clock = new THREE.Clock();
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 3, 12);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.domElement.className = 'three-canvas';

    const app = document.getElementById('app')!;
    app.appendChild(this.renderer.domElement);

    this.audioManager = new AudioManager();
    this.visualization = new Visualization(this.scene, this.camera);
    this.visualization.init(this.isMobile);

    this.uiControls = new UIControls({
      onAudioSourceChange: this.handleAudioSourceChange.bind(this),
      onParamsChange: this.handleParamsChange.bind(this)
    });

    this.setupResizeHandler();
    this.start();
  }

  private async handleAudioSourceChange(type: AudioSourceType, file?: File): Promise<void> {
    try {
      if (type === 'microphone') {
        await this.audioManager.startMicrophone();
      } else if (type === 'file' && file) {
        await this.audioManager.startFile(file);
      }
      this.uiControls.setAudioSourceName(this.audioManager.getCurrentSourceName());
    } catch (err) {
      console.error('音频源启动失败:', err);
      this.uiControls.setAudioSourceName('音频源启动失败');
    }
  }

  private handleParamsChange(partialParams: Partial<VisualParams>): void {
    Object.assign(this.params, partialParams);

    if (partialParams.isMobile !== undefined && this.visualization) {
      this.visualization.updateParticleCount(partialParams.isMobile);
    }
  }

  private setupResizeHandler(): void {
    window.addEventListener('resize', () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.visualization.resize(window.innerWidth, window.innerHeight);
    });
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(() => this.animate());

    const deltaTime = this.clock.getDelta();
    const freqData = this.audioManager.getFrequencyData();
    const waveformData = this.audioManager.getWaveformData();

    this.visualization.update(freqData, this.params, deltaTime);
    this.uiControls.drawWaveformPreview(waveformData);

    this.renderer.render(this.scene, this.camera);
  }

  start(): void {
    if (this.animationId === null) {
      this.animate();
    }
  }

  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new App();
});
