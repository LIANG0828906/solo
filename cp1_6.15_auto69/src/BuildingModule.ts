import * as THREE from 'three';
import type { BuildingModule as BuildingModuleType } from './types';

export type HeatLevel = 'low' | 'medium' | 'high';

export interface BuildingData {
  id: string;
  address: string;
  position: { x: number; y: number; z: number };
  size: { width: number; height: number; depth: number };
  baseTemperature: number;
}

export interface BuildingTemperature {
  id: string;
  temperature: number;
}

interface BuildingMeshData {
  mesh: THREE.Mesh;
  data: BuildingData;
  currentTemperature: number;
  targetTemperature: number;
  originalY: number;
  halo: THREE.Sprite | null;
  isHighlighted: boolean;
}

type FilterLevel = 'all' | HeatLevel;

export function getHeatLevel(temperature: number): HeatLevel {
  if (temperature < 25) return 'low';
  if (temperature <= 32) return 'medium';
  return 'high';
}

export function temperatureToColor(temperature: number): THREE.Color {
  const t = Math.max(15, Math.min(45, temperature));
  const color = new THREE.Color();
  if (t <= 20) {
    const f = (t - 15) / 5;
    color.setRGB(0, 0.1 * f, 0.4 + 0.2 * f);
  } else if (t <= 27) {
    const f = (t - 20) / 7;
    color.setRGB(0, 0.4 + 0.5 * f, 0.85 - 0.2 * f);
  } else if (t <= 31) {
    const f = (t - 27) / 4;
    color.setRGB(0.8 * f, 0.9 - 0.1 * f, 0.65 - 0.35 * f);
  } else if (t <= 37) {
    const f = (t - 31) / 6;
    color.setRGB(0.8 + 0.2 * f, 0.55 - 0.45 * f, 0.15 * (1 - f));
  } else {
    const f = Math.min(1, (t - 37) / 8);
    color.setRGB(0.8 + 0.2 * f, 0, 0);
  }
  return color;
}

