import * as THREE from 'three';
import { ColorTheme, getWindowEmissiveIntensity, lerpColor } from '../utils/colorTheme';
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
  private windowGeo: THREE.BoxGeometry;
  private accentGeo: THREE.BoxGeometry;
  private buildingMaterial: THREE.MeshStandardMaterial;
  private windowMaterial: THREE.MeshStandardMaterial;
  private accentMaterial: THREE.MeshStandardMaterial;
  private windowColorArray: THREE.InstancedBufferAttribute | null = null;
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

    this.windowGeo = new THREE.BoxGeometry(1, 1, 0.15);
    this.windowGeo.translate(0, 0, 0);

    this.accentGeo = new THREE.BoxGeometry(1, 0.4, 1);
    this.accentGeo.translate(0, 0.2, 0);

    this.buildingMaterial = new THREE.MeshStandardMaterial({
      color: defaultTheme.building,
      roughness: 0.75,
      metalness: 0.15
    });

    this.windowMaterial = new THREE.MeshStandardMaterial({
      color: 0x111111,
      emissive: 0x000000,
      emissiveIntensity: 1.0,
      roughness: 0.3,
      metalness: 0.4,
      vertexColors: true
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
    const theme = this._currentTheme;
    const emissiveBase = theme.windows;
    const nightIntensity = getWindowEmissiveIntensity(this._currentHour);

    const darkerWindow = lerpColor(emissiveBase, 0x000000, 0.35);
    const brighterWindow = lerpColor(emissiveBase, 0xffffff, 0.25);

    this.buildingMesh = new THREE.InstancedMesh(this.buildingGeo, this.buildingMaterial, count);
    this.buildingMesh.castShadow = true;
    this.buildingMesh.receiveShadow = true;
    this.buildingMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    let windowCount = 0;
    this.buildings.forEach((b) => {
      const floors = Math.max(3, Math.floor(b.size.y / 3.5));
      const perSide = Math.max(2, Math.floor(b.size.x / 3.5));
      const perDepth = Math.max(2, Math.floor(b.size.z / 3.5));
      const windows = (perSide * 2 + perDepth * 2) * floors;
      windowCount += windows;
    });

    this.windowMesh = new THREE.InstancedMesh(this.windowGeo, this.windowMaterial, windowCount);
    this.windowMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    const colors = new Float32Array(windowCount * 3);
    const emissiveColors = new Float32Array(windowCount * 3);

    const accentCount = Math.min(count, Math.floor(count * 0.4));
    this.accentMesh = new THREE.InstancedMesh(this.accentGeo, this.accentMaterial, accentCount);
    this.accentMesh.castShadow = true;
    this.accentMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    let windowIdx = 0;
    let accentIdx = 0;
    const color = new THREE.Color();

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
      const floors = Math.max(3, Math.floor(b.size.y / 3.5));
      const perSide = Math.max(2, Math.floor(b.size.x / 3.5));
      const perDepth = Math.max(2, Math.floor(b.size.z / 3.5));
      const floorHeight = b.size.y / floors;

      for (let f = 0; f < floors; f++) {
        const y = f * floorHeight + floorHeight * 0.5;

        for (let w = 0; w < perSide; w++) {
          const x = -b.size.x / 2 + (w + 0.5) * (b.size.x / perSide);
          const windowW = b.size.x / perSide * 0.7;
          const windowH = floorHeight * 0.6;

          const lit = rand() > 0.3;
          const colorT = rand();
          const windowColor = lit ? lerpColor(darkerWindow, brighterWindow, colorT) : 0x0a0a15;

          dummy.position.set(b.position.x + x, b.position.y + y, b.position.z + b.size.z / 2 + 0.15);
          dummy.scale.set(windowW, windowH, 1);
          dummy.rotation.set(0, 0, 0);
          dummy.updateMatrix();
          this.windowMesh!.setMatrixAt(windowIdx, dummy.matrix);

          color.setHex(windowColor);
          colors[windowIdx * 3] = color.r;
          colors[windowIdx * 3 + 1] = color.g;
          colors[windowIdx * 3 + 2] = color.b;

          const emIntensity = lit ? nightIntensity : 0.05;
          emissiveColors[windowIdx * 3] = color.r * emIntensity;
          emissiveColors[windowIdx * 3 + 1] = color.g * emIntensity;
          emissiveColors[windowIdx * 3 + 2] = color.b * emIntensity;
          windowIdx++;

          const lit2 = rand() > 0.3;
          const colorT2 = rand();
          const windowColor2 = lit2 ? lerpColor(darkerWindow, brighterWindow, colorT2) : 0x0a0a15;

          dummy.position.set(b.position.x + x, b.position.y + y, b.position.z - b.size.z / 2 - 0.15);
          dummy.scale.set(windowW, windowH, 1);
          dummy.rotation.set(0, Math.PI, 0);
          dummy.updateMatrix();
          this.windowMesh!.setMatrixAt(windowIdx, dummy.matrix);

          color.setHex(windowColor2);
          colors[windowIdx * 3] = color.r;
          colors[windowIdx * 3 + 1] = color.g;
          colors[windowIdx * 3 + 2] = color.b;

          const emIntensity2 = lit2 ? nightIntensity : 0.05;
          emissiveColors[windowIdx * 3] = color.r * emIntensity2;
          emissiveColors[windowIdx * 3 + 1] = color.g * emIntensity2;
          emissiveColors[windowIdx * 3 + 2] = color.b * emIntensity2;
          windowIdx++;
        }

        for (let w = 0; w < perDepth; w++) {
          const z = -b.size.z / 2 + (w + 0.5) * (b.size.z / perDepth);
          const windowW = b.size.z / perDepth * 0.7;
          const windowH = floorHeight * 0.6;

          const lit = rand() > 0.3;
          const colorT = rand();
          const windowColor = lit ? lerpColor(darkerWindow, brighterWindow, colorT) : 0x0a0a15;

          dummy.position.set(b.position.x + b.size.x / 2 + 0.15, b.position.y + y, b.position.z + z);
          dummy.scale.set(windowW, windowH, 1);
          dummy.rotation.set(0, Math.PI / 2, 0);
          dummy.updateMatrix();
          this.windowMesh!.setMatrixAt(windowIdx, dummy.matrix);

          color.setHex(windowColor);
          colors[windowIdx * 3] = color.r;
          colors[windowIdx * 3 + 1] = color.g;
          colors[windowIdx * 3 + 2] = color.b;

          const emIntensity = lit ? nightIntensity : 0.05;
          emissiveColors[windowIdx * 3] = color.r * emIntensity;
          emissiveColors[windowIdx * 3 + 1] = color.g * emIntensity;
          emissiveColors[windowIdx * 3 + 2] = color.b * emIntensity;
          windowIdx++;

          const lit2 = rand() > 0.3;
          const colorT2 = rand();
          const windowColor2 = lit2 ? lerpColor(darkerWindow, brighterWindow, colorT2) : 0x0a0a15;

          dummy.position.set(b.position.x - b.size.x / 2 - 0.15, b.position.y + y, b.position.z + z);
          dummy.scale.set(windowW, windowH, 1);
          dummy.rotation.set(0, -Math.PI / 2, 0);
          dummy.updateMatrix();
          this.windowMesh!.setMatrixAt(windowIdx, dummy.matrix);

          color.setHex(windowColor2);
          colors[windowIdx * 3] = color.r;
          colors[windowIdx * 3 + 1] = color.g;
          colors[windowIdx * 3 + 2] = color.b;

          const emIntensity2 = lit2 ? nightIntensity : 0.05;
          emissiveColors[windowIdx * 3] = color.r * emIntensity2;
          emissiveColors[windowIdx * 3 + 1] = color.g * emIntensity2;
          emissiveColors[windowIdx * 3 + 2] = color.b * emIntensity2;
          windowIdx++;
        }
      }
    });

    while (windowIdx < windowCount) {
      const emptyMatrix = new THREE.Matrix4().makeScale(0, 0, 0);
      this.windowMesh.setMatrixAt(windowIdx, emptyMatrix);
      colors[windowIdx * 3] = 0;
      colors[windowIdx * 3 + 1] = 0;
      colors[windowIdx * 3 + 2] = 0;
      emissiveColors[windowIdx * 3] = 0;
      emissiveColors[windowIdx * 3 + 1] = 0;
      emissiveColors[windowIdx * 3 + 2] = 0;
      windowIdx++;
    }

    if (accentCount > 0 && accentIdx < accentCount) {
      const emptyMatrix = new THREE.Matrix4().makeScale(0, 0, 0);
      for (let i = accentIdx; i < accentCount; i++) {
        this.accentMesh.setMatrixAt(i, emptyMatrix);
      }
    }

    this.windowColorArray = new THREE.InstancedBufferAttribute(colors, 3);
    this.windowColorArray.setUsage(THREE.DynamicDrawUsage);
    this.windowGeo.setAttribute('color', this.windowColorArray);

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
    this.accentMaterial.color.setHex(theme.accent);
    this.accentMaterial.emissive.setHex(theme.accent);
    this.sceneManager.setGroundColor(theme.ground);
    this.updateWindowColors();
  }

  public updateHour(hour: number): void {
    this._currentHour = hour;
    this.updateWindowColors();
  }

  private updateWindowColors(): void {
    if (!this.windowMesh || !this.windowColorArray || this.buildings.length === 0) return;

    const theme = this._currentTheme;
    const emissiveBase = theme.windows;
    const nightIntensity = getWindowEmissiveIntensity(this._currentHour);
    const darkerWindow = lerpColor(emissiveBase, 0x000000, 0.35);
    const brighterWindow = lerpColor(emissiveBase, 0xffffff, 0.25);

    const colors = this.windowColorArray.array as Float32Array;
    const color = new THREE.Color();
    let idx = 0;

    this.buildings.forEach((b) => {
      const rand = this.seededRandom(b.seed);
      const floors = Math.max(3, Math.floor(b.size.y / 3.5));
      const perSide = Math.max(2, Math.floor(b.size.x / 3.5));
      const perDepth = Math.max(2, Math.floor(b.size.z / 3.5));

      for (let f = 0; f < floors; f++) {
        for (let w = 0; w < perSide; w++) {
          for (let side = 0; side < 2; side++) {
            if (idx * 3 < colors.length) {
              const lit = rand() > 0.3;
              const colorT = rand();
              const windowColor = lit ? lerpColor(darkerWindow, brighterWindow, colorT) : 0x0a0a15;
              color.setHex(windowColor);
              const intensity = lit ? nightIntensity : 0.05;
              colors[idx * 3] = color.r * intensity;
              colors[idx * 3 + 1] = color.g * intensity;
              colors[idx * 3 + 2] = color.b * intensity;
            }
            idx++;
          }
        }
        for (let w = 0; w < perDepth; w++) {
          for (let side = 0; side < 2; side++) {
            if (idx * 3 < colors.length) {
              const lit = rand() > 0.3;
              const colorT = rand();
              const windowColor = lit ? lerpColor(darkerWindow, brighterWindow, colorT) : 0x0a0a15;
              color.setHex(windowColor);
              const intensity = lit ? nightIntensity : 0.05;
              colors[idx * 3] = color.r * intensity;
              colors[idx * 3 + 1] = color.g * intensity;
              colors[idx * 3 + 2] = color.b * intensity;
            }
            idx++;
          }
        }
      }
    });

    this.windowColorArray.needsUpdate = true;
  }

  public clear(): void {
    if (this.buildingMesh) {
      this.sceneManager.removeObject(this.buildingMesh);
      this.buildingMesh.geometry.dispose();
      this.buildingMesh = null;
    }
    if (this.windowMesh) {
      this.sceneManager.removeObject(this.windowMesh);
      this.windowMesh.geometry.dispose();
      this.windowMesh = null;
    }
    if (this.accentMesh) {
      this.sceneManager.removeObject(this.accentMesh);
      this.accentMesh.geometry.dispose();
      this.accentMesh = null;
    }
    if (this.windowColorArray) {
      this.windowColorArray = null;
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
