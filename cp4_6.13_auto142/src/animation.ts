import { SceneManager } from './scene';
import { ControlPanel } from './controls';

export class AnimationLoop {
  private sceneManager: SceneManager;
  private controlPanel: ControlPanel;
  
  private startTime: number = 0;
  private lastTime: number = 0;
  private isRunning: boolean = false;
  private rafId: number | null = null;
  private isPaused: boolean = false;
  
  constructor(sceneManager: SceneManager, controlPanel: ControlPanel) {
    this.sceneManager = sceneManager;
    this.controlPanel = controlPanel;
    
    this.controlPanel.onPause((paused) => {
      this.isPaused = paused;
    });
  }
  
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.startTime = performance.now();
    this.lastTime = this.startTime;
    
    this.tick();
  }
  
  stop(): void {
    this.isRunning = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
  
  private tick = (): void => {
    if (!this.isRunning) return;
    
    this.rafId = requestAnimationFrame(this.tick);
    
    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    
    this.controlPanel.update();
    
    if (!this.isPaused) {
      const elapsed = (currentTime - this.startTime) / 1000;
      
      const morphFactor = this.calculateMorphFactor(elapsed);
      
      const mousePos = this.controlPanel.getMousePosition();
      
      this.sceneManager.updateMorph(morphFactor, elapsed);
      this.sceneManager.updateSubSculptures(deltaTime);
      this.sceneManager.updateParticles(elapsed, mousePos.x, mousePos.y);
      this.sceneManager.updateExplosion(deltaTime);
    }
    
    this.sceneManager.render();
  };
  
  private calculateMorphFactor(elapsed: number): number {
    const period = 4;
    const phase = (elapsed % period) / period;
    return 0.5 * (1 + Math.sin(phase * Math.PI * 2));
  }
}