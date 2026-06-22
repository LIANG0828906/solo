import * as THREE from 'three';
import { SceneManager } from './scene';
import { WaterWheel } from './waterwheel';
import { IrrigationSystem } from './irrigation';
import { UIController, FlowDirection } from './ui';

class Application {
  private sceneManager!: SceneManager;
  private waterWheel!: WaterWheel;
  private irrigation!: IrrigationSystem;
  private ui!: UIController;
  private runTime: number = 0;
  private gateOpenness: number = 50;
  private flowDirection: FlowDirection = 'left';

  start(): void {
    const container = document.getElementById('scene-container');
    if (!container) {
      console.error('Scene container not found');
      return;
    }

    this.sceneManager = new SceneManager(container);
    this.sceneManager.init();

    this.waterWheel = new WaterWheel(this.sceneManager.sceneRef);
    this.waterWheel.build(new THREE.Vector3(-60, 75, 0));
    this.waterWheel.setTargetRPM(this.gateOpenness * 0.4);

    this.irrigation = new IrrigationSystem(this.sceneManager.sceneRef);
    this.irrigation.build();
    this.irrigation.setGateOpenness(this.gateOpenness);
    this.irrigation.setFlowDirection(this.flowDirection);

    this.ui = new UIController();
    this.ui.init(
      (value: number) => this.handleGateChange(value),
      (dir: FlowDirection) => this.handleDirectionChange(dir)
    );

    this.sceneManager.onUpdate((dt: number) => this.update(dt));
  }

  private handleGateChange(value: number): void {
    this.gateOpenness = value;
    this.irrigation.setGateOpenness(value);
    this.waterWheel.setTargetRPM(value * 0.4);
  }

  private handleDirectionChange(dir: FlowDirection): void {
    this.flowDirection = dir;
    this.irrigation.setFlowDirection(dir);
  }

  private update(dt: number): void {
    this.runTime += dt;
    this.waterWheel.update(dt);
    this.irrigation.update(dt, this.runTime);

    this.ui.updateStats({
      rpm: this.waterWheel.getCurrentRPM(),
      waterFlow: this.irrigation.getWaterFlow(),
      irrigatedCount: this.irrigation.getIrrigatedCount(),
      runTime: this.runTime
    });
  }

  dispose(): void {
    this.waterWheel.dispose();
    this.irrigation.dispose();
    this.sceneManager.dispose();
  }
}

const app = new Application();

window.addEventListener('DOMContentLoaded', () => {
  app.start();
});

window.addEventListener('beforeunload', () => {
  app.dispose();
});
