import * as THREE from 'three';
import { ColorTheme, getWindowEmissiveIntensity } from '../utils/colorTheme';
import { SceneManager } from './sceneManager';

export interface BuildingParams {
  density: number;
  minHeight: number;
  maxHeight: number;
  minBase: number;
  maxBase: number;
}

interface BuildingData {
  position: THREE.Vector3;
  size: THREE.Vector3;
  seed: number;
}

export class BuildingGenerator {
  private sceneManager: SceneManager;
  private buildingMesh: THREE.InstancedMesh | null = null;
  private windowMesh: THREE.InstancedMesh | null = null;
  private accentMesh: THREE.InstancedMesh | null = null;
  private buildingGeo: THREE.BoxGeometry;
  private windowGeo: THREE.PlaneGeometry;
  private accentGeo: THREE.BoxGeometry;
  private buildingMaterial: THREE.MeshStandardMaterial;
  private windowMaterial: THREE.MeshStandardMaterial;
  private accentMaterial: THREE.MeshStandardMaterial;
  private buildings: BuildingData[] = [];
  private _currentTheme: ColorTheme;
  private _currentHour: number = 17;

  private static readonly MAX_BUILDINGS = 200;
  private static readonly GRID_SIZE = 220;
  private static readonly GRID_CELL = 22;

  constructor(sceneManager: SceneManager, defaultTheme: ColorTheme) {
    this.sceneManager = sceneManager;
    this._currentTheme = defaultTheme;

    this.buildingGeo = new THREE.BoxGeometry(1, 1, 1);
    this.buildingGeo.translate(0, 0.5, 0);

    this.windowGeo = new THREE.PlaneGeometry(0.7, 0.5);

    this.accentGeo = new THREE.BoxGeometry(1, 0.4, 1);
    this.accentGeo.translate(0, 0.2, 0);

    this.buildingMaterial = new THREE.MeshStandardMaterial({
      color: defaultTheme.building,
      roughness: 0.75,
      metalness: 0.15
    });

    this.windowMaterial = new THREE.MeshStandardMaterial({
      color: 0x111111,
      emissive: defaultTheme.windows,
      emissiveIntensity: getWindowEmissiveIntensity(this._currentHour),
      roughness: 0.2,
      metalness: 0.5
    });

    this.accentMaterial = new THREE.MeshStandardMaterial({
      color: defaultTheme.accent,
      roughness: 0.4,
      metalness: 0.6,
      emissive: defaultTheme.accent,
      emissiveIntensity: 0.15
    });
  }

  get currentTheme(): ColorTheme {
    return this._currentTheme;
  }

