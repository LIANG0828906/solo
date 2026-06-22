import { Renderer } from './Renderer';
import { UIManager } from './UIManager';
import { SimulationEngine } from '@/engine/SimulationEngine';
import { BeeRole } from '@/engine/BeeAgent';

class App {
  private container: HTMLElement;
  private renderer: Renderer;
  private uiManager: UIManager;
  private engine: SimulationEngine;
  private animationId: number | null = null;
  private lastFrameTime: number = 0;
  private targetFPS: number = 60;
  private frameInterval: number = 1000 / this.targetFPS;

  constructor() {
    this.container = document.getElementById('app') || document.body;
    
    this.engine = new SimulationEngine();
    this.renderer = new Renderer({
      container: this.container,
      gridSize: this.engine.getGridSize(),
      cellSize: this.engine.getCellSize()
    });
    this.uiManager = new UIManager(this.container);

    this.bindEvents();
    this.init();
  }

  private bindEvents(): void {
    this.uiManager.bindEvents({
      onAddWorkers: () => this.handleAddWorkers(),
      onTriggerAlarm: () => this.handleTriggerAlarm(),
      onReleaseFoodSignal: () => this.handleReleaseFoodSignal(),
      onToggleHeatmap: () => this.handleToggleHeatmap(),
      onReset: () => this.handleReset()
    });
  }

  private init(): void {
    this.engine.init();
    this.updateUI();
    this.startAnimationLoop();
  }

  private handleAddWorkers(): void {
    const added = this.engine.addBees(10, BeeRole.WORKER);
    if (added === 0) {
      console.log('已达到最大蜜蜂数量限制');
    } else {
      console.log(`添加了 ${added} 只工蜂`);
    }
    this.updateUI();
  }

  private handleTriggerAlarm(): void {
    const currentTime = performance.now();
    this.engine.triggerAlarm(currentTime);
    console.log('警报已触发');
    
    this.uiManager.setButtonEnabled('alarm', false);
    setTimeout(() => {
      this.uiManager.setButtonEnabled('alarm', true);
    }, 5000);
  }

  private handleReleaseFoodSignal(): void {
    const currentTime = performance.now();
    this.engine.releaseFoodSignal(currentTime);
    console.log('蜜源信号已释放');
    
    this.uiManager.setButtonEnabled('foodSignal', false);
    setTimeout(() => {
      this.uiManager.setButtonEnabled('foodSignal', true);
    }, 10000);
  }

  private handleToggleHeatmap(): void {
    const newState = !this.renderer.isHeatmapVisible();
    this.renderer.setHeatmapVisible(newState);
    this.uiManager.toggleHeatmapIcon(newState);
  }

  private handleReset(): void {
    this.engine.reset();
    this.renderer.setHeatmapVisible(false);
    this.renderer.setTrailsVisible(true);
    this.uiManager.toggleHeatmapIcon(false);
    this.uiManager.setButtonEnabled('alarm', true);
    this.uiManager.setButtonEnabled('foodSignal', true);
    console.log('模拟已重置');
  }

  private updateUI(): void {
    const stats = this.engine.getStatistics();
    const currentTime = performance.now();
    this.uiManager.updateStatistics(stats, currentTime);

    const totalBees = this.engine.getTotalBees();
    const maxBees = this.engine.getMaxBees();
    this.uiManager.setButtonEnabled('addWorkers', totalBees < maxBees);
  }

  private startAnimationLoop(): void {
    const animate = (currentTime: number) => {
      this.animationId = requestAnimationFrame(animate);

      const deltaTime = currentTime - this.lastFrameTime;
      
      if (deltaTime >= this.frameInterval * 0.5) {
        this.lastFrameTime = currentTime - (deltaTime % this.frameInterval);

        const engineDelta = Math.min(deltaTime, 100);
        this.engine.update(engineDelta, currentTime);

        const beeStates = this.engine.getBeeStates();
        this.renderer.updateBees(beeStates, currentTime);

        if (this.renderer.isHeatmapVisible()) {
          const pheromoneData = this.engine.getPheromoneData();
          this.renderer.updatePheromoneHeatmap(pheromoneData);
        }

        const totalBees = this.engine.getTotalBees();
        if (totalBees > 150 && this.renderer.isTrailsVisible()) {
          this.renderer.setTrailsVisible(false);
          console.log('蜜蜂数量超过150，自动关闭尾迹渲染以保持性能');
        } else if (totalBees <= 150 && !this.renderer.isTrailsVisible()) {
          this.renderer.setTrailsVisible(true);
        }

        this.updateUI();
      }

      this.renderer.render();
    };

    this.animationId = requestAnimationFrame(animate);
  }

  public dispose(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.renderer.dispose();
    this.uiManager.dispose();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new App();

  window.addEventListener('beforeunload', () => {
    app.dispose();
  });
});

export default App;
