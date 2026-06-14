import { SceneManager } from './scene/SceneManager';
import { FragmentController } from './fragment/FragmentController';
import { SnapAnalyzer } from './analysis/SnapAnalyzer';
import { TextureMatcher } from './texture/TextureMatcher';
import { globalEvents } from './types';

class App {
  private sceneManager: SceneManager;
  private fragmentController: FragmentController;
  private snapAnalyzer: SnapAnalyzer;
  private textureMatcher: TextureMatcher;
  private lastFrame: number = 0;
  private fpsHistory: number[] = [];
  private degraded: boolean = false;

  constructor() {
    this.sceneManager = new SceneManager('canvas-container');
    this.fragmentController = new FragmentController(this.sceneManager);
    this.snapAnalyzer = new SnapAnalyzer(this.sceneManager);
    this.textureMatcher = new TextureMatcher(this.sceneManager);

    this.setupUI();
    this.setupEvents();
    this.fragmentController.generateDemoFragments();
    this.startLoop();
  }

  private setupUI(): void {
    const btnReset = document.getElementById('btn-reset');
    btnReset?.addEventListener('click', () => {
      this.sceneManager.resetCamera();
    });
  }

  private setupEvents(): void {
    globalEvents.on('fragment:selected', () => {
      this.fragmentController.updateFragmentInfoPanel();
    });
    globalEvents.on('fragment:transformed', () => {
      this.fragmentController.updateFragmentInfoPanel();
    });
    globalEvents.on('group:split', () => {
      this.fragmentController.updateFragmentInfoPanel();
    });
  }

  private startLoop(): void {
    const tick = (now: number) => {
      if (this.lastFrame > 0) {
        const fps = 1000 / (now - this.lastFrame);
        this.fpsHistory.push(fps);
        if (this.fpsHistory.length > 30) this.fpsHistory.shift();

        const avgFps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;

        if (!this.degraded && avgFps < 50 && this.sceneManager.fragments.size >= 8) {
          this.sceneManager.degradeShadows();
          this.degraded = true;
        } else if (this.degraded && avgFps > 55) {
          this.sceneManager.restoreShadows();
          this.degraded = false;
        }
      }
      this.lastFrame = now;
      this.snapAnalyzer.update(now);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new App();
});
