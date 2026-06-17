import { PhysicsEngine } from './physicsEngine';
import { Renderer } from './renderer';
import { UIControl } from './uiControl';
import type { BarMagnetConfig, SceneConfig, FieldLineParams, PoleType, Vec3 } from './types';

const barMagnetConfig: BarMagnetConfig = {
  length: 2.0,
  width: 0.4,
  height: 0.4,
  colorN: '#FF4444',
  colorS: '#4444FF',
  emissionIntensity: 0.2
};

const sceneConfig: SceneConfig = {
  backgroundColor: ['#0A0A1A', '#1A1A3A'],
  starCount: 50,
  minDistance: 1,
  maxDistance: 20,
  dampingFactor: 0.1,
  targetFPS: 45,
  maxVertices: 15000,
  poleThreshold: 6
};

const fieldLineParams: FieldLineParams = {
  totalLines: 200,
  verticesPerLine: 30,
  lineWidth: 0.05,
  flowSpeed: 1.0,
  colorN: '#FF8800',
  colorS: '#0088FF',
  glowIntensity: 0.6
};

const uiConfig = {
  toolbarWidth: 80,
  toolbarBg: 'rgba(26,26,46,0.9)',
  toolbarRadius: 8,
  toolbarPadding: 12,
  panelHeight: 60,
  panelBg: 'rgba(26,26,46,0.8)',
  panelBlur: 10,
  panelPadding: 12,
  sliderTrackWidth: 200,
  sliderTrackHeight: 4,
  sliderTrackColor: '#3A3A5C',
  sliderDotSize: 16,
  sliderDotColor: '#6C63FF',
  sliderDotHoverColor: '#8B83FF',
  sliderMin: 50,
  sliderMax: 500,
  sliderDefault: 200,
  buttonWidth: 100,
  buttonHeight: 36,
  buttonRadius: 8,
  buttonClearBg: '#FF6B6B',
  buttonResetBg: '#4ECDC4',
  buttonTextColor: '#FFFFFF',
  buttonFontSize: 14,
  poleSize: 48,
  poleColorN: '#FF4444',
  poleColorS: '#4444FF'
};

class App {
  private container: HTMLElement;
  private physicsEngine: PhysicsEngine;
  private renderer: Renderer;
  private uiControl: UIControl;
  private animationId: number | null = null;
  private lastFrameTime: number = 0;
  private fieldLineParams: FieldLineParams;
  private fpsCounter: number = 0;
  private fpsTimer: number = 0;

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container #${containerId} not found`);
    }
    this.container = container;

    this.fieldLineParams = { ...fieldLineParams };

    this.physicsEngine = new PhysicsEngine(barMagnetConfig);
    this.renderer = new Renderer(this.container, barMagnetConfig, sceneConfig, {
      onPoleDropped: this.onPoleDropped.bind(this)
    });
    this.uiControl = new UIControl(this.container, uiConfig, {
      onFieldLineDensityChange: this.onFieldLineDensityChange.bind(this),
      onClear: this.onClear.bind(this),
      onResetCamera: this.onResetCamera.bind(this),
      onStartDragPole: this.onStartDragPole.bind(this)
    });
  }

  start(): void {
    this.physicsEngine.initDefaultBarMagnet();
    this.renderer.createBarMagnet();

    for (const pole of this.physicsEngine.getPoles()) {
      if (pole.id === 'bar-north' || pole.id === 'bar-south') continue;
      this.renderer.createPoleMesh(pole);
    }

    this.uiControl.build();
    this.updateFieldLines();
    this.startAnimation();
  }

  private updateFieldLines(): void {
    const lines = this.physicsEngine.computeFieldLines(this.fieldLineParams);
    this.renderer.updateFieldLines(lines, this.fieldLineParams);
  }

  private onPoleDropped(type: PoleType, position: Vec3): void {
    const pole = this.physicsEngine.addPole({
      type,
      position,
      strength: 1.5,
      radius: 0.3
    });
    this.renderer.createPoleMesh(pole);
    this.updateFieldLines();
  }

  private onFieldLineDensityChange(value: number): void {
    this.fieldLineParams.totalLines = value;
    this.updateFieldLines();
  }

  private onClear(): void {
    this.physicsEngine.clearCustomPoles();
    this.renderer.clearAllCustomPoleMeshes();
    this.updateFieldLines();
  }

  private onResetCamera(): void {
    this.renderer.resetCamera();
  }

  private onStartDragPole(type: PoleType, clientX: number, clientY: number): void {
    this.renderer.startDragPole(type, clientX, clientY);
  }

  private startAnimation(): void {
    const animate = (time: number) => {
      const deltaTime = Math.min((time - this.lastFrameTime) / 1000, 0.1);
      this.lastFrameTime = time;

      this.fpsCounter++;
      this.fpsTimer += deltaTime;
      if (this.fpsTimer >= 1) {
        if (this.fpsCounter < sceneConfig.targetFPS) {
          console.warn(`FPS dropped below target: ${this.fpsCounter.toFixed(1)} < ${sceneConfig.targetFPS}`);
        }
        this.fpsCounter = 0;
        this.fpsTimer = 0;
      }

      this.renderer.animate(deltaTime);
      this.animationId = requestAnimationFrame(animate);
    };

    this.lastFrameTime = performance.now();
    this.animationId = requestAnimationFrame(animate);
  }

  dispose(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    this.renderer.dispose();
    this.uiControl.dispose();
  }
}

const app = new App('app');
app.start();

(window as unknown as { app?: App }).app = app;
