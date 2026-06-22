import * as THREE from 'three';
import { BuildingData, SunPosition } from '../../types';
import { createBuildingMeshes } from './buildings';
import { createAllShadowMeshes, updateAllShadowMeshes } from './shadows';
import { evaluateSolarPotential } from '../solar';

class SceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private sunLight: THREE.DirectionalLight;
  private sunMesh: THREE.Mesh;
  private ambientLight: THREE.AmbientLight;
  private buildingGroups: Map<string, THREE.Group> = new Map();
  private shadowMeshes: Map<string, THREE.Mesh> = new Map();
  private buildingDatas: BuildingData[] = [];
  private sunPosition: SunPosition;
  private animationFrameId: number | null = null;
  private ground: THREE.Mesh;
  private gridHelper: THREE.GridHelper;
  private raycaster: THREE.Raycaster;
  private pointer: THREE.Vector2;
  private onBuildingClick: ((buildingId: string | null) => void) | null = null;
  private solarAnalysisMesh: THREE.Group | null = null;
  private heatmapMesh: THREE.Mesh | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1d23);
    this.scene.fog = new THREE.Fog(0x1a1d23, 200, 500);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(120, 100, 120);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    this.ambientLight = new THREE.AmbientLight(0x404050, 0.4);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xffffff, 1);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 4096;
    this.sunLight.shadow.mapSize.height = 4096;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 500;
    this.sunLight.shadow.camera.left = -150;
    this.sunLight.shadow.camera.right = 150;
    this.sunLight.shadow.camera.top = 150;
    this.sunLight.shadow.camera.bottom = -150;
    this.sunLight.shadow.bias = -0.0001;
    this.scene.add(this.sunLight);

    const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({
      color: 0xffdd88,
      transparent: true
    });
    this.sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
    this.scene.add(this.sunMesh);

    const groundGeometry = new THREE.PlaneGeometry(500, 500);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a3140,
      roughness: 0.9,
      metalness: 0.1
    });
    this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);

    this.gridHelper = new THREE.GridHelper(500, 100, 0x3a4150, 0x2a3140);
    this.gridHelper.position.y = 0.01;
    this.scene.add(this.gridHelper);

    this.sunPosition = {
      dayOfYear: 172,
      hour: 12,
      azimuth: 180,
      altitude: 60
    };

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    this.updateSunPosition(this.sunPosition);

    this.animate();
  }

  setBuildings(buildings: BuildingData[]) {
    this.buildingDatas = buildings;
    
    this.buildingGroups.forEach(group => {
      this.scene.remove(group);
    });
    this.buildingGroups.clear();

    this.shadowMeshes.forEach(mesh => {
      this.scene.remove(mesh);
    });
    this.shadowMeshes.clear();

    const groups = createBuildingMeshes(buildings);
    groups.forEach(group => {
      this.buildingGroups.set(group.userData.buildingId, group);
      this.scene.add(group);
    });

    this.shadowMeshes = createAllShadowMeshes(
      buildings,
      this.sunPosition.altitude,
      this.sunPosition.azimuth
    );
    this.shadowMeshes.forEach(mesh => {
      this.scene.add(mesh);
    });

    this.clearSolarAnalysis();
    this.clearHeatmap();
  }

  updateSunPosition(sunPosition: SunPosition) {
    this.sunPosition = sunPosition;

    const distance = 200;
    const azimuthRad = sunPosition.azimuth * Math.PI / 180;
    const altitudeRad = sunPosition.altitude * Math.PI / 180;

    const sunX = Math.sin(azimuthRad) * Math.cos(altitudeRad) * distance;
    const sunY = Math.sin(altitudeRad) * distance;
    const sunZ = Math.cos(azimuthRad) * Math.cos(altitudeRad) * distance;

    this.sunMesh.position.set(sunX, sunY, sunZ);
    this.sunLight.position.set(sunX, sunY, sunZ);
    this.sunLight.target.position.set(0, 0, 0);

    const brightness = Math.max(0.2, sunPosition.altitude / 90);
    this.sunLight.intensity = 0.5 + brightness * 0.8;
    this.sunMesh.material = new THREE.MeshBasicMaterial({
      color: new THREE.Color().setHSL(0.1, 0.8, 0.5 + brightness * 0.3),
      transparent: true
    });

    updateAllShadowMeshes(
      this.shadowMeshes,
      this.buildingDatas,
      sunPosition.altitude,
      sunPosition.azimuth
    );
  }

  selectBuilding(buildingId: string | null) {

    this.buildingGroups.forEach((group, id) => {
      const mesh = group.children[0] as THREE.Mesh;
      const edges = group.children[1] as THREE.LineSegments;

      if (id === buildingId) {
        mesh.material = new THREE.MeshStandardMaterial({
          color: (mesh.material as THREE.MeshStandardMaterial).color,
          roughness: 0.7,
          metalness: 0.1,
          emissive: 0xd4a853,
          emissiveIntensity: 0.3
        });
        edges.material = new THREE.LineBasicMaterial({
          color: 0xd4a853,
          transparent: true,
          opacity: 1
        });
        group.traverse((child) => {
          if (child instanceof THREE.Line && child !== edges) {
            child.material = new THREE.LineBasicMaterial({
              color: 0xd4a853,
              transparent: true,
              opacity: 0.8
            });
          }
        });
      } else {
        const building = this.buildingDatas.find(b => b.id === id);
        if (building) {
          mesh.material = new THREE.MeshStandardMaterial({
            color: building.color,
            roughness: 0.7,
            metalness: 0.1,
            transparent: true,
            opacity: buildingId ? 0.4 : 1
          });
          edges.material = new THREE.LineBasicMaterial({
            color: new THREE.Color(building.color).multiplyScalar(0.7),
            transparent: true,
            opacity: buildingId ? 0.3 : 0.6
          });
          group.traverse((child) => {
            if (child instanceof THREE.Line && child !== edges) {
              child.material = new THREE.LineBasicMaterial({
                color: new THREE.Color(building.color).multiplyScalar(0.8),
                transparent: true,
                opacity: buildingId ? 0.2 : 0.4
              });
            }
          });
        }
      }
    });
  }

  evaluateSolarPotential(buildingId: string) {
    const building = this.buildingDatas.find(b => b.id === buildingId);
    if (!building) return;

    this.clearSolarAnalysis();

    const result = evaluateSolarPotential(building, this.buildingDatas);

    this.solarAnalysisMesh = new THREE.Group();

    const gridSize = 10;
    const cellWidth = building.width / gridSize;
    const cellDepth = building.depth / gridSize;
    const maxHours = Math.max(...result.grids.map(g => g.totalSunlightHours));

    result.grids.forEach(grid => {
      const worldX = building.x - building.width / 2 + (grid.gridX + 0.5) * cellWidth;
      const worldZ = building.z - building.depth / 2 + (grid.gridZ + 0.5) * cellDepth;

      const height = (grid.totalSunlightHours / maxHours) * 30;

      const barGeometry = new THREE.BoxGeometry(cellWidth * 0.8, height, cellDepth * 0.8);
      const barMaterial = new THREE.MeshStandardMaterial({
        color: grid.color,
        transparent: true,
        opacity: 0.7,
        emissive: grid.color,
        emissiveIntensity: 0.2
      });
      const bar = new THREE.Mesh(barGeometry, barMaterial);
      bar.position.set(worldX, building.height + height / 2 + 0.5, worldZ);
      this.solarAnalysisMesh!.add(bar);

      const gridGeometry = new THREE.PlaneGeometry(cellWidth * 0.9, cellDepth * 0.9);
      const gridMaterial = new THREE.MeshStandardMaterial({
        color: grid.color,
        transparent: true,
        opacity: 0.9
      });
      const gridMesh = new THREE.Mesh(gridGeometry, gridMaterial);
      gridMesh.rotation.x = -Math.PI / 2;
      gridMesh.position.set(worldX, building.height + 0.05, worldZ);
      this.solarAnalysisMesh!.add(gridMesh);
    });

    this.scene.add(this.solarAnalysisMesh);

    return result;
  }

  clearSolarAnalysis() {
    if (this.solarAnalysisMesh) {
      this.scene.remove(this.solarAnalysisMesh);
      this.solarAnalysisMesh = null;
    }
  }

  showHeatmap(buildingId: string, dayOfYear: number) {
    const building = this.buildingDatas.find(b => b.id === buildingId);
    if (!building) return;

    this.clearHeatmap();

    const resolution = 64;
    const canvas = document.createElement('canvas');
    canvas.width = resolution;
    canvas.height = resolution;
    const ctx = canvas.getContext('2d')!;

    const imageData = ctx.createImageData(resolution, resolution);
    const data = imageData.data;

    const halfW = building.width / 2;
    const halfD = building.depth / 2;
    const hours = [8, 10, 12, 14, 16, 18];

    for (let y = 0; y < resolution; y++) {
      for (let x = 0; x < resolution; x++) {
        const worldX = building.x - halfW + (x / resolution) * building.width;
        const worldZ = building.z - halfD + (y / resolution) * building.depth;

        let shadowHours = 0;

        for (const hour of hours) {
          const sunPos = this.calculateSunPos(dayOfYear, hour);

          if (sunPos.altitude > 0) {
            for (const b of this.buildingDatas) {
              if (b.id === building.id) continue;

              const shadowPoly = this.calculateShadowPoly(b, sunPos.altitude, sunPos.azimuth);

              if (shadowPoly.length > 0 && this.pointInPolygon({ x: worldX, z: worldZ }, shadowPoly)) {
                shadowHours++;
                break;
              }
            }
          } else {
            shadowHours++;
          }
        }

        const ratio = shadowHours / hours.length;
        const idx = (y * resolution + x) * 4;

        const color = this.getHeatmapColor(ratio);

        data[idx] = color.r;
        data[idx + 1] = color.g;
        data[idx + 2] = color.b;
        data[idx + 3] = 180;
      }
    }

    ctx.putImageData(imageData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    const heatmapGeometry = new THREE.PlaneGeometry(building.width, building.depth);
    const heatmapMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.8
    });
    this.heatmapMesh = new THREE.Mesh(heatmapGeometry, heatmapMaterial);
    this.heatmapMesh.rotation.x = -Math.PI / 2;
    this.heatmapMesh.position.set(building.x, building.height + 0.1, building.z);
    this.scene.add(this.heatmapMesh);
  }

  clearHeatmap() {
    if (this.heatmapMesh) {
      this.scene.remove(this.heatmapMesh);
      this.heatmapMesh = null;
    }
  }

  private calculateSunPos(dayOfYear: number, hour: number): { altitude: number; azimuth: number } {
    const LATITUDE = 39.9;
    const declination = 23.45 * Math.sin((360 / 365) * (dayOfYear - 81) * Math.PI / 180);
    const hourAngle = (hour - 12) * 15 * Math.PI / 180;
    const latRad = LATITUDE * Math.PI / 180;

    const sinAltitude = Math.sin(latRad) * Math.sin(declination * Math.PI / 180) +
      Math.cos(latRad) * Math.cos(declination * Math.PI / 180) * Math.cos(hourAngle);
    const altitude = Math.asin(Math.max(-1, Math.min(1, sinAltitude))) * 180 / Math.PI;

    let azimuth = Math.acos(
      (Math.sin(declination * Math.PI / 180) * Math.cos(latRad) -
      Math.cos(declination * Math.PI / 180) * Math.sin(latRad) * Math.cos(hourAngle)) /
      Math.cos(altitude * Math.PI / 180)) * 180 / Math.PI;

    if (hourAngle > 0) {
      azimuth = 360 - azimuth;
    }

    return { altitude, azimuth };
  }

  private calculateShadowPoly(
    building: BuildingData,
    sunAltitude: number,
    sunAzimuth: number
  ): { x: number; z: number }[] {
    if (sunAltitude <= 0) return [];

    const shadowLength = building.height / Math.tan(sunAltitude * Math.PI / 180);
    const azimuthRad = sunAzimuth * Math.PI / 180;

    const dx = Math.sin(azimuthRad) * shadowLength;
    const dz = Math.cos(azimuthRad) * shadowLength;

    const halfW = building.width / 2;
    const halfD = building.depth / 2;

    const corners = [
      { x: building.x - halfW, z: building.z - halfD },
      { x: building.x + halfW, z: building.z - halfD },
      { x: building.x + halfW, z: building.z + halfD },
      { x: building.x - halfW, z: building.z + halfD },
    ];

    const shadowCorners = corners.map(c => ({
      x: c.x + dx,
      z: c.z + dz
    }));

    return [...corners, ...shadowCorners.reverse()];
  }

  private pointInPolygon(
    point: { x: number; z: number },
    polygon: { x: number; z: number }[]
  ): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, zi = polygon[i].z;
      const xj = polygon[j].x, zj = polygon[j].z;

      if (((zi > point.z) !== (zj > point.z)) &&
          (point.x < (xj - xi) * (point.z - zi) / (zj - zi) + xi)) {
        inside = !inside;
      }
    }
    return inside;
  }

  private getHeatmapColor(ratio: number): { r: number; g: number; b: number } {
    if (ratio < 0.25) {
      return { r: 0, g: Math.floor(ratio * 4 * 255), b: 255 };
    } else if (ratio < 0.5) {
      const t = (ratio - 0.25) * 4;
      return { r: 0, g: 255, b: Math.floor(255 * (1 - t)) };
    } else if (ratio < 0.75) {
      const t = (ratio - 0.5) * 4;
      return { r: Math.floor(t * 255), g: 255, b: 0 };
    } else {
      const t = (ratio - 0.75) * 4;
      return { r: 255, g: Math.floor(255 * (1 - t)), b: 0 };
    }
  }

  setOnBuildingClick(callback: (buildingId: string | null) => void) {
    this.onBuildingClick = callback;
  }

  handleClick(event: MouseEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);

    const meshes: THREE.Mesh[] = [];
    this.buildingGroups.forEach(group => {
      group.traverse(child => {
        if (child instanceof THREE.Mesh) {
          meshes.push(child);
        }
      });
    });

    const intersects = this.raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      const object = intersects[0].object;
      let buildingId: string | null = null;

      if (object.userData.buildingId) {
        buildingId = object.userData.buildingId;
      } else {
        let parent: THREE.Object3D | null = object.parent;
        while (parent) {
          if (parent.userData.buildingId) {
            buildingId = parent.userData.buildingId;
            break;
          }
          parent = parent.parent;
        }
      }

      if (this.onBuildingClick) {
        this.onBuildingClick(buildingId);
      }
    } else {
      if (this.onBuildingClick) {
        this.onBuildingClick(null);
      }
    }
  }

  handleResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private animate() {
    this.animationFrameId = requestAnimationFrame(() => this.animate());
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.renderer.dispose();
  }

  getScene() {
    return this.scene;
  }

  getCamera() {
    return this.camera;
  }

  getRenderer() {
    return this.renderer;
  }

  getBuildingDatas() {
    return this.buildingDatas;
  }
}

let sceneManagerInstance: SceneManager | null = null;

export const initScene = (canvas: HTMLCanvasElement): SceneManager => {
  if (!sceneManagerInstance) {
    sceneManagerInstance = new SceneManager(canvas);
  }
  return sceneManagerInstance;
};

export const getSceneManager = (): SceneManager | null => {
  return sceneManagerInstance;
};

export { SceneManager };
