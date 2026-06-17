import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SceneManager, GRID_SIZE, CELL_SIZE } from './sceneManager';

export type EditMode = 'place' | 'remove' | 'view';

export interface InteractionOptions {
  mode: EditMode;
  currentColor: string;
  brushSize: number;
}

interface PickResult {
  voxelX: number;
  voxelY: number;
  voxelZ: number;
  adjacentX: number;
  adjacentY: number;
  adjacentZ: number;
  hitObject: THREE.Object3D;
}

export interface HoverInfo {
  x: number | null;
  y: number | null;
  z: number | null;
  displayX: number | null;
  displayY: number | null;
  displayZ: number | null;
}

export class InteractionManager {
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private sceneManager: SceneManager;
  private controls: OrbitControls;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private container: HTMLElement;
  private options: InteractionOptions;
  private isDragging: boolean = false;
  private dragThreshold: number = 3;
  private mouseDownPos: { x: number; y: number } = { x: 0, y: 0 };
  private mouseDownTime: number = 0;
  private activeMouseButton: number = -1;
  private isEditing: boolean = false;
  public previewMesh?: THREE.Mesh;
  private lastHoverInfo: HoverInfo = {
    x: null, y: null, z: null,
    displayX: null, displayY: null, displayZ: null
  };

  constructor(
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer,
    sceneManager: SceneManager,
    container: HTMLElement,
    options: InteractionOptions
  ) {
    this.camera = camera;
    this.renderer = renderer;
    this.sceneManager = sceneManager;
    this.container = container;
    this.options = options;

    this.controls = new OrbitControls(camera, renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 1;
    this.controls.maxDistance = 50;
    this.controls.target.set(GRID_SIZE / 2, GRID_SIZE / 2, GRID_SIZE / 2);
    this.controls.enablePan = true;
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN
    };

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.bindEvents();
  }

  public updateOptions(options: Partial<InteractionOptions>): void {
    Object.assign(this.options, options);
    if (options.currentColor !== undefined && this.previewMesh) {
      const mat = this.previewMesh.material as THREE.MeshBasicMaterial;
      mat.color.set(options.currentColor);
    }
  }

  public getControls(): OrbitControls {
    return this.controls;
  }

  public setPreviewMesh(mesh?: THREE.Mesh): void {
    this.previewMesh = mesh;
  }

  public getHoverInfo(): HoverInfo {
    return { ...this.lastHoverInfo };
  }

  private bindEvents(): void {
    const dom = this.renderer.domElement;

    dom.addEventListener('pointerdown', this.onPointerDown);
    dom.addEventListener('pointermove', this.onPointerMove);
    dom.addEventListener('pointerup', this.onPointerUp);
    dom.addEventListener('pointerleave', this.onPointerLeave);
    dom.addEventListener('contextmenu', this.onContextMenu);
    window.addEventListener('resize', this.onResize);
  }

  private onContextMenu = (e: MouseEvent): void => {
    e.preventDefault();
  };

