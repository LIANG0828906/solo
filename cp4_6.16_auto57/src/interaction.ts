import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { CelestialBody } from './dataLoader';
import { StarSystem } from './StarSystem';

export interface InteractionHandlers {
  onSelect: (body: CelestialBody) => void;
  onDeselect: () => void;
  onCategorySelect: (cat: 'all' | 'star' | 'planet' | 'nebula') => void;
}

export class InteractionManager {
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private starSystem: StarSystem;
  private controls: OrbitControls;
  private raycaster: THREE.Raycaster;
  private pointer: THREE.Vector2;
  private handlers: InteractionHandlers;

  private selectedId: string | null = null;
  private flyFrom: THREE.Vector3 | null = null;
  private flyTo: THREE.Vector3 | null = null;
  private flyLookFrom: THREE.Vector3 | null = null;
  private flyLookTo: THREE.Vector3 | null = null;
  private flyProgress: number = 0;
  private flyDuration: number = 2;
  private isFlying: boolean = false;

  constructor(
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer,
    starSystem: StarSystem,
    handlers: InteractionHandlers
  ) {
    this.camera = camera;
    this.renderer = renderer;
    this.starSystem = starSystem;
    this.handlers = handlers;

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 200;
    this.controls.autoRotate = false;

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const canvas = this.renderer.domElement;
    canvas.addEventListener('click', (e) => this.onCanvasClick(e));
  }

  private onCanvasClick(event: MouseEvent): void {
    if (this.isFlying) return;

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);

    const meshes = this.starSystem.selectableObjects;
    const intersects = this.raycaster.intersectObjects(meshes, false);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const obj = hit.object;
      const bodyId = obj.userData.bodyId;
      const bodyData = this.starSystem.idToData.get(bodyId);
      if (bodyData) {
        if (this.selectedId === bodyId) {
          this.deselect();
        } else {
          this.select(bodyId, bodyData);
        }
      }
    }
  }

  private select(id: string, body: CelestialBody): void {
    this.selectedId = id;
    this.starSystem.setSelected(id);
    this.handlers.onSelect(body);
  }

  public deselect(): void {
    this.selectedId = null;
    this.starSystem.setSelected(null);
    this.handlers.onDeselect();
  }

  public flyToTarget(targetPos: THREE.Vector3): void {
    const direction = new THREE.Vector3()
      .subVectors(this.camera.position, this.controls.target)
      .normalize();

    const distance = Math.min(targetPos.length() * 0.3 + 8, 20);
    const cameraTarget = new THREE.Vector3()
      .copy(targetPos)
      .add(direction.multiplyScalar(distance));

    this.flyFrom = this.camera.position.clone();
    this.flyTo = cameraTarget;
    this.flyLookFrom = this.controls.target.clone();
    this.flyLookTo = targetPos.clone();
    this.flyProgress = 0;
    this.isFlying = true;
    this.controls.enabled = false;
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  public update(delta: number): void {
    if (this.isFlying && this.flyFrom && this.flyTo && this.flyLookFrom && this.flyLookTo) {
      this.flyProgress += delta / this.flyDuration;
      if (this.flyProgress >= 1) {
        this.flyProgress = 1;
        this.isFlying = false;
        this.controls.enabled = true;
        this.controls.target.copy(this.flyLookTo);
        this.camera.position.copy(this.flyTo);
      } else {
        const t = this.easeOutCubic(this.flyProgress);
        this.camera.position.lerpVectors(this.flyFrom, this.flyTo, t);
        const lookTarget = new THREE.Vector3().lerpVectors(this.flyLookFrom, this.flyLookTo, t);
        this.controls.target.copy(lookTarget);
      }
      this.camera.lookAt(this.controls.target);
    }

    if (!this.isFlying) {
      this.controls.update();
    }
  }

  public handleCategorySelect(category: 'all' | 'star' | 'planet' | 'nebula'): void {
    this.starSystem.setFilter(category);

    if (category === 'all') {
      this.handlers.onCategorySelect('all');
      return;
    }

    const firstBody = this.starSystem.getFirstByType(category);
    if (firstBody) {
      const targetPos = this.starSystem.getMeshPosition(firstBody.id);
      if (targetPos) {
        this.flyToTarget(targetPos);
      }
    }

    this.handlers.onCategorySelect(category);
  }

  public dispose(): void {
    this.controls.dispose();
  }
}