  private seededRandom(seed: number): () => number {
    let s = seed;
    return () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  private generateLayout(params: BuildingParams): BuildingData[] {
    const result: BuildingData[] = [];
    const rand = this.seededRandom(42 + Math.floor(params.density * 1000 + params.minHeight * 10 + params.maxHeight));

    const cellSize = BuildingGenerator.GRID_CELL;
    const half = BuildingGenerator.GRID_SIZE / 2;
    const cellsPerSide = Math.floor(BuildingGenerator.GRID_SIZE / cellSize);

    const occupied = new Set<string>();
    const count = Math.min(params.density, BuildingGenerator.MAX_BUILDINGS);

    let attempts = 0;
    const maxAttempts = count * 30;

    while (result.length < count && attempts < maxAttempts) {
      attempts++;

      const cx = Math.floor(rand() * cellsPerSide);
      const cz = Math.floor(rand() * cellsPerSide);
      const key = `${cx},${cz}`;

      if (occupied.has(key)) continue;

      const distFromCenter = Math.sqrt(
        Math.pow((cx - cellsPerSide / 2) / (cellsPerSide / 2), 2) +
        Math.pow((cz - cellsPerSide / 2) / (cellsPerSide / 2), 2)
      );

      if (distFromCenter > 0.95) continue;

      const baseW = params.minBase + rand() * (params.maxBase - params.minBase);
      const baseD = params.minBase + rand() * (params.maxBase - params.minBase);

      const centerBias = Math.max(0, 1 - distFromCenter * 0.9);
      const heightRand = rand();
      const taperedHeight = heightRand * heightRand;
      const height = params.minHeight + (params.maxHeight - params.minHeight) * (centerBias * 0.6 + taperedHeight * 0.4);

      const worldX = (cx - cellsPerSide / 2 + 0.5) * cellSize + (rand() - 0.5) * cellSize * 0.2;
      const worldZ = (cz - cellsPerSide / 2 + 0.5) * cellSize + (rand() - 0.5) * cellSize * 0.2;

      if (Math.abs(worldX) > half - baseW / 2 || Math.abs(worldZ) > half - baseD / 2) continue;

      occupied.add(key);
      result.push({
        position: new THREE.Vector3(worldX, 0, worldZ),
        size: new THREE.Vector3(baseW, height, baseD),
        seed: Math.floor(rand() * 100000)
      });
    }

    return result;
  }

  public generate(params: BuildingParams): void {
    this.clear();
    this.buildings = this.generateLayout(params);

    if (this.buildings.length === 0) return;

    const dummy = new THREE.Object3D();
    const count = this.buildings.length;

    this.buildingMesh = new THREE.InstancedMesh(this.buildingGeo, this.buildingMaterial, count);
    this.buildingMesh.castShadow = true;
    this.buildingMesh.receiveShadow = true;
    this.buildingMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    let windowCount = 0;
    const windowPerBuilding: number[] = [];
    this.buildings.forEach((b) => {
      const floors = Math.max(2, Math.floor(b.size.y / 4));
      const perSide = Math.max(1, Math.floor(b.size.x / 4));
      const perDepth = Math.max(1, Math.floor(b.size.z / 4));
      const windows = (perSide * 2 + perDepth * 2) * floors;
      windowPerBuilding.push(windows);
      windowCount += windows;
    });

    this.windowMesh = new THREE.InstancedMesh(this.windowGeo, this.windowMaterial, windowCount);
    this.windowMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    const accentCount = Math.min(count, Math.floor(count * 0.4));
    this.accentMesh = new THREE.InstancedMesh(this.accentGeo, this.accentMaterial, accentCount);
    this.accentMesh.castShadow = true;
    this.accentMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    let windowIdx = 0;
    let accentIdx = 0;

    this.buildings.forEach((b, i) => {
      dummy.position.copy(b.position);
      dummy.scale.copy(b.size);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      this.buildingMesh!.setMatrixAt(i, dummy.matrix);

      const hasAccent = i < accentCount;
      if (hasAccent) {
        dummy.position.set(b.position.x, b.position.y + b.size.y - 0.2, b.position.z);
        dummy.scale.set(b.size.x * 0.7, 1, b.size.z * 0.7);
        dummy.updateMatrix();
        this.accentMesh!.setMatrixAt(accentIdx++, dummy.matrix);
      }

      const rand = this.seededRandom(b.seed);
      const floors = Math.max(2, Math.floor(b.size.y / 4));
      const perSide = Math.max(1, Math.floor(b.size.x / 4));
      const perDepth = Math.max(1, Math.floor(b.size.z / 4));
      const floorHeight = b.size.y / floors;

      for (let f = 0; f < floors; f++) {
        const y = f * floorHeight + floorHeight * 0.55;

        for (let w = 0; w < perSide; w++) {
          const x = -b.size.x / 2 + (w + 0.5) * (b.size.x / perSide);
          if (rand() > 0.35) {
            dummy.position.set(b.position.x + x, b.position.y + y, b.position.z + b.size.z / 2 + 0.01);
            dummy.scale.set(b.size.x / perSide * 0.65, floorHeight * 0.55, 1);
            dummy.rotation.set(0, 0, 0);
            dummy.updateMatrix();
            this.windowMesh!.setMatrixAt(windowIdx++, dummy.matrix);
          }
          if (rand() > 0.35) {
            dummy.position.set(b.position.x + x, b.position.y + y, b.position.z - b.size.z / 2 - 0.01);
            dummy.scale.set(b.size.x / perSide * 0.65, floorHeight * 0.55, 1);
            dummy.rotation.set(0, Math.PI, 0);
            dummy.updateMatrix();
            this.windowMesh!.setMatrixAt(windowIdx++, dummy.matrix);
          }
        }

        for (let w = 0; w < perDepth; w++) {
          const z = -b.size.z / 2 + (w + 0.5) * (b.size.z / perDepth);
          if (rand() > 0.35) {
            dummy.position.set(b.position.x + b.size.x / 2 + 0.01, b.position.y + y, b.position.z + z);
            dummy.scale.set(b.size.z / perDepth * 0.65, floorHeight * 0.55, 1);
            dummy.rotation.set(0, Math.PI / 2, 0);
            dummy.updateMatrix();
            this.windowMesh!.setMatrixAt(windowIdx++, dummy.matrix);
          }
          if (rand() > 0.35) {
            dummy.position.set(b.position.x - b.size.x / 2 - 0.01, b.position.y + y, b.position.z + z);
            dummy.scale.set(b.size.z / perDepth * 0.65, floorHeight * 0.55, 1);
            dummy.rotation.set(0, -Math.PI / 2, 0);
            dummy.updateMatrix();
            this.windowMesh!.setMatrixAt(windowIdx++, dummy.matrix);
          }
        }
      }
    });

    if (windowCount > 0 && windowIdx < windowCount) {
      const emptyMatrix = new THREE.Matrix4().makeScale(0, 0, 0);
      for (let i = windowIdx; i < windowCount; i++) {
        this.windowMesh.setMatrixAt(i, emptyMatrix);
      }
    }
    if (accentCount > 0 && accentIdx < accentCount) {
      const emptyMatrix = new THREE.Matrix4().makeScale(0, 0, 0);
      for (let i = accentIdx; i < accentCount; i++) {
        this.accentMesh.setMatrixAt(i, emptyMatrix);
      }
    }

    this.buildingMesh.instanceMatrix.needsUpdate = true;
    this.windowMesh.instanceMatrix.needsUpdate = true;
    this.accentMesh.instanceMatrix.needsUpdate = true;

    this.sceneManager.addObject(this.buildingMesh);
    this.sceneManager.addObject(this.windowMesh);
    this.sceneManager.addObject(this.accentMesh);
  }

  public rebuild(params: BuildingParams): void {
    this.generate(params);
  }

  public updateTheme(theme: ColorTheme): void {
    this._currentTheme = theme;
    this.buildingMaterial.color.setHex(theme.building);
    this.windowMaterial.emissive.setHex(theme.windows);
    this.accentMaterial.color.setHex(theme.accent);
    this.accentMaterial.emissive.setHex(theme.accent);
    this.sceneManager.setGroundColor(theme.ground);
  }

  public updateHour(hour: number): void {
    this._currentHour = hour;
    this.windowMaterial.emissiveIntensity = getWindowEmissiveIntensity(hour);
  }

  public clear(): void {
    if (this.buildingMesh) {
      this.sceneManager.removeObject(this.buildingMesh);
      this.buildingMesh = null;
    }
    if (this.windowMesh) {
      this.sceneManager.removeObject(this.windowMesh);
      this.windowMesh = null;
    }
    if (this.accentMesh) {
      this.sceneManager.removeObject(this.accentMesh);
      this.accentMesh = null;
    }
    this.buildings = [];
  }

  public dispose(): void {
    this.clear();
    this.buildingGeo.dispose();
    this.windowGeo.dispose();
    this.accentGeo.dispose();
    this.buildingMaterial.dispose();
    this.windowMaterial.dispose();
    this.accentMaterial.dispose();
  }
}
