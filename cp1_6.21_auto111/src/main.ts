import { Scene3D } from './scene3D';
import { UI } from './UI';

class App {
  private scene3D: Scene3D;
  private ui: UI;
  private lastTime: number = 0;
  private summaryTimer: number = 0;
  private animationId: number = 0;

  constructor() {
    const container = document.getElementById('app');
    if (!container) {
      throw new Error('Container #app not found');
    }

    this.scene3D = new Scene3D(container);
    this.ui = new UI(container, this.scene3D);

    this.startLoop();
  }

  private startLoop(): void {
    this.lastTime = performance.now();
    this.animate();
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);

    const currentTime = performance.now();
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    if (this.ui.getIsPlaying()) {
      const currentHour = this.scene3D.getCurrentHour();
      let newHour = currentHour + deltaTime * 0.5;
      if (newHour > 22) {
        newHour = 6;
      }
      this.ui.setTime(newHour);
    }

    this.scene3D.update(deltaTime);

    this.summaryTimer += deltaTime;
    if (this.summaryTimer >= 0.1) {
      this.ui.updateSummary();
      this.summaryTimer = 0;
    }
  };

  public dispose(): void {
    cancelAnimationFrame(this.animationId);
    this.scene3D.dispose();
  }
}

const app = new App();

(window as any).app = app;
