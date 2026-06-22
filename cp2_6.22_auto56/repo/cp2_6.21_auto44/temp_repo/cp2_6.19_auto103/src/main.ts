import * as THREE from 'three';
import { SceneRenderer } from './renderers/SceneRenderer';
import { InteractionManager } from './interaction/InteractionManager';
import { getPlanets } from './planets/PlanetSystem';

class SolarSystemApp {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private sceneRenderer: SceneRenderer;
  private interactionManager!: InteractionManager;
  private clock: THREE.Clock;
  private timeScale = 1;
  private timeScaleSlider!: HTMLInputElement;
  private timeScaleLabel!: HTMLElement;

  constructor() {
    this.container = document.getElementById('app')!;
    this.clock = new THREE.Clock();

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setClearColor(0x0a0a1a, 1);
    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      60,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      2000
    );

    this.sceneRenderer = new SceneRenderer();
    this.sceneRenderer.init(getPlanets());

    this.createTimeSlider();
    this.setupInteractionManager();
    this.setupResizeHandler();
    this.animate();
  }

  private createTimeSlider(): void {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 8px;
      padding: 14px 18px;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    `;

    const labelRow = document.createElement('div');
    labelRow.style.cssText = `
      display: flex;
      align-items: center;
      gap: 10px;
    `;

    const title = document.createElement('span');
    title.textContent = '时间流速';
    title.style.cssText = `
      color: rgba(255, 255, 255, 0.75);
      font-size: 13px;
      font-weight: 500;
    `;

    this.timeScaleLabel = document.createElement('span');
    this.timeScaleLabel.textContent = '1.0x';
    this.timeScaleLabel.style.cssText = `
      color: #ffd700;
      font-size: 14px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      min-width: 42px;
      text-align: right;
    `;

    labelRow.appendChild(title);
    labelRow.appendChild(this.timeScaleLabel);

    this.timeScaleSlider = document.createElement('input');
    this.timeScaleSlider.type = 'range';
    this.timeScaleSlider.min = '0.1';
    this.timeScaleSlider.max = '10';
    this.timeScaleSlider.step = '0.1';
    this.timeScaleSlider.value = '1';
    this.timeScaleSlider.style.cssText = `
      width: 180px;
      height: 4px;
      -webkit-appearance: none;
      appearance: none;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 2px;
      outline: none;
      cursor: pointer;
    `;

    const sliderStyle = document.createElement('style');
    sliderStyle.textContent = `
      input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #ffd700;
        cursor: pointer;
        box-shadow: 0 0 8px rgba(255, 215, 0, 0.5);
        border: 2px solid #fff;
      }
      input[type="range"]::-moz-range-thumb {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #ffd700;
        cursor: pointer;
        box-shadow: 0 0 8px rgba(255, 215, 0, 0.5);
        border: 2px solid #fff;
      }
    `;
    document.head.appendChild(sliderStyle);

    this.timeScaleSlider.addEventListener('input', this.onTimeScaleChange);

    wrapper.appendChild(labelRow);
    wrapper.appendChild(this.timeScaleSlider);
    this.container.appendChild(wrapper);
  }

  private onTimeScaleChange = (): void => {
    this.timeScale = parseFloat(this.timeScaleSlider.value);
    this.timeScaleLabel.textContent = `${this.timeScale.toFixed(1)}x`;
    this.sceneRenderer.setTimeScale(this.timeScale);
  };

  private setupInteractionManager(): void {
    this.interactionManager = new InteractionManager({
      container: this.container,
      camera: this.camera,
      renderer: this.sceneRenderer,
    });
  }

  private setupResizeHandler(): void {
    window.addEventListener('resize', this.onResize);
  }

  private onResize = (): void => {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private animate = (): void => {
    requestAnimationFrame(this.animate);

    const deltaTime = Math.min(this.clock.getDelta(), 0.1);
    const time = this.clock.getElapsedTime();

    this.sceneRenderer.update(time, deltaTime);
    this.interactionManager.update(deltaTime);
    this.renderer.render(this.sceneRenderer.scene, this.camera);
  };

  public dispose(): void {
    window.removeEventListener('resize', this.onResize);
    this.timeScaleSlider.removeEventListener('input', this.onTimeScaleChange);
    this.interactionManager.dispose();
    this.sceneRenderer.dispose();
    this.renderer.dispose();
  }
}

let app: SolarSystemApp | null = null;

window.addEventListener('DOMContentLoaded', () => {
  app = new SolarSystemApp();
});
