import * as THREE from 'three';
import { BuildingData, updateHighlight } from './cityGenerator';

export interface CameraState {
  azimuth: number;
  polar: number;
  distance: number;
  target: THREE.Vector3;
}

const MIN_DISTANCE = 20;
const MAX_DISTANCE = 200;
const MIN_POLAR = 0.15;
const MAX_POLAR = Math.PI / 2 - 0.1;
const ROTATION_SPEED = 0.005;
const ZOOM_SPEED = 0.1;

export class InteractionManager {
  private camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;
  private cameraState: CameraState;
  private isDragging: boolean = false;
  private lastMouseX: number = 0;
  private lastMouseY: number = 0;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private cityGroup: THREE.Group | null = null;
  private buildings: BuildingData[] = [];
  private highlightedBuilding: BuildingData | null = null;
  private highlightStartTime: number | null = null;
  private onBuildingSelected: ((building: BuildingData | null) => void) | null = null;

  constructor(
    camera: THREE.PerspectiveCamera,
    domElement: HTMLElement
  ) {
    this.camera = camera;
    this.domElement = domElement;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.cameraState = {
      azimuth: Math.PI / 4,
      polar: Math.PI / 3,
      distance: 120,
      target: new THREE.Vector3(0, 20, 0)
    };

    this.setupEventListeners();
    this.updateCameraPosition();
  }

  setCityData(cityGroup: THREE.Group, buildings: BuildingData[]): void {
    this.cityGroup = cityGroup;
    this.buildings = buildings;
  }

  setBuildingSelectedCallback(callback: (building: BuildingData | null) => void): void {
    this.onBuildingSelected = callback;
  }

  private setupEventListeners(): void {
    this.domElement.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.domElement.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.domElement.addEventListener('mouseleave', this.onMouseUp.bind(this));
    this.domElement.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
    this.domElement.addEventListener('dblclick', this.onDoubleClick.bind(this));
  }

  private onMouseDown(event: MouseEvent): void {
    this.isDragging = true;
    this.lastMouseX = event.clientX;
    this.lastMouseY = event.clientY;
    this.domElement.style.cursor = 'grabbing';
  }

  private onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return;

    const deltaX = event.clientX - this.lastMouseX;
    const deltaY = event.clientY - this.lastMouseY;

    this.cameraState.azimuth -= deltaX * ROTATION_SPEED;
    this.cameraState.polar -= deltaY * ROTATION_SPEED;

    this.cameraState.polar = Math.max(MIN_POLAR, Math.min(MAX_POLAR, this.cameraState.polar));

    this.lastMouseX = event.clientX;
    this.lastMouseY = event.clientY;

    this.updateCameraPosition();
  }

  private onMouseUp(): void {
    this.isDragging = false;
    this.domElement.style.cursor = 'grab';
  }

  private onWheel(event: WheelEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const zoomFactor = 1 + (event.deltaY > 0 ? ZOOM_SPEED : -ZOOM_SPEED);
    this.cameraState.distance *= zoomFactor;
    this.cameraState.distance = Math.max(MIN_DISTANCE, Math.min(MAX_DISTANCE, this.cameraState.distance));

    this.updateCameraPosition();
  }

  private onDoubleClick(event: MouseEvent): void {
    if (!this.cityGroup || this.buildings.length === 0) return;

    const rect = this.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const buildingMeshes = this.buildings.map(b => b.mesh);
    const antennaMeshes = this.buildings
      .filter(b => b.antenna !== null)
      .map(b => b.antenna!);

    const allMeshes = [...buildingMeshes, ...antennaMeshes];
    const intersects = this.raycaster.intersectObjects(allMeshes, false);

    if (intersects.length > 0) {
      const hitObject = intersects[0].object;
      let buildingIndex: number = -1;

      if (hitObject.userData.type === 'building') {
        buildingIndex = hitObject.userData.index;
      } else if (hitObject.userData.type === 'antenna') {
        buildingIndex = hitObject.userData.buildingIndex;
      }

      if (buildingIndex >= 0 && buildingIndex < this.buildings.length) {
        const building = this.buildings[buildingIndex];
        this.highlightedBuilding = building;
        this.highlightStartTime = performance.now();

        if (this.onBuildingSelected) {
          this.onBuildingSelected(building);
        }
      }
    }
  }

  private updateCameraPosition(): void {
    const { azimuth, polar, distance, target } = this.cameraState;

    const x = target.x + distance * Math.sin(polar) * Math.cos(azimuth);
    const y = target.y + distance * Math.cos(polar);
    const z = target.z + distance * Math.sin(polar) * Math.sin(azimuth);

    this.camera.position.set(x, y, z);
    this.camera.lookAt(target);
  }

  update(currentTime: number): void {
    if (this.highlightedBuilding && this.highlightStartTime !== null) {
      const elapsed = currentTime - this.highlightStartTime;

      for (const building of this.buildings) {
        if (building === this.highlightedBuilding) {
          updateHighlight(building, currentTime, this.highlightStartTime);
        } else {
          updateHighlight(building, currentTime, null);
        }
      }

      if (elapsed >= 2000) {
        this.highlightedBuilding = null;
        this.highlightStartTime = null;

        for (const building of this.buildings) {
          if (building.highlightMesh) {
            (building.highlightMesh.material as THREE.LineBasicMaterial).opacity = 0;
          }
        }
      }
    } else {
      for (const building of this.buildings) {
        if (building.highlightMesh) {
          const mat = building.highlightMesh.material as THREE.LineBasicMaterial;
          if (mat.opacity > 0) {
            mat.opacity = Math.max(0, mat.opacity - 0.05);
          }
        }
      }
    }
  }

  getCameraState(): CameraState {
    return { ...this.cameraState };
  }
}
