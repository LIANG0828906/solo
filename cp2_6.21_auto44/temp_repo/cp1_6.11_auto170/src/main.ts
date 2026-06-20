import * as THREE from 'three';
import { SceneManager } from './scene';
import { Train } from './train';
import { EffectsManager } from './effects';
import { UIManager } from './ui';
import { ViewType } from './types';
import * as TWEEN from 'three/examples/jsm/libs/tween.module.js';

class SteamTrainApp {
  private sceneManager: SceneManager;
  private train: Train;
  private effects: EffectsManager;
  private ui: UIManager;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private clock: THREE.Clock;
  private animationId: number | null = null;

  constructor() {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.clock = new THREE.Clock();

    this.sceneManager = new SceneManager('canvas-container');
    this.train = new Train();
    this.sceneManager.scene.add(this.train.group);

    this.effects = new EffectsManager(this.sceneManager.scene);
    
    this.ui = new UIManager('app', {
      onSpeedChange: (speed) => this.handleSpeedChange(speed),
      onViewChange: (view) => this.handleViewChange(view),
      onStartToggle: () => this.toggleTrain()
    });

    this.setupEventListeners();
    this.updateChimneyPosition();
    this.animate();
  }

  private setupEventListeners(): void {
    const canvas = this.sceneManager.getCanvas();
    canvas.addEventListener('click', (event) => this.onMouseClick(event));

    this.sceneManager.controls.addEventListener('change', () => {
      // 可用于添加额外的交互逻辑
    });
  }

  private onMouseClick(event: MouseEvent): void {
    const canvas = this.sceneManager.getCanvas();
    const rect = canvas.getBoundingClientRect();

    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);

    const trainMeshes: THREE.Object3D[] = [];
    this.train.group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        trainMeshes.push(child);
      }
    });

    const intersects = this.raycaster.intersectObjects(trainMeshes, false);

    if (intersects.length > 0) {
      const clickedObject = intersects[0].object;
      this.handlePartClick(clickedObject);
    }
  }

  private handlePartClick(object: THREE.Object3D): void {
    let partId: string | null = null;

    if (object.userData && object.userData.partId) {
      partId = object.userData.partId;
    } else {
      let parent = object.parent;
      while (parent) {
        if (parent.userData && parent.userData.partId) {
          partId = parent.userData.partId;
          break;
        }
        parent = parent.parent;
      }
    }

    if (partId) {
      const part = this.train.getPartById(partId);
      if (part) {
        if (partId === 'start_button') {
          this.toggleTrain();
        } else {
          this.effects.highlightMesh(part.mesh, partId);
          this.ui.showInfoPanel(part.name, part.description);
        }
      }
    }
  }

  private handleSpeedChange(speed: number): void {
    this.train.setSpeed(speed);
    
    if (speed > 0 && !this.train.isRunningState()) {
      this.train.setRunning(true);
      this.effects.startEmission();
    } else if (speed === 0) {
      this.train.setRunning(false);
      this.effects.stopEmission();
    }
  }

  private handleViewChange(view: ViewType): void {
    this.animateCameraToView(view);
  }

  private animateCameraToView(view: ViewType): void {
    const startPosition = this.sceneManager.camera.position.clone();
    const startTarget = this.sceneManager.controls.target.clone();

    let endPosition: THREE.Vector3;
    let endTarget: THREE.Vector3 = new THREE.Vector3(0, 1, 0);

    switch (view) {
      case 'top':
        endPosition = new THREE.Vector3(0, 8, 0.01);
        break;
      case 'side':
        endPosition = new THREE.Vector3(6, 1.5, 0);
        break;
      case 'front':
        endPosition = new THREE.Vector3(0, 2, 6);
        break;
      case 'perspective':
        endPosition = new THREE.Vector3(6, 4, 6);
        break;
      default:
        endPosition = new THREE.Vector3(6, 4, 6);
    }

    const duration = 800;

    new TWEEN.Tween({ x: startPosition.x, y: startPosition.y, z: startPosition.z })
      .to({ x: endPosition.x, y: endPosition.y, z: endPosition.z }, duration)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .onUpdate((obj) => {
        this.sceneManager.camera.position.set(obj.x, obj.y, obj.z);
      })
      .start();

    new TWEEN.Tween({ x: startTarget.x, y: startTarget.y, z: startTarget.z })
      .to({ x: endTarget.x, y: endTarget.y, z: endTarget.z }, duration)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .onUpdate((obj) => {
        this.sceneManager.controls.target.set(obj.x, obj.y, obj.z);
      })
      .start();
  }

  private toggleTrain(): void {
    const isRunning = this.train.toggleRunning();
    if (isRunning) {
      if (this.train.getSpeed() === 0) {
        this.train.setSpeed(1);
        this.ui.setSpeed(1);
      }
      this.effects.startEmission();
    } else {
      this.effects.stopEmission();
    }
  }

  private updateChimneyPosition(): void {
    const chimneyPos = this.train.getChimneyPosition();
    this.effects.setChimneyPosition(chimneyPos);
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(() => this.animate());

    const deltaTime = Math.min(this.clock.getDelta(), 0.1);

    TWEEN.update();
    this.train.update(deltaTime);
    this.effects.update(deltaTime);
    this.updateChimneyPosition();
    this.sceneManager.render();
  }

  public dispose(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.effects.dispose();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new SteamTrainApp();
});
