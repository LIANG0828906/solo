import { FoldEngine } from './foldEngine';
import { PaperRenderer } from './paperRenderer';
import { InteractionManager } from './interaction';

class OrigamiApp {
  private canvas: HTMLCanvasElement;
  private engine: FoldEngine;
  private renderer: PaperRenderer;
  private interaction: InteractionManager;
  private lastStep: number = 0;
  private animationId: number = 0;

  constructor() {
    this.canvas = document.getElementById('paperCanvas') as HTMLCanvasElement;
    
    const startBtn = document.getElementById('startBtn') as HTMLButtonElement;
    const resetBtn = document.getElementById('resetBtn') as HTMLButtonElement;
    const progressSlider = document.getElementById('progressSlider') as HTMLInputElement;
    const stepLabel = document.getElementById('stepLabel') as HTMLElement;
    const stepCounter = document.getElementById('stepCounter') as HTMLElement;

    this.engine = new FoldEngine(this.canvas.width, this.canvas.height);
    this.renderer = new PaperRenderer(this.canvas, this.engine);
    this.interaction = new InteractionManager(
      this.canvas,
      this.engine,
      startBtn,
      resetBtn,
      progressSlider,
      stepLabel,
      stepCounter
    );

    this.interaction.setOnFoldStart(() => {
      this.lastStep = this.engine.getCurrentStep();
    });

    this.interaction.setOnReset(() => {
      this.renderer.reset();
    });
  }

  public start(): void {
    this.animate();
  }

  private animate(): void {
    this.engine.update();
    this.renderer.render();
    this.interaction.updateUI();

    const currentStep = this.engine.getCurrentStep();
    if (currentStep > this.lastStep && currentStep > 0) {
      this.renderer.playFoldSound();
      this.lastStep = currentStep;
    }

    this.animationId = requestAnimationFrame(this.animate.bind(this));
  }

  public stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new OrigamiApp();
  app.start();
});
