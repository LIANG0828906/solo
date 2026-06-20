import './styles.css';
import * as THREE from 'three';
import { SceneManager } from './SceneManager';
import { ProductModel } from './ProductModel';
import { UIController } from './UIController';

class App {
  private sceneManager: SceneManager;
  private productModel: ProductModel;
  private uiController: UIController;
  private clock: THREE.Clock;
  private animationId: number | null = null;

  constructor() {
    this.clock = new THREE.Clock();
    this.sceneManager = new SceneManager('canvas-container');
    this.productModel = new ProductModel();
    this.productModel.addToScene(this.sceneManager.getScene());
    this.uiController = new UIController(this.sceneManager, this.productModel, 'canvas-container');

    this.start();
  }

  private start(): void {
    this.animate();
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(() => this.animate());

    const deltaTime = Math.min(this.clock.getDelta(), 0.1);

    this.productModel.update(deltaTime);
    this.uiController.update(deltaTime);
    this.sceneManager.render();
  }

  public dispose(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new App();
});
