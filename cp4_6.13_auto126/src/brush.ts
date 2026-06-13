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
  private brushPreview: THREE.Group;
  private brushRing: THREE.Mesh;
  private brushDisk: THREE.Mesh;
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

    const previewResult = this.createBrushPreview();
    this.brushPreview = previewResult.group;
    this.brushRing = previewResult.ring;
    this.brushDisk = previewResult.disk;

    scene.add(this.brushPreview);

    this.setupEventListeners();
  }

  private createBrushPreview(): { group: THREE.Group; ring: THREE.Mesh; disk: THREE.Mesh } {
    const group = new THREE.Group();
    group.visible = false;
    group.renderOrder = 999;

    const ringGeom = new THREE.RingGeometry(3.8, 4.0, 64);
    ringGeom.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x6ee7b7,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      depthTest: false,
      depthWrite: false
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.renderOrder = 999;
    group.add(ring);

    const diskGeom = new THREE.CircleGeometry(4.0, 64);
    diskGeom.rotateX(-Math.PI / 2);
    const diskMat = new THREE.MeshBasicMaterial({
      color: 0x6ee7b7,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      depthTest: false,
      depthWrite: false
    });
    const disk = new THREE.Mesh(diskGeom, diskMat);
    disk.renderOrder = 998;
    group.add(disk);

    return { group, ring, disk };
  }

  private updateBrushPreview(): void {
    const radius = this.brushParams.radius * this.terrain.cellSize;
    const innerR = Math.max(0.01, radius - 0.2);

    this.brushRing.geometry.dispose();
    const newRingGeom = new THREE.RingGeometry(innerR, radius, 64);
    newRingGeom.rotateX(-Math.PI / 2);
    this.brushRing.geometry = newRingGeom;

    this.brushDisk.geometry.dispose();
    const newDiskGeom = new THREE.CircleGeometry(radius, 64);
    newDiskGeom.rotateX(-Math.PI / 2);
    this.brushDisk.geometry = newDiskGeom;

    const color = this.brushParams.type === 'raise' ? 0x6ee7b7 : 0xfca5a5;
    (this.brushRing.material as THREE.MeshBasicMaterial).color.setHex(color);
    (this.brushDisk.material as THREE.MeshBasicMaterial).color.setHex(color);

    if (this.brushPosition.visible) {
      this.brushPreview.visible = true;
      const grid = this.terrain.worldToGrid(this.brushPosition.worldX, this.brushPosition.worldZ);
      const terrainY = this.terrain.getHeightAt(grid.ix, grid.iz);
      this.brushPreview.position.set(
        this.brushPosition.worldX,
        terrainY + 0.3,
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
      this.terrain.vertexCount
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
}
