import * as THREE from 'three';
import type { SharedSceneState } from './main';

type HoverCallback = (id: number | null) => void;
type ClickCallback = (id: number | null, screenPos: { x: number; y: number }) => void;

export class InteractionManager {
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private camera: THREE.Camera;
  private domElement: HTMLElement;
  private buildingMeshes: THREE.Mesh[];
  private sharedState: SharedSceneState;

  private hoveredId: number | null = null;
  private targetEmissiveIntensity: number = 0;
  private currentEmissiveIntensity: number = 0;
  private hoveredMesh: THREE.Mesh | null = null;

  private hoverCallbacks: HoverCallback[] = [];
  private clickCallbacks: ClickCallback[] = [];
  private animFrameId: number | null = null;

  constructor(
    camera: THREE.Camera,
    domElement: HTMLElement,
    buildingMeshes: THREE.Mesh[],
    sharedState: SharedSceneState,
  ) {
    this.camera = camera;
    this.domElement = domElement;
    this.buildingMeshes = buildingMeshes;
    this.sharedState = sharedState;

    this.domElement.addEventListener('mousemove', this.onMouseMove);
    this.domElement.addEventListener('click', this.handleClick);
    this.startHoverAnimation();
  }

  onHover(cb: HoverCallback) {
    this.hoverCallbacks.push(cb);
  }

  onClick(cb: ClickCallback) {
    this.clickCallbacks.push(cb);
  }

  private onMouseMove = (event: MouseEvent) => {
    const rect = this.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.buildingMeshes);

    if (intersects.length > 0) {
      const mesh = intersects[0].object as THREE.Mesh;
      const id = (mesh as any).buildingId as number;
      if (this.hoveredId !== id) {
        this.resetHover();
        this.hoveredId = id;
        this.hoveredMesh = mesh;
        this.targetEmissiveIntensity = 0.4;
        (mesh.material as THREE.MeshStandardMaterial).emissive.set(0x7c3aed);
      }
    } else {
      this.resetHover();
      this.hoveredId = null;
      this.hoveredMesh = null;
      this.targetEmissiveIntensity = 0;
    }

    this.hoverCallbacks.forEach((cb) => cb(this.hoveredId));
  };

  private handleClick = (event: MouseEvent) => {
    const rect = this.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.buildingMeshes);

    if (intersects.length > 0) {
      const mesh = intersects[0].object as THREE.Mesh;
      const id = (mesh as any).buildingId as number;
      this.clickCallbacks.forEach((cb) =>
        cb(id, { x: event.clientX, y: event.clientY }),
      );
    } else {
      this.clickCallbacks.forEach((cb) => cb(null, { x: event.clientX, y: event.clientY }));
    }
  };

  private resetHover() {
    if (this.hoveredMesh) {
      const mat = this.hoveredMesh.material as THREE.MeshStandardMaterial;
      mat.emissive.set(0x000000);
      mat.emissiveIntensity = 0;
    }
    this.currentEmissiveIntensity = 0;
  }

  private startHoverAnimation() {
    const animate = () => {
      if (this.hoveredMesh) {
        this.currentEmissiveIntensity += (this.targetEmissiveIntensity - this.currentEmissiveIntensity) * 0.15;
        (this.hoveredMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = this.currentEmissiveIntensity;
      }
      this.animFrameId = requestAnimationFrame(animate);
    };
    animate();
  }

  dispose() {
    if (this.animFrameId !== null) cancelAnimationFrame(this.animFrameId);
    this.domElement.removeEventListener('mousemove', this.onMouseMove);
    this.domElement.removeEventListener('click', this.handleClick);
    this.hoverCallbacks = [];
    this.clickCallbacks = [];
  }
}
