import * as THREE from 'three';
import { DataPoint, getCategoryColor } from './dataLoader';

export interface Building {
  id: number;
  data: DataPoint;
  group: THREE.Group;
  mesh: THREE.Mesh;
  halo: THREE.Mesh;
  lod: THREE.LOD;
  materials: THREE.MeshStandardMaterial[];
  targetHeight: number;
  currentHeight: number;
  baseY: number;
  targetPosition: THREE.Vector3;
  originalColor: THREE.Color;
  isHovered: boolean;
  isAnimating: boolean;
}

export class CityBuilder {
  private scene: THREE.Scene;
  private buildings: Map<number, Building> = new Map();
  private buildingMeshes: THREE.Mesh[] = [];
  private buildingsGroup: THREE.Group;
  private ground?: THREE.Mesh;
  private windowTexture?: THREE.CanvasTexture;
  private eventHandlers: Map<string, Function[]> = new Map();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.buildingsGroup = new THREE.Group();
    this.scene.add(this.buildingsGroup);
    this.createWindowTexture();
    this.createGround();
    this.createSky();
    this.createLights();
  }

  private createWindowTexture(): void {
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
          const r = 255;
          const g = 200 + Math.random() * 40;
          const b = 120 + Math.random() * 40;
          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        } else {
          const r = 30 + Math.random() * 20;
          const g = 40 + Math.random() * 20;
          const b = 60 + Math.random() * 20;
          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        }
        const px = x * cellW + border;
        const py = y * cellH + border;
        ctx.fillRect(px, py, windowW, windowH);
      }
    }
    this.windowTexture = new THREE.CanvasTexture(canvas);
    this.windowTexture.wrapS = THREE.RepeatWrapping;
    this.windowTexture.wrapT = THREE.RepeatWrapping;
    this.windowTexture.repeat.set(1, 2);
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

    const materials: THREE.MeshStandardMaterial[] = [
      new THREE.MeshStandardMaterial({ color: color.clone().multiplyScalar(0.85), roughness: 0.7, metalness: 0.1, emissive: 0x000000, emissiveIntensity: 0 }),
      new THREE.MeshStandardMaterial({ color: color.clone().multiplyScalar(0.85), roughness: 0.7, metalness: 0.1, emissive: 0x000000, emissiveIntensity: 0 }),
      new THREE.MeshStandardMaterial({ color: color.clone().multiplyScalar(1.1), roughness: 0.6, metalness: 0.2, emissive: 0x000000, emissiveIntensity: 0 }),
      new THREE.MeshStandardMaterial({ color: color.clone().multiplyScalar(0.5), roughness: 0.8, metalness: 0.05, emissive: 0x000000, emissiveIntensity: 0 }),
      new THREE.MeshStandardMaterial({
        color: color,
        map: this.windowTexture,
        roughness: 0.5,
        metalness: 0.15,
        emissive: 0x000000,
        emissiveIntensity: 0,
      }),
      new THREE.MeshStandardMaterial({
        color: color,
        map: this.windowTexture,
        roughness: 0.5,
        metalness: 0.15,
        emissive: 0x000000,
        emissiveIntensity: 0,
      }),
    ];

    const lod = new THREE.LOD();

    const geo0 = new THREE.BoxGeometry(baseSize, height, baseSize);
    const mesh0 = new THREE.Mesh(geo0, materials);
    mesh0.position.y = height / 2;
    mesh0.castShadow = true;
    mesh0.receiveShadow = true;
    lod.addLevel(mesh0, 0);

    const geo1 = new THREE.BoxGeometry(baseSize, height, baseSize);
    const mat1 = new THREE.MeshStandardMaterial({ color: color, roughness: 0.7, metalness: 0.1, emissive: 0x000000, emissiveIntensity: 0 });
    const mesh1 = new THREE.Mesh(geo1, mat1);
    mesh1.position.y = height / 2;
    mesh1.castShadow = true;
    mesh1.receiveShadow = true;
    lod.addLevel(mesh1, 25);

    const geo2 = new THREE.BoxGeometry(baseSize * 0.9, height * 0.95, baseSize * 0.9, 1, 1, 1);
    const mat2 = new THREE.MeshStandardMaterial({ color: color.clone().multiplyScalar(0.8), roughness: 0.8, metalness: 0.05, emissive: 0x000000, emissiveIntensity: 0 });
    const mesh2 = new THREE.Mesh(geo2, mat2);
    mesh2.position.y = height / 2;
    mesh2.castShadow = true;
    mesh2.receiveShadow = true;
    lod.addLevel(mesh2, 50);

    lod.position.y = 0;
    lod.userData.buildingId = data.id;

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

    group.add(lod);
    group.add(halo);
    group.position.copy(position);

    const building: Building = {
      id: data.id,
      data,
      group,
      mesh: mesh0,
      halo,
      lod,
      materials,
      targetHeight: height,
      currentHeight: height,
      baseY: position.y,
      targetPosition: position.clone(),
      originalColor: color.clone(),
      isHovered: false,
      isAnimating: false,
    };

    mesh0.userData.buildingId = data.id;
    mesh1.userData.buildingId = data.id;
    mesh2.userData.buildingId = data.id;
    this.buildingMeshes.push(mesh0);
    this.buildingMeshes.push(mesh1);
    this.buildingMeshes.push(mesh2);
    this.buildingsGroup.add(group);
    this.buildings.set(data.id, building);

    return building;
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
      if (visible && building.isHovered) {
        this.setHoverState(building, false);
      }
    });
  }

  public clearBuildings(): void {
    this.buildings.forEach(b => {
      this.buildingsGroup.remove(b.group);
      b.mesh.geometry.dispose();
      if (Array.isArray(b.mesh.material)) {
        b.mesh.material.forEach(m => m.dispose());
      } else {
        b.mesh.material.dispose();
      }
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

  public setHoverState(building: Building, hovered: boolean): void {
    if (building.isHovered === hovered) return;
    building.isHovered = hovered;
    if (building.glowMaterial) {
      building.glowMaterial.opacity = hovered ? 0.5 : 0;
    }
    (building.halo.material as THREE.MeshBasicMaterial).opacity = hovered ? 0.35 : 0.15;
  }

  public animateBuildings(deltaTime: number): void {
    this.buildings.forEach(building => {
      const pos = building.group.position;
      const target = building.targetPosition;
      pos.x += (target.x - pos.x) * Math.min(deltaTime * 4, 1);
      pos.z += (target.z - pos.z) * Math.min(deltaTime * 4, 1);

      const mesh = building.mesh;
      const targetScaleY = building.targetHeight / Math.max(building.data.value * 0.2, 1);
      mesh.scale.y += (targetScaleY - mesh.scale.y) * Math.min(deltaTime * 5, 1);
      mesh.position.y = (building.data.value * 0.2 * mesh.scale.y) / 2;
    });
  }

  public playGrowthAnimation(building: Building): void {
    if (building.isAnimating) return;
    building.isAnimating = true;

    const originalHeight = building.data.value * 0.2;
    const peakHeight = originalHeight * 2;
    const duration = 800;
    const startTime = performance.now();

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = this.easeOutBack(progress);

      let height: number;
      if (eased < 0.5) {
        const t = eased / 0.5;
        height = originalHeight + (peakHeight - originalHeight) * t;
      } else {
        const t = (eased - 0.5) / 0.5;
        height = peakHeight + (originalHeight - peakHeight) * t;
      }

      const scaleY = height / originalHeight;
      building.mesh.scale.y = scaleY;
      building.mesh.position.y = height / 2;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        building.mesh.scale.y = 1;
        building.mesh.position.y = originalHeight / 2;
        building.isAnimating = false;
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

    const sortedByDistance = sortedData.slice().sort((a, b) => {
      const pa = positions.get(a.id)!;
      const pb = positions.get(b.id)!;
      return Math.sqrt(pa.x * pa.x + pa.z * pa.z) - Math.sqrt(pb.x * pb.x + pb.z * pb.z);
    });

    const totalDelay = 1000;
    const stepDelay = totalDelay / Math.max(sortedByDistance.length - 1, 1);

    sortedByDistance.forEach((point, i) => {
      const building = this.buildings.get(point.id);
      if (!building) return;

      setTimeout(() => {
        const pos = positions.get(point.id)!;
        building.targetPosition.set(pos.x, 0, pos.z);
      }, i * stepDelay);
    });
  }
}
