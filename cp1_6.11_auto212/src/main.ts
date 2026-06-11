import { SceneSetup } from './SceneSetup';
import { StarEngine } from './StarEngine';
import { StarRenderer } from './StarRenderer';
import { UIManager, UICallbacks } from './UIManager';

class StellarEvolutionApp {
  private sceneSetup: SceneSetup;
  private starEngine: StarEngine;
  private starRenderer: StarRenderer;
  private uiManager: UIManager;

  private paused: boolean = false;
  private timeProgress: number = 0;
  private timeSpeed: number = 1;
  private nebulaDensityOffset: number = 1;
  private lastTime: number = 0;
  private autoPlaying: boolean = true;

  constructor() {
    const container = document.getElementById('app')!;

    this.sceneSetup = new SceneSetup(container);
    this.starEngine = new StarEngine(1.0);
    this.starRenderer = new StarRenderer(this.sceneSetup.scene);

    const callbacks: UICallbacks = {
      onTimeProgressChange: (v: number) => {
        this.timeProgress = v;
        this.starEngine.setTimeProgress(v);
      },
      onMassChange: (v: number) => {
        this.starEngine.setMass(v);
      },
      onTimeSpeedChange: (v: number) => {
        this.timeSpeed = v;
      },
      onViewDistanceChange: (v: number) => {
        const dir = this.sceneSetup.camera.position.clone().normalize();
        this.sceneSetup.camera.position.copy(dir.multiplyScalar(v));
      },
      onNebulaDensityOffset: (v: number) => {
        this.nebulaDensityOffset = v;
      },
      onResetView: () => {
        this.sceneSetup.resetCamera(true);
        this.uiManager.setViewDistance(10);
      },
      onPauseToggle: () => {
        this.paused = this.uiManager.isPaused();
      }
    };

    this.uiManager = new UIManager(container, callbacks);

    this.lastTime = performance.now();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  private animate(now: number): void {
    requestAnimationFrame(this.animate);

    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    if (!this.paused && this.autoPlaying) {
      const progressIncrement = (dt * this.timeSpeed * 0.33) / 100;
      this.timeProgress = Math.min(1, this.timeProgress + progressIncrement);
      this.starEngine.setTimeProgress(this.timeProgress);
      this.uiManager.setTimeProgress(this.timeProgress);
    }

    this.starEngine.update(dt);
    const props = this.starEngine.getProperties();

    const adjustedProps = { ...props };
    adjustedProps.nebulaDensity = Math.max(0, props.nebulaDensity * this.nebulaDensityOffset);

    this.starRenderer.update(adjustedProps, dt);
    this.uiManager.updateInfo(props, now);

    this.syncCameraDistance();

    this.sceneSetup.render();
  }

  private syncCameraDistance(): void {
    const dist = this.sceneSetup.camera.position.length();
    const currentSliderVal = this.uiManager.getViewDistance();
    if (Math.abs(dist - currentSliderVal) > 0.5) {
      this.uiManager.setViewDistance(Math.round(dist * 2) / 2);
    }
  }
}

new StellarEvolutionApp();
