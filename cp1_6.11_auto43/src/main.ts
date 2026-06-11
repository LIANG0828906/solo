import * as THREE from 'three';
import { Nebula } from './nebula';
import { Interaction, InteractionCallbacks } from './interaction';

const PARTICLE_COUNT = 20000;

class NebulaApp {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private nebula: Nebula;
  private interaction: Interaction;

  private container: HTMLElement;
  private loader: HTMLElement;
  private fpsCounter: HTMLElement;
  private tooltip: HTMLElement;

  private elapsedTime = 0;
  private lastFrameTime = 0;
  private frameCount = 0;
  private fpsAccumulator = 0;
  private lastFpsUpdate = 0;

  private rotationSpeedMultiplier = 1.0;
  private sizeScale = 1.0;

  private animationId: number | null = null;

  constructor() {
    this.container = document.getElementById('app')!;
    this.loader = document.getElementById('loader')!;
    this.fpsCounter = document.getElementById('fpsCounter')!;
    this.tooltip = document.getElementById('particleTooltip')!;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000011);
    this.scene.fog = new THREE.Fog(0x000011, 50, 200);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000011, 1);
    this.container.appendChild(this.renderer.domElement);

    this.nebula = new Nebula(PARTICLE_COUNT);
    this.scene.add(this.nebula.points);

    const callbacks: InteractionCallbacks = {
      onRotationChange: (speed: number) => {
        this.rotationSpeedMultiplier = speed;
      },
      onSizeChange: (scale: number) => {
        this.sizeScale = scale;
      },
      onResetView: () => {},
    };

    this.interaction = new Interaction(
      this.scene,
      this.camera,
      this.renderer,
      this.nebula,
      this.tooltip,
      callbacks
    );

    this.bindUI();
    this.updateParticleCount();

    window.addEventListener('resize', this.handleResize);
  }

  private bindUI(): void {
    const panel = document.getElementById('controlPanel')!;
    const header = document.getElementById('panelHeader')!;
    const toggle = document.getElementById('panelToggle')!;
    const content = document.getElementById('panelContent')!;
    const rotationSlider = document.getElementById('rotationSlider') as HTMLInputElement;
    const rotationValue = document.getElementById('rotationValue')!;
    const sizeSlider = document.getElementById('sizeSlider') as HTMLInputElement;
    const sizeValue = document.getElementById('sizeValue')!;
    const resetBtn = document.getElementById('resetBtn')!;

    this.interaction.bindControlPanel(
      panel,
      header,
      toggle,
      content,
      rotationSlider,
      rotationValue,
      sizeSlider,
      sizeValue,
      resetBtn
    );
  }

  private updateParticleCount(): void {
    const el = document.getElementById('particleCount');
    if (el) el.textContent = this.nebula.particleCount.toLocaleString();
  }

  private handleResize = (): void => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  };

  private animate = (timestamp: number): void => {
    this.animationId = requestAnimationFrame(this.animate);

    if (this.lastFrameTime === 0) {
      this.lastFrameTime = timestamp;
      this.lastFpsUpdate = timestamp;
    }

    const deltaMs = timestamp - this.lastFrameTime;
    const delta = deltaMs / 1000;
    this.lastFrameTime = timestamp;
    this.elapsedTime += delta;

    this.frameCount++;
    this.fpsAccumulator += deltaMs;
    if (timestamp - this.lastFpsUpdate >= 250) {
      const fps = (this.frameCount * 1000) / this.fpsAccumulator;
      this.fpsCounter.textContent = `FPS: ${fps.toFixed(1)}`;
      this.frameCount = 0;
      this.fpsAccumulator = 0;
      this.lastFpsUpdate = timestamp;
    }

    this.nebula.update(delta, this.elapsedTime, this.rotationSpeedMultiplier, this.sizeScale);
    this.interaction.update();

    this.renderer.render(this.scene, this.camera);
  };

  public start(): void {
    requestAnimationFrame((t) => {
      this.animate(t);
    });

    setTimeout(() => {
      this.loader.classList.add('hidden');
      setTimeout(() => {
        if (this.loader.parentNode) {
          this.loader.parentNode.removeChild(this.loader);
        }
      }, 800);
    }, 400);
  }

  public dispose(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    window.removeEventListener('resize', this.handleResize);

    this.interaction.dispose();
    this.nebula.dispose();
    this.renderer.dispose();

    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}

let app: NebulaApp | null = null;

function initApp(): void {
  app = new NebulaApp();
  app.start();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

(window as unknown as { __nebulaApp?: NebulaApp | null }).__nebulaApp = app;
