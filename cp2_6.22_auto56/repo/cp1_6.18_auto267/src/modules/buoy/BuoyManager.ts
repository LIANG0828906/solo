import * as THREE from 'three';
import type { Buoy, TemperaturePoint } from '../../shared/store';

interface BuoyMeshData {
  buoy: Buoy;
  group: THREE.Group;
  sphere: THREE.Mesh;
  line: THREE.Line;
  glow: THREE.Mesh;
}

export class BuoyManager {
  private scene: THREE.Scene;
  private buoyMeshes: Map<string, BuoyMeshData>;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;
  private draggingId: string | null;
  private dragPlane: THREE.Plane;
  private offset: THREE.Vector3;
  private onBuoyClick: ((id: string) => void) | null;
  private onBuoyMoved: ((id: string, position: { x: number; y: number; z: number }) => void) | null;
  private onBuoyRemoved: ((id: string) => void) | null;

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.scene = scene;
    this.camera = camera;
    this.domElement = domElement;
    this.buoyMeshes = new Map();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.draggingId = null;
    this.dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.offset = new THREE.Vector3();
    this.onBuoyClick = null;
    this.onBuoyMoved = null;
    this.onBuoyRemoved = null;

    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.domElement.addEventListener('mousedown', this.onMouseDown);
    this.domElement.addEventListener('mousemove', this.onMouseMove);
    this.domElement.addEventListener('mouseup', this.onMouseUp);
    this.domElement.addEventListener('dblclick', this.onDoubleClick);
  }

  private onMouseDown = (e: MouseEvent) => {
    if (e.button !== 0) return;

    const rect = this.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const buoyMeshes = Array.from(this.buoyMeshes.values()).map((b) => b.sphere);
    const intersects = this.raycaster.intersectObjects(buoyMeshes);

    if (intersects.length > 0) {
      const clickedMesh = intersects[0].object;
      for (const [id, data] of this.buoyMeshes) {
        if (data.sphere === clickedMesh) {
          this.draggingId = id;
          this.onBuoyClick?.(id);

          const intersectionPoint = new THREE.Vector3();
          this.raycaster.ray.intersectPlane(this.dragPlane, intersectionPoint);
          this.offset.copy(intersectionPoint).sub(data.group.position);
          break;
        }
      }
    }
  };

  private onMouseMove = (e: MouseEvent) => {
    if (!this.draggingId) return;

    const rect = this.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersectionPoint = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(this.dragPlane, intersectionPoint);

    const buoyData = this.buoyMeshes.get(this.draggingId);
    if (buoyData) {
      const newPos = intersectionPoint.sub(this.offset);
      newPos.x = Math.max(-95, Math.min(95, newPos.x));
      newPos.z = Math.max(-95, Math.min(95, newPos.z));
      newPos.y = 0;
      buoyData.group.position.copy(newPos);
    }
  };

  private onMouseUp = () => {
    if (this.draggingId) {
      const buoyData = this.buoyMeshes.get(this.draggingId);
      if (buoyData) {
        this.onBuoyMoved?.(this.draggingId, {
          x: buoyData.group.position.x,
          y: buoyData.group.position.y,
          z: buoyData.group.position.z
        });
      }
      this.draggingId = null;
    }
  };

  private onDoubleClick = (e: MouseEvent) => {
    const rect = this.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const buoyMeshes = Array.from(this.buoyMeshes.values()).map((b) => b.sphere);
    const intersects = this.raycaster.intersectObjects(buoyMeshes);

    if (intersects.length > 0) {
      const clickedMesh = intersects[0].object;
      for (const [id, data] of this.buoyMeshes) {
        if (data.sphere === clickedMesh) {
          this.removeBuoy(id);
          this.onBuoyRemoved?.(id);
          break;
        }
      }
    }
  };

  addBuoy(buoy: Buoy) {
    if (this.buoyMeshes.size >= 5) return;

    const group = new THREE.Group();

    const sphereGeometry = new THREE.SphereGeometry(2, 32, 32);
    const sphereMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFB703,
      emissive: 0xFFD166,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.7,
      roughness: 0.3,
      metalness: 0.1
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    group.add(sphere);

    const glowGeometry = new THREE.SphereGeometry(2.5, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFD166,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    group.add(glow);

    const linePoints = [
      new THREE.Vector3(0, 2, 0),
      new THREE.Vector3(0, 22, 0)
    ];
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xFFB703,
      transparent: true,
      opacity: 0.4
    });
    const line = new THREE.Line(lineGeometry, lineMaterial);
    group.add(line);

    group.position.set(buoy.position.x, buoy.position.y, buoy.position.z);
    this.scene.add(group);

    this.buoyMeshes.set(buoy.id, {
      buoy,
      group,
      sphere,
      line,
      glow
    });
  }

  removeBuoy(id: string) {
    const data = this.buoyMeshes.get(id);
    if (data) {
      this.scene.remove(data.group);
      data.sphere.geometry.dispose();
      (data.sphere.material as THREE.Material).dispose();
      data.line.geometry.dispose();
      (data.line.material as THREE.Material).dispose();
      data.glow.geometry.dispose();
      (data.glow.material as THREE.Material).dispose();
      this.buoyMeshes.delete(id);
    }
  }

  selectBuoy(id: string | null) {
    for (const [buoyId, data] of this.buoyMeshes) {
      const material = data.sphere.material as THREE.MeshStandardMaterial;
      if (buoyId === id) {
        material.emissiveIntensity = 1.2;
        material.opacity = 0.9;
        data.group.scale.setScalar(1.1);
      } else {
        material.emissiveIntensity = 0.6;
        material.opacity = 0.7;
        data.group.scale.setScalar(1);
      }
    }
  }

  setOnBuoyClick(callback: (id: string) => void) {
    this.onBuoyClick = callback;
  }

  setOnBuoyMoved(callback: (id: string, position: { x: number; y: number; z: number }) => void) {
    this.onBuoyMoved = callback;
  }

  setOnBuoyRemoved(callback: (id: string) => void) {
    this.onBuoyRemoved = callback;
  }

  static async fetchTemperature(buoyId: string, x: number, z: number): Promise<TemperaturePoint[]> {
    try {
      const response = await fetch(`/api/temperature?buoyId=${encodeURIComponent(buoyId)}&x=${x}&z=${z}`);
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Failed to fetch temperature:', error);
      return [];
    }
  }

  dispose() {
    this.domElement.removeEventListener('mousedown', this.onMouseDown);
    this.domElement.removeEventListener('mousemove', this.onMouseMove);
    this.domElement.removeEventListener('mouseup', this.onMouseUp);
    this.domElement.removeEventListener('dblclick', this.onDoubleClick);

    for (const id of Array.from(this.buoyMeshes.keys())) {
      this.removeBuoy(id);
    }
  }
}