export class BuildingModule implements BuildingModuleType {
  private scene: THREE.Scene;
  private buildingMap: Map<string, BuildingMeshData> = new Map();
  private buildingsGroup: THREE.Group;
  private groundGroup: THREE.Group;
  private filterLevel: FilterLevel = 'all';
  private colorTransitionProgress: Map<string, number> = new Map();
  private onBuildingClick?: (building: BuildingData, temperature: number) => void;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private camera: THREE.PerspectiveCamera;
  private selectedBuildingId: string | null = null;

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
    this.scene = scene;
    this.camera = camera;
    this.buildingsGroup = new THREE.Group();
    this.groundGroup = new THREE.Group();
    this.scene.add(this.buildingsGroup);
    this.scene.add(this.groundGroup);
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.createGround();
  }

  private createGround(): void {
    const groundGeo = new THREE.PlaneGeometry(120, 120);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x1e1e38,
      roughness: 0.9,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    this.groundGroup.add(ground);

    const gridHelper = new THREE.GridHelper(120, 30, 0x2a2a50, 0x222240);
    gridHelper.position.y = 0.01;
    this.groundGroup.add(gridHelper);

    for (let i = -3; i <= 3; i += 3) {
      const road1 = new THREE.Mesh(
        new THREE.PlaneGeometry(120, 3),
        new THREE.MeshStandardMaterial({ color: 0x2a2a3a, roughness: 0.95 })
      );
      road1.rotation.x = -Math.PI / 2;
      road1.position.set(0, 0.02, i * 10);
      this.groundGroup.add(road1);

      const road2 = new THREE.Mesh(
        new THREE.PlaneGeometry(3, 120),
        new THREE.MeshStandardMaterial({ color: 0x2a2a3a, roughness: 0.95 })
      );
      road2.rotation.x = -Math.PI / 2;
      road2.position.set(i * 10, 0.02, 0);
      this.groundGroup.add(road2);
    }

    const greenPositions = [
      [-35, -35], [35, -35], [-35, 35], [35, 35], [0, 0],
    ];
    for (const [gx, gz] of greenPositions) {
      const green = new THREE.Mesh(
        new THREE.PlaneGeometry(10, 10),
        new THREE.MeshStandardMaterial({ color: 0x2d5a3d, roughness: 1 })
      );
      green.rotation.x = -Math.PI / 2;
      green.position.set(gx, 0.03, gz);
      this.groundGroup.add(green);
    }
  }

  public loadBuildings(buildings: BuildingData[]): void {
    for (const data of buildings) {
      const geometry = new THREE.BoxGeometry(data.size.width, data.size.height, data.size.depth);
      const initColor = temperatureToColor(data.baseTemperature);
      const material = new THREE.MeshStandardMaterial({
        color: initColor,
        roughness: 0.7,
        metalness: 0.2,
        transparent: true,
        opacity: 1,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(data.position.x, data.position.y, data.position.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.buildingId = data.id;

      this.buildingsGroup.add(mesh);
      this.buildingMap.set(data.id, {
        mesh,
        data,
        currentTemperature: data.baseTemperature,
        targetTemperature: data.baseTemperature,
        originalY: data.position.y,
        halo: null,
        isHighlighted: false,
      });
      this.colorTransitionProgress.set(data.id, 1);
    }
  }

  public updateTemperatures(temps: BuildingTemperature[]): void {
    for (const { id, temperature } of temps) {
      const b = this.buildingMap.get(id);
      if (b) {
        b.targetTemperature = temperature;
        this.colorTransitionProgress.set(id, 0);
      }
    }
  }

  public updateAnimations(deltaTime: number): void {
    const colorSpeed = deltaTime / 0.8;

    for (const [id, b] of this.buildingMap) {
      const progress = this.colorTransitionProgress.get(id) || 1;
      if (progress < 1) {
        const newProgress = Math.min(1, progress + colorSpeed);
        this.colorTransitionProgress.set(id, newProgress);
        const t = b.currentTemperature + (b.targetTemperature - b.currentTemperature) * (newProgress - progress) / (1 - progress > 0 ? (1 - progress) : 1);
        b.currentTemperature = b.currentTemperature + (b.targetTemperature - b.currentTemperature) * colorSpeed;
        const color = temperatureToColor(b.currentTemperature);
        const mat = b.mesh.material as THREE.MeshStandardMaterial;
        mat.color.copy(color);
      }

      if (b.isHighlighted && b.halo) {
        const phase = (Date.now() / 1000) % 2 / 2;
        const alpha = 0.3 + 0.5 * Math.sin(phase * Math.PI * 2);
        (b.halo.material as THREE.SpriteMaterial).opacity = alpha;
      }
    }
  }

  public handleClick(clientX: number, clientY: number, containerRect: DOMRect): void {
    this.mouse.x = ((clientX - containerRect.left) / containerRect.width) * 2 - 1;
    this.mouse.y = -((clientY - containerRect.top) / containerRect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.buildingsGroup.children, false);

    if (intersects.length > 0) {
      const buildingId = intersects[0].object.userData.buildingId as string;
      this.selectBuilding(buildingId);
    }
  }

  private selectBuilding(id: string): void {
    if (this.selectedBuildingId === id) return;

    if (this.selectedBuildingId) {
      this.clearHighlight(this.selectedBuildingId);
    }

    this.selectedBuildingId = id;
    const b = this.buildingMap.get(id);
    if (!b) return;

    b.isHighlighted = true;
    b.mesh.position.y = b.originalY + 0.1;

    const haloCanvas = document.createElement('canvas');
    haloCanvas.width = 128;
    haloCanvas.height = 128;
    const ctx = haloCanvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(64, 64, 20, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(0, 180, 216, 0.9)');
    gradient.addColorStop(0.5, 'rgba(0, 212, 255, 0.4)');
    gradient.addColorStop(1, 'rgba(0, 212, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);

    const haloTex = new THREE.CanvasTexture(haloCanvas);
    const haloMat = new THREE.SpriteMaterial({
      map: haloTex,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });
    const halo = new THREE.Sprite(haloMat);
    const maxSize = Math.max(b.data.size.width, b.data.size.depth);
    halo.scale.set(maxSize * 3, maxSize * 3, 1);
    halo.position.set(b.data.position.x, 0.05, b.data.position.z);
    this.scene.add(halo);
    b.halo = halo;

    this.onBuildingClick?.(b.data, b.currentTemperature);
  }

  private clearHighlight(id: string): void {
    const b = this.buildingMap.get(id);
    if (!b) return;
    b.isHighlighted = false;
    b.mesh.position.y = b.originalY;
    if (b.halo) {
      this.scene.remove(b.halo);
      b.halo.material.dispose();
      (b.halo.material as THREE.SpriteMaterial).map?.dispose();
      b.halo = null;
    }
  }

  public setClickHandler(handler: (building: BuildingData, temperature: number) => void): void {
    this.onBuildingClick = handler;
  }

  public applyFilter(level: FilterLevel): void {
    this.filterLevel = level;
    for (const b of this.buildingMap.values()) {
      const mat = b.mesh.material as THREE.MeshStandardMaterial;
      const heatLevel = getHeatLevel(b.currentTemperature);
      const shouldDim = level !== 'all' && heatLevel !== level && !b.isHighlighted;

      if (shouldDim) {
        mat.color.setHex(0x666666);
        mat.opacity = 0.3;
        mat.transparent = true;
      } else {
        const color = temperatureToColor(b.currentTemperature);
        mat.color.copy(color);
        mat.opacity = b.isHighlighted ? 1 : 1;
        mat.transparent = b.isHighlighted ? false : false;
      }
    }
  }

  public getBuildingData(id: string): BuildingData | null {
    return this.buildingMap.get(id)?.data || null;
  }

  public getBuildingTemperature(id: string): number {
    return this.buildingMap.get(id)?.currentTemperature || 0;
  }

  public getSelectedBuildingId(): string | null {
    return this.selectedBuildingId;
  }
}
