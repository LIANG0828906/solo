import * as THREE from 'three';
import { OceanSystem } from './ocean';

export interface UIState {
  speed: number;
  showTemperature: boolean;
}

export interface UIEventCallbacks {
  onSpeedChange: (speed: number) => void;
  onTemperatureToggle: (show: boolean) => void;
  onResetView: () => void;
}

export class UIManager {
  private state: UIState = {
    speed: 1.0,
    showTemperature: false
  };

  private callbacks: UIEventCallbacks;
  private oceanSystem: OceanSystem;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;

  private speedSlider!: HTMLInputElement;
  private speedValueEl!: HTMLElement;
  private tempToggleBtn!: HTMLButtonElement;
  private resetViewBtn!: HTMLButtonElement;
  private tempLabelsContainer!: HTMLElement;
  private fpsCounterEl!: HTMLElement;

  private labelElements: Map<number, HTMLDivElement> = new Map();

  private fpsFrames: number = 0;
  private fpsLastTime: number = performance.now();
  private currentFps: number = 0;
  private frameWarned: boolean = false;

  private MIN_FPS = 40;

  constructor(
    oceanSystem: OceanSystem,
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer,
    callbacks: UIEventCallbacks
  ) {
    this.oceanSystem = oceanSystem;
    this.camera = camera;
    this.renderer = renderer;
    this.callbacks = callbacks;
    this.bindDomElements();
    this.bindEvents();
    this.initTemperatureLabels();
  }

  private bindDomElements(): void {
    this.speedSlider = document.getElementById('speedSlider') as HTMLInputElement;
    this.speedValueEl = document.getElementById('speedValue') as HTMLElement;
    this.tempToggleBtn = document.getElementById('tempToggle') as HTMLButtonElement;
    this.resetViewBtn = document.getElementById('resetView') as HTMLButtonElement;
    this.tempLabelsContainer = document.getElementById('tempLabels') as HTMLElement;
    this.fpsCounterEl = document.getElementById('fpsCounter') as HTMLElement;
  }

  private bindEvents(): void {
    this.speedSlider.addEventListener('input', (e: Event) => {
      const target = e.target as HTMLInputElement;
      const value = parseFloat(target.value);
      this.setSpeed(value);
    });

    this.tempToggleBtn.addEventListener('click', () => {
      const newState = !this.state.showTemperature;
      this.setShowTemperature(newState);
    });

    this.resetViewBtn.addEventListener('click', () => {
      this.callbacks.onResetView();
    });

    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        this.callbacks.onResetView();
      }
    });
  }

  private initTemperatureLabels(): void {
    this.oceanSystem.temperatureLabelMap.forEach((pathIndex, particleIndex) => {
      const el = document.createElement('div');
      el.className = 'temp-label';
      el.style.display = 'none';
      this.tempLabelsContainer.appendChild(el);
      this.labelElements.set(particleIndex, el);
    });
  }

  public setSpeed(value: number): void {
    const clamped = Math.max(0.5, Math.min(3.0, value));
    this.state.speed = clamped;
    this.speedValueEl.textContent = `${clamped.toFixed(1)}x`;
    this.callbacks.onSpeedChange(clamped);
  }

  public setShowTemperature(show: boolean): void {
    this.state.showTemperature = show;
    this.tempToggleBtn.classList.toggle('active', show);
    this.callbacks.onTemperatureToggle(show);

    this.labelElements.forEach(el => {
      el.style.display = show ? 'block' : 'none';
    });
  }

  public update(): void {
    this.updateFPS();
    if (this.state.showTemperature) {
      this.updateTemperatureLabels();
    }
  }

  private updateTemperatureLabels(): void {
    const width = this.renderer.domElement.clientWidth;
    const height = this.renderer.domElement.clientHeight;
    const rect = this.renderer.domElement.getBoundingClientRect();

    this.labelElements.forEach((el, particleIndex) => {
      const worldPos = this.oceanSystem.getParticleWorldPosition(particleIndex);
      const temp = this.oceanSystem.getParticleTemperature(particleIndex);
      worldPos.y += 0.5;

      const projected = worldPos.clone().project(this.camera);

      if (projected.z > 1 || projected.z < -1) {
        el.style.display = 'none';
        return;
      }

      const screenX = (projected.x * 0.5 + 0.5) * width + rect.left;
      const screenY = (-projected.y * 0.5 + 0.5) * height + rect.top;

      el.style.left = `${screenX}px`;
      el.style.top = `${screenY}px`;
      el.textContent = `${temp.toFixed(1)}°C`;
      el.style.display = 'block';
    });
  }

  private updateFPS(): void {
    this.fpsFrames++;
    const now = performance.now();
    if (now - this.fpsLastTime >= 1000) {
      this.currentFps = Math.round(
        (this.fpsFrames * 1000) / (now - this.fpsLastTime)
      );
      this.fpsFrames = 0;
      this.fpsLastTime = now;

      const warnColor = this.currentFps < this.MIN_FPS ? '#ef4444' : 'rgba(255, 255, 255, 0.4)';
      this.fpsCounterEl.style.color = warnColor;
      this.fpsCounterEl.textContent = `${this.currentFps} FPS`;

      if (this.currentFps < this.MIN_FPS && !this.frameWarned) {
        console.warn(`帧率警告: 当前 ${this.currentFps} FPS，低于最低要求 ${this.MIN_FPS} FPS`);
        this.frameWarned = true;
      } else if (this.currentFps >= this.MIN_FPS) {
        this.frameWarned = false;
      }
    }
  }

  public getCurrentFPS(): number {
    return this.currentFps;
  }

  public getState(): UIState {
    return { ...this.state };
  }
}
