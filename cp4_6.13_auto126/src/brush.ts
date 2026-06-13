import * as THREE from 'three';
import { Terrain } from './terrain';
import { BrushParams, BrushPosition } from './module_a/shared_types';
import { calculateCircleIndices } from './module_b/utils';

export class BrushController {
  private terrain: Terrain;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private isDragging: boolean;
  private brushPreview: THREE.Mesh;
  public brushParams: BrushParams;
  public brushPosition: BrushPosition;
  public onBrushPositionChange: ((pos: BrushPosition) => void) | null;
  private lastEditTime: number;
  private minEditInterval: number;

  constructor(
    terrain: Terrain,
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene
  ) {
    this.terrain = terrain;
    this.camera = camera;
    this.renderer = renderer;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.isDragging = false;
    this.lastEditTime = 0;
    this.minEditInterval = 16;

    this.brushParams = {
      type: 'raise',
      radius: 4,
      strength: 0.5
    };

    this.brushPosition = {
      worldX: 0,
      worldZ: 0,
      visible: false
    };

    this.onBrushPositionChange = null;

    this.brushPreview = this.createBrushPreview();
    scene.add(this.brushPreview);

    this.setupEventListeners();
  }

  private createBrushPreview(): THREE.Mesh {
    const geometry = new THREE.RingGeometry(0.1, 0.15, 64);
    geometry.rotateX(-Math.PI / 2);
    const material = new THREE.MeshBasicMaterial({
      color: 0x6ee7b7,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
      depthTest: false
    });
    const ring = new THREE.Mesh(geometry, material);
    ring.visible = false;
    return ring;
  }

  private updateBrushPreview(): void {
    const radius = this.brushParams.radius * this.terrain.cellSize;
    const newGeometry = new THREE.RingGeometry(radius * 0.95, radius, 64);
    newGeometry.rotateX(-Math.PI / 2);
    this.brushPreview.geometry.dispose();
    this.brushPreview.geometry = newGeometry;

    const color = this.brushParams.type === 'raise' ? 0x6ee7b7 : 0xfca5a5;
    (this.brushPreview.material as THREE.MeshBasicMaterial).color.setHex(color);

    if (this.brushPosition.visible) {
      this.brushPreview.visible = true;
      this.brushPreview.position.set(
        this.brushPosition.worldX,
        0.1,
        this.brushPosition.worldZ
      );
    } else {
      this.brushPreview.visible = false;
    }
  }

  private setupEventListeners(): void {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    canvas.addEventListener('mouseup', () => this.onMouseUp());
    canvas.addEventListener('mouseleave', () => this.onMouseLeave());
    canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
  }

  private updateMousePosition(e: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private raycastTerrain(): THREE.Vector3 | null {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObject(this.terrain.mesh);
    if (intersects.length > 0) {
      return intersects[0].point;
    }
    return null;
  }

  private onMouseMove(e: MouseEvent): void {
    this.updateMousePosition(e);
    const hitPoint = this.raycastTerrain();

    if (hitPoint) {
      this.brushPosition = {
        worldX: hitPoint.x,
        worldZ: hitPoint.z,
        visible: true
      };
      this.updateBrushPreview();

      if (this.onBrushPositionChange) {
        this.onBrushPositionChange(this.brushPosition);
      }

      if (this.isDragging) {
        this.applyBrush();
      }
    } else {
      this.brushPosition.visible = false;
      this.brushPreview.visible = false;
      if (this.onBrushPositionChange) {
        this.onBrushPositionChange(this.brushPosition);
      }
    }
  }

  private onMouseDown(e: MouseEvent): void {
    if (e.button !== 0) return;
    this.isDragging = true;
    this.applyBrush();
  }

  private onMouseUp(): void {
    this.isDragging = false;
  }

  private onMouseLeave(): void {
    this.isDragging = false;
    this.brushPosition.visible = false;
    this.brushPreview.visible = false;
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault();
  }

  private applyBrush(): void {
    const now = performance.now();
    if (now - this.lastEditTime < this.minEditInterval) return;
    this.lastEditTime = now;

    if (!this.brushPosition.visible) return;

    const grid = this.terrain.worldToGrid(this.brushPosition.worldX, this.brushPosition.worldZ);
    const indices = calculateCircleIndices(
      grid.ix,
      grid.iz,
      this.brushParams.radius,
      this.terrain.gridSize
    );

    const sign = this.brushParams.type === 'raise' ? 1 : -1;
    const delta = sign * this.brushParams.strength * 0.1;

    for (const idx of indices) {
      this.terrain.addHeightAt(idx.ix, idx.iz, delta * idx.weight);
    }

    this.terrain.update();
  }

  public setBrushType(type: 'raise' | 'lower'): void {
    this.brushParams.type = type;
    this.updateBrushPreview();
  }

  public setBrushRadius(radius: number): void {
    this.brushParams.radius = radius;
    this.updateBrushPreview();
  }

  public setBrushStrength(strength: number): void {
    this.brushParams.strength = strength;
  }

  public update(): void {
    this.updateBrushPreview();
  }
}