  private onResize = (): void => {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private onPointerDown = (e: PointerEvent): void => {
    this.isDragging = false;
    this.mouseDownPos = { x: e.clientX, y: e.clientY };
    this.mouseDownTime = performance.now();
    this.activeMouseButton = e.button;

    if ((e.button === 0 && this.options.mode !== 'view') || e.button === 2) {
      this.isEditing = true;
      this.controls.enabled = false;
    } else {
      this.controls.enabled = true;
    }
  };

  private onPointerMove = (e: PointerEvent): void => {
    const dx = e.clientX - this.mouseDownPos.x;
    const dy = e.clientY - this.mouseDownPos.y;
    if (!this.isDragging && Math.sqrt(dx * dx + dy * dy) > this.dragThreshold) {
      this.isDragging = true;
      if (this.isEditing) {
        this.controls.enabled = false;
      }
    }

    this.updateMouse(e);
    this.updatePreview();

    if (this.isEditing && this.isDragging) {
      this.handleAction(e.button, true);
    }
  };

  private onPointerUp = (e: PointerEvent): void => {
    if (this.isEditing && !this.isDragging) {
      this.handleAction(this.activeMouseButton, false);
    }

    this.isEditing = false;
    this.isDragging = false;
    this.activeMouseButton = -1;
    this.controls.enabled = true;
  };

  private onPointerLeave = (_e: PointerEvent): void => {
    this.isEditing = false;
    this.isDragging = false;
    this.activeMouseButton = -1;
    this.controls.enabled = true;
    this.lastHoverInfo = {
      x: null, y: null, z: null,
      displayX: null, displayY: null, displayZ: null
    };
    if (this.previewMesh) this.previewMesh.visible = false;
  };

  private updateMouse(e: PointerEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private updatePreview(): void {
    const pick = this.pick();

    if (!pick) {
      this.lastHoverInfo = {
        x: null, y: null, z: null,
        displayX: null, displayY: null, displayZ: null
      };
      if (this.previewMesh) this.previewMesh.visible = false;
      return;
    }

    this.lastHoverInfo = {
      x: pick.voxelX,
      y: pick.voxelY,
      z: pick.voxelZ,
      displayX: pick.adjacentX,
      displayY: pick.adjacentY,
      displayZ: pick.adjacentZ
    };

    if (!this.previewMesh) return;

    if (this.options.mode === 'place') {
      this.previewMesh.visible = true;
      this.previewMesh.position.set(
        pick.adjacentX * CELL_SIZE,
        pick.adjacentY * CELL_SIZE,
        pick.adjacentZ * CELL_SIZE
      );
      const mat = this.previewMesh.material as THREE.MeshBasicMaterial;
      mat.color.set(this.options.currentColor);
      mat.opacity = 0.55;
      mat.wireframe = false;
      mat.transparent = true;
    } else {
      this.previewMesh.visible = false;
    }
  }

  private pick(): PickResult | null {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    const targets: THREE.Object3D[] = [
      ...this.sceneManager.getInstancedMeshes(),
      this.sceneManager.getGroundPlane()
    ];

    const hits = this.raycaster.intersectObjects(targets, false);
    if (hits.length === 0) return null;

    const hit = hits[0];
    const hitObject = hit.object;

    if (hitObject === this.sceneManager.getGroundPlane() && hit.point) {
      const gx = Math.floor(hit.point.x / CELL_SIZE);
      const gy = 0;
      const gz = Math.floor(hit.point.z / CELL_SIZE);
      
      if (gx < 0 || gx >= GRID_SIZE || gz < 0 || gz >= GRID_SIZE) return null;

      return {
        voxelX: gx,
        voxelY: gy,
        voxelZ: gz,
        adjacentX: gx,
        adjacentY: gy + 1,
        adjacentZ: gz,
        hitObject
      };
    }

    if (hitObject instanceof THREE.InstancedMesh && hit.instanceId !== undefined) {
      const matrix = new THREE.Matrix4();
      hitObject.getMatrixAt(hit.instanceId, matrix);
      const pos = new THREE.Vector3();
      pos.setFromMatrixPosition(matrix);

      const gx = Math.round(pos.x / CELL_SIZE);
      const gy = Math.round(pos.y / CELL_SIZE);
      const gz = Math.round(pos.z / CELL_SIZE);

      const normal = hit.face ? hit.face.normal.clone() : new THREE.Vector3(0, 1, 0);
      normal.transformDirection(hitObject.matrixWorld).normalize();

      const ax = gx + Math.round(normal.x);
      const ay = gy + Math.round(normal.y);
      const az = gz + Math.round(normal.z);

      return {
        voxelX: gx,
        voxelY: gy,
        voxelZ: gz,
        adjacentX: ax,
        adjacentY: ay,
        adjacentZ: az,
        hitObject
      };
    }

    return null;
  }

  private handleAction(button: number, isDrag: boolean): void {
    if (this.options.mode === 'view') return;

    let actionMode: EditMode = this.options.mode;
    if (button === 2) {
      actionMode = 'remove';
    } else if (button !== 0) {
      return;
    }

    const pick = this.pick();
    if (!pick) return;

    if (actionMode === 'place') {
      if (this.options.brushSize === 1) {
        this.sceneManager.addVoxel(
          pick.adjacentX,
          pick.adjacentY,
          pick.adjacentZ,
          this.options.currentColor
        );
      } else {
        this.sceneManager.brushPlace(
          pick.adjacentX,
          pick.adjacentY,
          pick.adjacentZ,
          this.options.currentColor,
          this.options.brushSize
        );
      }
    } else if (actionMode === 'remove') {
      const voxel = this.sceneManager.getVoxel(pick.voxelX, pick.voxelY, pick.voxelZ);
      if (!voxel || voxel.isGround) return;

      if (this.options.brushSize === 1) {
        this.sceneManager.removeVoxel(pick.voxelX, pick.voxelY, pick.voxelZ);
      } else {
        this.sceneManager.brushRemove(
          pick.voxelX,
          pick.voxelY,
          pick.voxelZ,
          this.options.brushSize
        );
      }
    }
  }

  public update(deltaTime: number): void {
    this.controls.update();
  }

  public dispose(): void {
    const dom = this.renderer.domElement;
    dom.removeEventListener('pointerdown', this.onPointerDown);
    dom.removeEventListener('pointermove', this.onPointerMove);
    dom.removeEventListener('pointerup', this.onPointerUp);
    dom.removeEventListener('pointerleave', this.onPointerLeave);
    dom.removeEventListener('contextmenu', this.onContextMenu);
    window.removeEventListener('resize', this.onResize);
    this.controls.dispose();
  }
}
