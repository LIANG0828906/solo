import * as THREE from 'three';

export const COLOR_PALETTE: string[] = [
  '#0047AB',
  '#DC143C',
  '#228B22',
  '#FFD700',
  '#C0C0C0'
];

export const MAX_BUILDINGS = 50;
export const GRID_SIZE = 20;
export const BUILDING_WIDTH = 0.8;

export interface BuildingData {
  id: number;
  height: number;
  color: string;
  position: THREE.Vector3;
}

type AnimationType = 'drop' | 'delete' | 'warning' | 'none';

interface BuildingEntry {
  data: BuildingData;
  group: THREE.Group;
  mesh: THREE.Mesh;
  edges: THREE.LineSegments;
  selectionRing: THREE.LineSegments | null;
  previewMesh: THREE.Mesh | null;
  originalPosition: THREE.Vector3;
  animation: {
    type: AnimationType;
    startTime: number;
    duration: number;
  };
  isSelected: boolean;
}

export type BuildingManagerEvent = 'count-changed' | 'selection-changed';

export class BuildingManager {
  private scene: THREE.Scene;
  private buildings: BuildingEntry[] = [];
  private nextId = 1;
  private selectedId: number | null = null;
  private raycaster = new THREE.Raycaster();
  private groundPlane: THREE.Plane;
  private listeners = new Map<BuildingManagerEvent, Set<() => void>>();
  private dashedLineMat: THREE.LineDashedMaterial | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.initEventListeners();
  }

  private initEventListeners(): void {
    this.listeners.set('count-changed', new Set());
    this.listeners.set('selection-changed', new Set());
  }

  on(event: BuildingManagerEvent, callback: () => void): void {
    this.listeners.get(event)?.add(callback);
  }

  off(event: BuildingManagerEvent, callback: () => void): void {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: BuildingManagerEvent): void {
    this.listeners.get(event)?.forEach((cb) => cb());
  }

  getBuildingCount(): number {
    return this.buildings.length;
  }

  getSelectedId(): number | null {
    return this.selectedId;
  }

  getSelectedData(): BuildingData | null {
    const entry = this.buildings.find((b) => b.data.id === this.selectedId);
    return entry ? { ...entry.data, position: entry.data.position.clone() } : null;
  }

  private createDashedLineMaterial(): THREE.LineDashedMaterial {
    if (!this.dashedLineMat) {
      this.dashedLineMat = new THREE.LineDashedMaterial({
        color: 0xffd700,
        dashSize: 0.1,
        gapSize: 0.08,
        linewidth: 2
      });
    }
    return this.dashedLineMat;
  }

  private createBuildingMesh(height: number, color: string): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(BUILDING_WIDTH, height, BUILDING_WIDTH);
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      metalness: 0.3,
      roughness: 0.6
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = height / 2;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  private createEdgeLines(height: number, color: string): THREE.LineSegments {
    const geometry = new THREE.EdgesGeometry(
      new THREE.BoxGeometry(BUILDING_WIDTH * 1.002, height * 1.002, BUILDING_WIDTH * 1.002)
    );
    const edgeColor = new THREE.Color(color).multiplyScalar(0.4);
    const material = new THREE.LineBasicMaterial({ color: edgeColor });
    const edges = new THREE.LineSegments(geometry, material);
    edges.position.y = height / 2;
    return edges;
  }

  private createSelectionRing(height: number): THREE.LineSegments {
    const boxGeo = new THREE.BoxGeometry(
      BUILDING_WIDTH * 1.05,
      height * 1.05,
      BUILDING_WIDTH * 1.05
    );
    const edges = new THREE.EdgesGeometry(boxGeo);
    const line = new THREE.LineSegments(edges, this.createDashedLineMaterial());
    line.computeLineDistances();
    line.position.y = height / 2;
    line.visible = false;
    return line;
  }

  private createPreviewMesh(height: number, color: string): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(BUILDING_WIDTH, height, BUILDING_WIDTH);
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: 0.35,
      depthWrite: false
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = height / 2;
    mesh.visible = false;
    return mesh;
  }

  addBuilding(position: THREE.Vector3, height?: number, color?: string, animate = true): BuildingData | null {
    if (this.buildings.length >= MAX_BUILDINGS) return null;

    const h = height ?? this.randomHeight();
    const c = color ?? this.randomColor();
    const pos = position.clone();

    const entry: BuildingEntry = {
      data: {
        id: this.nextId++,
        height: h,
        color: c,
        position: pos
      },
      group: new THREE.Group(),
      mesh: this.createBuildingMesh(h, c),
      edges: this.createEdgeLines(h, c),
      selectionRing: this.createSelectionRing(h),
      previewMesh: this.createPreviewMesh(h, c),
      originalPosition: pos.clone(),
      animation: { type: 'none', startTime: 0, duration: 0 },
      isSelected: false
    };

    entry.group.position.copy(pos);
    entry.group.add(entry.mesh);
    entry.group.add(entry.edges);
    if (entry.selectionRing) entry.group.add(entry.selectionRing);
    if (entry.previewMesh) entry.group.add(entry.previewMesh);

    (entry.mesh as any).buildingId = entry.data.id;
    (entry.edges as any).buildingId = entry.data.id;

    this.scene.add(entry.group);
    this.buildings.push(entry);

    if (animate) {
      entry.group.position.y = 5;
      entry.animation = {
        type: 'drop',
        startTime: performance.now(),
        duration: 500
      };
    }

    this.emit('count-changed');
    return { ...entry.data, position: entry.data.position.clone() };
  }

  private randomHeight(): number {
    const steps = Math.floor((3.0 - 1.0) / 0.2) + 1;
    const idx = Math.floor(Math.random() * steps);
    return 1.0 + idx * 0.2;
  }

  private randomColor(): string {
    return COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
  }

  selectBuilding(id: number | null): void {
    if (this.selectedId === id) return;

    const prevEntry = this.buildings.find((b) => b.data.id === this.selectedId);
    if (prevEntry) {
      prevEntry.isSelected = false;
      if (prevEntry.selectionRing) prevEntry.selectionRing.visible = false;
    }

    this.selectedId = id;
    const newEntry = this.buildings.find((b) => b.data.id === this.selectedId);
    if (newEntry) {
      newEntry.isSelected = true;
      if (newEntry.selectionRing) newEntry.selectionRing.visible = true;
    }

    this.emit('selection-changed');
  }

  pickBuilding(worldPoint: THREE.Vector3): number | null {
    for (const entry of this.buildings) {
      const dx = Math.abs(worldPoint.x - entry.data.position.x);
      const dz = Math.abs(worldPoint.z - entry.data.position.z);
      if (dx < BUILDING_WIDTH / 2 + 0.05 && dz < BUILDING_WIDTH / 2 + 0.05) {
        return entry.data.id;
      }
    }
    return null;
  }

  private raycastBuildings(
    raycaster: THREE.Raycaster,
    camera: THREE.Camera,
    ndcX: number,
    ndcY: number
  ): { id: number; point: THREE.Vector3 } | null {
    raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
    const meshes = this.buildings.map((b) => b.mesh);
    const intersects = raycaster.intersectObjects(meshes, false);
    if (intersects.length > 0) {
      const mesh = intersects[0].object as THREE.Mesh;
      const id = (mesh as any).buildingId as number;
      return { id, point: intersects[0].point };
    }
    return null;
  }

  raycastGround(
    raycaster: THREE.Raycaster,
    camera: THREE.Camera,
    ndcX: number,
    ndcY: number
  ): THREE.Vector3 | null {
    raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
    const point = new THREE.Vector3();
    raycaster.ray.intersectPlane(this.groundPlane, point);
    if (!point) return null;
    const half = GRID_SIZE / 2;
    point.x = Math.max(-half + BUILDING_WIDTH / 2, Math.min(half - BUILDING_WIDTH / 2, point.x));
    point.z = Math.max(-half + BUILDING_WIDTH / 2, Math.min(half - BUILDING_WIDTH / 2, point.z));
    point.y = 0;
    return point;
  }

  pickBuildingAtScreen(
    camera: THREE.Camera,
    ndcX: number,
    ndcY: number
  ): { id: number; point: THREE.Vector3 } | null {
    return this.raycastBuildings(this.raycaster, camera, ndcX, ndcY);
  }

  checkOverlap(position: THREE.Vector3, excludeId?: number): boolean {
    for (const entry of this.buildings) {
      if (excludeId !== undefined && entry.data.id === excludeId) continue;
      const dx = Math.abs(position.x - entry.data.position.x);
      const dz = Math.abs(position.z - entry.data.position.z);
      if (dx < BUILDING_WIDTH && dz < BUILDING_WIDTH) {
        return true;
      }
    }
    return false;
  }

  startDrag(id: number): void {
    const entry = this.buildings.find((b) => b.data.id === id);
    if (!entry) return;
    entry.originalPosition = entry.data.position.clone();
    if (entry.previewMesh) {
      entry.previewMesh.visible = true;
      entry.previewMesh.position.copy(entry.group.position);
    }
  }

  updateDragPosition(id: number, position: THREE.Vector3): void {
    const entry = this.buildings.find((b) => b.data.id === id);
    if (!entry) return;
    if (entry.previewMesh) {
      entry.previewMesh.visible = true;
      entry.previewMesh.position.set(position.x, entry.data.height / 2, position.z);
    }
  }

  finishDrag(id: number): boolean {
    const entry = this.buildings.find((b) => b.data.id === id);
    if (!entry) return false;

    const newPos = entry.originalPosition.clone();
    if (entry.previewMesh) {
      newPos.x = entry.previewMesh.position.x;
      newPos.z = entry.previewMesh.position.z;
      entry.previewMesh.visible = false;
    }

    if (this.checkOverlap(newPos, id)) {
      entry.animation = {
        type: 'warning',
        startTime: performance.now(),
        duration: 500
      };
      return false;
    }

    entry.data.position.copy(newPos);
    entry.group.position.copy(newPos);
    entry.originalPosition = newPos.clone();
    return true;
  }

  cancelDrag(id: number): void {
    const entry = this.buildings.find((b) => b.data.id === id);
    if (!entry) return;
    if (entry.previewMesh) entry.previewMesh.visible = false;
  }

  deleteSelected(): boolean {
    if (this.selectedId === null) return false;
    const idx = this.buildings.findIndex((b) => b.data.id === this.selectedId);
    if (idx === -1) return false;

    const entry = this.buildings[idx];
    entry.animation = {
      type: 'delete',
      startTime: performance.now(),
      duration: 400
    };

    setTimeout(() => {
      this.scene.remove(entry.group);
      entry.mesh.geometry.dispose();
      (entry.mesh.material as THREE.Material).dispose();
      entry.edges.geometry.dispose();
      (entry.edges.material as THREE.Material).dispose();
      if (entry.selectionRing) {
        entry.selectionRing.geometry.dispose();
      }
      if (entry.previewMesh) {
        entry.previewMesh.geometry.dispose();
        (entry.previewMesh.material as THREE.Material).dispose();
      }
    }, 450);

    this.buildings.splice(idx, 1);
    this.selectedId = null;
    this.emit('count-changed');
    this.emit('selection-changed');
    return true;
  }

  changeSelectedColor(paletteIndex: number): boolean {
    if (this.selectedId === null) return false;
    if (paletteIndex < 0 || paletteIndex >= COLOR_PALETTE.length) return false;

    const entry = this.buildings.find((b) => b.data.id === this.selectedId);
    if (!entry) return false;

    const color = COLOR_PALETTE[paletteIndex];
    entry.data.color = color;
    (entry.mesh.material as THREE.MeshStandardMaterial).color.set(color);
    const edgeColor = new THREE.Color(color).multiplyScalar(0.4);
    (entry.edges.material as THREE.LineBasicMaterial).color.set(edgeColor);
    if (entry.previewMesh) {
      (entry.previewMesh.material as THREE.MeshStandardMaterial).color.set(color);
    }
    return true;
  }

  update(now: number): void {
    for (const entry of this.buildings) {
      if (entry.animation.type !== 'none') {
        const elapsed = now - entry.animation.startTime;
        const t = Math.min(1, elapsed / entry.animation.duration);

        if (entry.animation.type === 'drop') {
          const ease = 1 - Math.pow(1 - t, 3);
          const bounce = Math.sin(t * Math.PI * 2) * (1 - t) * 0.1;
          const y = (1 - ease) * 5 + bounce;
          entry.group.position.y = Math.max(0, y);
          if (t >= 1) {
            entry.group.position.y = 0;
            entry.animation.type = 'none';
          }
        } else if (entry.animation.type === 'delete') {
          const ease = t * t;
          entry.group.position.y = ease * 3;
          const opacity = 1 - ease;
          (entry.mesh.material as THREE.MeshStandardMaterial).transparent = true;
          (entry.mesh.material as THREE.MeshStandardMaterial).opacity = opacity;
          (entry.edges.material as THREE.LineBasicMaterial).transparent = true;
          (entry.edges.material as THREE.LineBasicMaterial).opacity = opacity;
          if (entry.selectionRing) {
            (entry.selectionRing.material as THREE.LineDashedMaterial).transparent = true;
            (entry.selectionRing.material as THREE.LineDashedMaterial).opacity = opacity;
          }
          if (t >= 1) {
            entry.animation.type = 'none';
          }
        } else if (entry.animation.type === 'warning') {
          const flash = Math.sin(t * Math.PI * 8) * 0.5 + 0.5;
          if (flash > 0.5) {
            (entry.mesh.material as THREE.MeshStandardMaterial).color.set(0xff3333);
          } else {
            (entry.mesh.material as THREE.MeshStandardMaterial).color.set(entry.data.color);
          }
          if (t >= 1) {
            (entry.mesh.material as THREE.MeshStandardMaterial).color.set(entry.data.color);
            entry.animation.type = 'none';
          }
        }
      }

      if (entry.isSelected && entry.selectionRing) {
        const pulse = Math.sin(now / 150) * 0.5 + 0.5;
        (entry.selectionRing.material as THREE.LineDashedMaterial).dashSize = 0.08 + pulse * 0.06;
        (entry.selectionRing.material as THREE.LineDashedMaterial).gapSize = 0.1 - pulse * 0.04;
        (entry.selectionRing.material as THREE.LineDashedMaterial).opacity = 0.7 + pulse * 0.3;
        (entry.selectionRing.material as THREE.LineDashedMaterial).transparent = true;
        entry.selectionRing.computeLineDistances();
      }
    }
  }

  dispose(): void {
    for (const entry of [...this.buildings]) {
      this.scene.remove(entry.group);
      entry.mesh.geometry.dispose();
      (entry.mesh.material as THREE.Material).dispose();
      entry.edges.geometry.dispose();
      (entry.edges.material as THREE.Material).dispose();
      if (entry.selectionRing) entry.selectionRing.geometry.dispose();
      if (entry.previewMesh) {
        entry.previewMesh.geometry.dispose();
        (entry.previewMesh.material as THREE.Material).dispose();
      }
    }
    this.buildings = [];
  }
}
