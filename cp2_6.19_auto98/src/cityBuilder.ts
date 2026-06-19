import * as THREE from 'three';
import { DataPoint, getCategoryColor } from './dataLoader';

export interface Building {
  id: number;
  data: DataPoint;
  group: THREE.Group;
  contentGroup: THREE.Group;
  lod: THREE.LOD;
  allMeshes: THREE.Mesh[];
  allMaterials: THREE.MeshStandardMaterial[];
  halo: THREE.Mesh;
  targetHeight: number;
  currentHeight: number;
  baseY: number;
  targetPosition: THREE.Vector3;
  originalColor: THREE.Color;
  isHovered: boolean;
  isAnimating: boolean;
}

export type BuildingEvent = 'hover' | 'click' | 'growthStart' | 'growthEnd';

export class CityBuilder {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private buildings: Map<number, Building> = new Map();
  private buildingMeshes: THREE.Mesh[] = [];
  private buildingsGroup: THREE.Group;
  private ground?: THREE.Mesh;
  private windowTextureVariants: THREE.CanvasTexture[] = [];
  private eventHandlers: Map<BuildingEvent, ((building: Building) => void)[]> = new Map();

  private static readonly WINDOW_TEXTURE_COUNT = 6;
  private static readonly LOD_DISTANCES = [0, 25, 50];

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
    this.scene = scene;
    this.camera = camera;
    this.buildingsGroup = new THREE.Group();
    this.scene.add(this.buildingsGroup);
    this.createWindowTextureVariants();
    this.createGround();
    this.createSky();
    this.createLights();
  }

  private createWindowTextureVariants(): void {
    for (let v = 0; v < CityBuilder.WINDOW_TEXTURE_COUNT; v++) {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 256;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = '#0a0d15';
      ctx.fillRect(0, 0, 128, 256);

      const cols = 6;
      const rows = 14;
      const border = 3;
      const cellW = 128 / cols;
      const cellH = 256 / rows;
      const windowW = cellW - border * 2;
      const windowH = cellH - border * 2;

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const isLit = Math.random() > 0.35;

          if (isLit) {
            const warmth = Math.random();
            const r = 240 + Math.floor(Math.random() * 15);
            const g = 190 + Math.floor(Math.random() * 50);
            const b = 100 + Math.floor(warmth * 80);
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.4)`;
            ctx.shadowBlur = 2;
          } else {
            const dim = Math.random();
            const r = 25 + Math.floor(dim * 20);
            const g = 35 + Math.floor(dim * 20);
            const b = 50 + Math.floor(dim * 25);
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.shadowBlur = 0;
          }

          const px = x * cellW + border;
          const py = y * cellH + border;
          ctx.fillRect(px, py, windowW, windowH);
          ctx.shadowBlur = 0;
        }
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(1, 2);
      tex.needsUpdate = true;
      this.windowTextureVariants.push(tex);
    }
  }

  private createGround(): void {
    const size = 60;
    const gridSize = 60;
    const divisions = 30;
    const gridHelper = new THREE.GridHelper(gridSize, divisions, 0x2a3550, 0x1a2238);
    gridHelper.position.y = 0;
    this.scene.add(gridHelper);

    const groundGeo = new THREE.PlaneGeometry(size, size);
    const groundMat = new THREE.MeshBasicMaterial({
      color: 0x0a0e1a,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
    });
    this.ground = new THREE.Mesh(groundGeo, groundMat);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.y = -0.01;
    this.scene.add(this.ground);
  }

  private createSky(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 512);
    gradient.addColorStop(0, '#1a1f3a');
    gradient.addColorStop(0.5, '#0f1428');
    gradient.addColorStop(1, '#050810');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const size = Math.random() * 1.5 + 0.5;
      const alpha = Math.random() * 0.6 + 0.2;
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    const skyTex = new THREE.CanvasTexture(canvas);
    const skyGeo = new THREE.SphereGeometry(200, 32, 32);
    const skyMat = new THREE.MeshBasicMaterial({
      map: skyTex,
      side: THREE.BackSide,
    });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(sky);
  }

  private createLights(): void {
    const ambient = new THREE.AmbientLight(0x404060, 0.6);
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(20, 40, 20);
    this.scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x4488ff, 0.3);
    fillLight.position.set(-20, 20, -10);
    this.scene.add(fillLight);

    const pointLight = new THREE.PointLight(0x4fc3f7, 0.5, 80);
    pointLight.position.set(0, 30, 0);
    this.scene.add(pointLight);
  }

  private createBuilding(data: DataPoint, position: THREE.Vector3): Building {
    const group = new THREE.Group();
    const height = Math.max(data.value * 0.2, 1);
    const baseSize = 1.6;

    const colorHex = getCategoryColor(data.category, data.value);
    const color = new THREE.Color(colorHex);

    const windowTex = this.windowTextureVariants[Math.floor(Math.random() * this.windowTextureVariants.length)];

    const lod = new THREE.LOD();
    const allMeshes: THREE.Mesh[] = [];
    const allMaterials: THREE.MeshStandardMaterial[] = [];

    const highDetailMaterials: THREE.MeshStandardMaterial[] = [
      this.createBuildingMaterial(color.clone().multiplyScalar(0.85), 0.7, 0.1),
      this.createBuildingMaterial(color.clone().multiplyScalar(0.85), 0.7, 0.1),
      this.createBuildingMaterial(color.clone().multiplyScalar(1.1), 0.6, 0.2),
      this.createBuildingMaterial(color.clone().multiplyScalar(0.5), 0.8, 0.05),
      this.createBuildingMaterial(color, 0.5, 0.15, windowTex),
      this.createBuildingMaterial(color, 0.5, 0.15, windowTex),
    ];
    allMaterials.push(...highDetailMaterials);

    const geoHigh = new THREE.BoxGeometry(baseSize, height, baseSize, 2, Math.max(2, Math.floor(height / 2)), 2);
    const meshHigh = new THREE.Mesh(geoHigh, highDetailMaterials);
    meshHigh.position.y = height / 2;
    meshHigh.castShadow = true;
    meshHigh.receiveShadow = true;
    meshHigh.userData.buildingId = data.id;
    allMeshes.push(meshHigh);
    lod.addLevel(meshHigh, CityBuilder.LOD_DISTANCES[0]);

    const matMid = this.createBuildingMaterial(color, 0.7, 0.1);
    allMaterials.push(matMid);
    const geoMid = new THREE.BoxGeometry(baseSize, height, baseSize, 1, 1, 1);
    const meshMid = new THREE.Mesh(geoMid, matMid);
    meshMid.position.y = height / 2;
    meshMid.castShadow = true;
    meshMid.receiveShadow = true;
    meshMid.userData.buildingId = data.id;
    allMeshes.push(meshMid);
    lod.addLevel(meshMid, CityBuilder.LOD_DISTANCES[1]);

    const matLow = this.createBuildingMaterial(color.clone().multiplyScalar(0.8), 0.85, 0.05);
    allMaterials.push(matLow);
    const geoLow = new THREE.BoxGeometry(baseSize * 0.92, height * 0.96, baseSize * 0.92, 1, 1, 1);
    const meshLow = new THREE.Mesh(geoLow, matLow);
    meshLow.position.y = (height * 0.96) / 2;
    meshLow.castShadow = true;
    meshLow.receiveShadow = true;
    meshLow.userData.buildingId = data.id;
    allMeshes.push(meshLow);
    lod.addLevel(meshLow, CityBuilder.LOD_DISTANCES[2]);

    const contentGroup = new THREE.Group();
    contentGroup.add(lod);

    const haloGeo = new THREE.CircleGeometry(baseSize * 0.9, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = 0.02;

    group.add(contentGroup);
    group.add(halo);
    group.position.copy(position);

    const building: Building = {
      id: data.id,
      data,
      group,
      contentGroup,
      lod,
      allMeshes,
      allMaterials,
      halo,
      targetHeight: height,
      currentHeight: height,
      baseY: position.y,
      targetPosition: position.clone(),
      originalColor: color.clone(),
      isHovered: false,
      isAnimating: false,
    };

    this.buildingMeshes.push(...allMeshes);
    this.buildingsGroup.add(group);
    this.buildings.set(data.id, building);

    return building;
  }

  private createBuildingMaterial(
    color: THREE.Color,
    roughness: number,
    metalness: number,
    map?: THREE.Texture
  ): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: color.clone(),
      map: map || null,
      roughness,
      metalness,
      emissive: new THREE.Color(0x000000),
      emissiveIntensity: 0,
    });
  }

  public on(event: BuildingEvent, handler: (building: Building) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  public off(event: BuildingEvent, handler: (building: Building) => void): void {
    const handlers = this.eventHandlers.get(event);
    if (!handlers) return;
    const idx = handlers.indexOf(handler);
    if (idx >= 0) handlers.splice(idx, 1);
  }

  private emit(event: BuildingEvent, building: Building): void {
    const handlers = this.eventHandlers.get(event);
    if (!handlers) return;
    for (const h of handlers) h(building);
  }

  public buildCity(data: DataPoint[]): void {
    this.clearBuildings();
    const cols = Math.ceil(Math.sqrt(data.length));
    const spacing = 3.2;
    const offset = ((cols - 1) * spacing) / 2;

    data.forEach((point, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      const x = col * spacing - offset;
      const z = row * spacing - offset;
      const jitterX = (Math.random() - 0.5) * 0.3;
      const jitterZ = (Math.random() - 0.5) * 0.3;
      this.createBuilding(point, new THREE.Vector3(x + jitterX, 0, z + jitterZ));
    });
  }

  public updateLayout(sortedData: DataPoint[], animated: boolean = true): void {
    const cols = Math.ceil(Math.sqrt(sortedData.length));
    const spacing = 3.2;
    const offset = ((cols - 1) * spacing) / 2;

    sortedData.forEach((point, index) => {
      const building = this.buildings.get(point.id);
      if (!building) return;

      const row = Math.floor(index / cols);
      const col = index % cols;
      const x = col * spacing - offset;
      const z = row * spacing - offset;

      building.targetPosition.set(x, 0, z);
      if (!animated) {
        building.group.position.copy(building.targetPosition);
      }
    });
  }

  public updateCategoryVisibility(activeCategories: number[]): void {
    this.buildings.forEach(building => {
      const visible = activeCategories.includes(building.data.category);
      building.group.visible = visible;
      if (!visible && building.isHovered) {
        this.setBuildingHover(building, false);
      }
    });
  }

  public clearBuildings(): void {
    this.buildings.forEach(b => {
      this.buildingsGroup.remove(b.group);
      b.allMeshes.forEach(m => {
        m.geometry.dispose();
      });
      b.allMaterials.forEach(m => m.dispose());
      b.halo.geometry.dispose();
      (b.halo.material as THREE.Material).dispose();
    });
    this.buildings.clear();
    this.buildingMeshes = [];
  }

  public getBuildings(): Map<number, Building> {
    return this.buildings;
  }

  public getBuildingMeshes(): THREE.Mesh[] {
    return this.buildingMeshes;
  }

  public getBuildingById(id: number): Building | undefined {
    return this.buildings.get(id);
  }

  public getBuildingByMesh(mesh: THREE.Mesh): Building | undefined {
    const id = mesh.userData.buildingId;
    return id !== undefined ? this.buildings.get(id) : undefined;
  }

  public setBuildingHover(building: Building, hovered: boolean): void {
    if (building.isHovered === hovered) return;
    building.isHovered = hovered;

    const targetIntensity = hovered ? 0.5 : 0;
    building.allMaterials.forEach(mat => {
      if (hovered) {
        mat.emissive.copy(building.originalColor);
      } else {
        mat.emissive.setHex(0x000000);
      }
      mat.emissiveIntensity = targetIntensity;
      mat.needsUpdate = true;
    });

    (building.halo.material as THREE.MeshBasicMaterial).opacity = hovered ? 0.35 : 0.15;

    if (hovered) {
      this.emit('hover', building);
    }
  }

  public triggerBuildingClick(building: Building): void {
    this.emit('click', building);
    this.playGrowthAnimation(building);
  }

  public animateBuildings(deltaTime: number): void {
    this.buildings.forEach(building => {
      const pos = building.group.position;
      const target = building.targetPosition;
      pos.x += (target.x - pos.x) * Math.min(deltaTime * 4, 1);
      pos.z += (target.z - pos.z) * Math.min(deltaTime * 4, 1);
    });

    this.buildings.forEach(b => b.lod.update(this.camera));
  }

  public playGrowthAnimation(building: Building): void {
    if (building.isAnimating) return;
    building.isAnimating = true;
    this.emit('growthStart', building);

    const duration = 800;
    const startTime = performance.now();
    const expectedEnd = startTime + duration;

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = this.easeOutBack(progress);

      let targetScale: number;
      if (eased < 0.5) {
        const t = eased / 0.5;
        targetScale = 1 + t;
      } else {
        const t = (eased - 0.5) / 0.5;
        targetScale = 2 - t;
      }

      building.contentGroup.scale.y = targetScale;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        building.contentGroup.scale.y = 1;
        building.isAnimating = false;
        const actualEnd = performance.now();
        const deviation = Math.abs(actualEnd - expectedEnd);
        if (deviation > 50) {
          console.warn(`Growth animation deviation: ${deviation}ms (expected < 50ms)`);
        }
        this.emit('growthEnd', building);
      }
    };
    animate();
  }

  private easeOutBack(t: number): number {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  public playWaveTransition(sortedData: DataPoint[]): void {
    this.updateLayout(sortedData, true);

    const positions: Map<number, { x: number; z: number }> = new Map();
    const cols = Math.ceil(Math.sqrt(sortedData.length));
    const spacing = 3.2;
    const offset = ((cols - 1) * spacing) / 2;

    sortedData.forEach((point, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      const x = col * spacing - offset;
      const z = row * spacing - offset;
      positions.set(point.id, { x, z });
    });

    const cameraPos = this.camera.position.clone();

    const buildingsWithDistance = sortedData
      .map(point => {
        const building = this.buildings.get(point.id);
        if (!building) return null;
        const pos = building.group.position;
        const dist = pos.distanceTo(cameraPos);
        return { building, dist };
      })
      .filter((x): x is { building: Building; dist: number } => x !== null);

    buildingsWithDistance.sort((a, b) => a.dist - b.dist);

    const totalDuration = 1000;
    const minDist = buildingsWithDistance.length > 0 ? buildingsWithDistance[0].dist : 0;
    const maxDist =
      buildingsWithDistance.length > 0
        ? buildingsWithDistance[buildingsWithDistance.length - 1].dist
        : 1;
    const distRange = Math.max(maxDist - minDist, 0.001);

    buildingsWithDistance.forEach(({ building, dist }) => {
      const normalized = (dist - minDist) / distRange;
      const delay = normalized * totalDuration;
      const pos = positions.get(building.id)!;

      setTimeout(() => {
        building.targetPosition.set(pos.x, 0, pos.z);
      }, delay);
    });
  }
}
