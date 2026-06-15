import { SceneManager } from './scene';
import { ControlPanel } from './controls';
import { AnimationLoop } from './animation';

class App {
  private sceneManager: SceneManager | null = null;
  private controlPanel: ControlPanel | null = null;
  private animationLoop: AnimationLoop | null = null;
  
  constructor() {
    this.init();
  }
  
  private init(): void {
    const container = document.getElementById('canvas-container');
    if (!container) {
      console.error('Canvas container not found');
      return;
    }
    
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);
    
    this.sceneManager = new SceneManager(canvas);
    
    this.controlPanel = new ControlPanel(this.sceneManager, container);
    
    this.animationLoop = new AnimationLoop(
      this.sceneManager,
      this.controlPanel
    );
    
    this.setupResizeListener();
    
    this.animationLoop.start();
  }
  
  private setupResizeListener(): void {
    let resizeTimeout: number | null = null;
    
    window.addEventListener('resize', () => {
      if (resizeTimeout !== null) {
        clearTimeout(resizeTimeout);
      }
      
      resizeTimeout = window.setTimeout(() => {
        if (this.sceneManager) {
          this.sceneManager.onResize();
        }
      }, 100);
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new App();
});