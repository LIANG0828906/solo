import * as THREE from 'three';
import { buildingData, BUILDING_COLORS, gridConfig, BuildingData, BuildingFunction } from '../data/buildingData';

type BuildingMeshGroup = THREE.Group & {
  buildingId: string;
  baseColor: number;
  originalColor: number;
  originalEmissive: number;
  windows: THREE.Mesh[];
  isHighlighting: boolean;
  buildingMeshes: THREE.Mesh[];
  materials: THREE.MeshStandardMaterial[];
}

interface PooledParticle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  buildingId: string;
  active: boolean;
}

interface HighlightTween {
  buildingId: string;
  startTime: number;
  duration: number;
  fromColor: THREE.Color;
  toColor: THREE.Color;
  fromEmissive: THREE.Color;
  toEmissive: THREE.Color;
  onComplete?: () => void;
}

export class Visualizer {
  private scene: THREE.Scene;
  private buildings: Map<string, BuildingMeshGroup> = new Map();
  private particles: PooledParticle[] = [];
  private particlePool: PooledParticle[] = [];
  private readonly MAX_PARTICLES = 400;
  private readonly PARTICLE_LIFETIME = 1.5;
  private readonly PARTICLES_PER_BUILDING = 10;

  private particleGeometry: THREE.SphereGeometry;
  private particleMaterialTemplate: THREE.MeshBasicMaterial;

  private timeOfDay: number = 12;
  private ambientLight: THREE.AmbientLight | null = null;
  private directionalLight: THREE.DirectionalLight | null = null;
  private hemisphereLight: THREE.HemisphereLight | null = null;
  private sunLight: THREE.DirectionalLight | null = null;

  private daySkyColor: THREE.Color = new THREE.Color(0x87ceeb);
  private nightSkyColor: THREE.Color = new THREE.Color(0x0a1628);
  private dayAmbientColor: THREE.Color = new THREE.Color(0xfff4e0);
  private nightAmbientColor: THREE.Color = new THREE.Color(0x1a2a4a);

  private highlightTweens: Map<string, HighlightTween> = new Map();
  private buildingObjectsCache: THREE.Object3D[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.particleGeometry = new THREE.SphereGeometry(0.25, 6, 6);
    this.particleMaterialTemplate = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    this.initLights();
    this.createGround();
    this.initParticlePool();
    this.createBuildings();
    this.cacheBuildingObjects();
  }

  private initLights(): void {
    this.ambientLight = new THREE.AmbientLight(this.dayAmbientColor, 0.5);
    this.scene.add(this.ambientLight);

    this.hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x556b2f, 0.4);
    this.scene.add(this.hemisphereLight);

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    this.directionalLight.position.set(50, 100, 50);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.set(2048, 2048);
    this.directionalLight.shadow.camera.left = -150;
    this.directionalLight.shadow.camera.right = 150;
    this.directionalLight.shadow.camera.top = 150;
    this.directionalLight.shadow.camera.bottom = -150;
    this.directionalLight.shadow.bias = -0.0005;
    this.scene.add(this.directionalLight);
    
    this.sunLight = new THREE.DirectionalLight(0xffeedd, 0.4);
    this.sunLight.position.set(-30, 50, -30);
    this.scene.add(this.sunLight);
  }

  private initParticlePool(): void {
    for (let i = 0; i < this.MAX_PARTICLES; i++) {
      const material = this.particleMaterialTemplate.clone();
      const mesh = new THREE.Mesh(this.particleGeometry, material);
      mesh.visible = false;
      mesh.renderOrder = 1000;
      mesh.frustumCulled = true;

      this.particlePool.push({
        mesh,
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: this.PARTICLE_LIFETIME,
        buildingId: '',
        active: false,
      });

      this.scene.add(mesh);
    }
  }

  private cacheBuildingObjects(): void {
    this.buildingObjectsCache = [];
    for (const building of this.buildings.values()) {
      this.buildingObjectsCache.push(building);
    }
  }

  private createGround(): void {
    const totalSize = gridConfig.totalSize + 40;
    
    const groundGeometry = new THREE.PlaneGeometry(totalSize, totalSize);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x2c3e50,
      roughness: 0.9,
      metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    ground.receiveShadow = true;
    this.scene.add(ground);

    this.createStreets();
  }

  private createStreets(): void {
    const totalSize = gridConfig.totalSize;
    const streetGroup = new THREE.Group();
    const streetMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x95a5a6,
      roughness: 0.8,
      metalness: 0.2
    });

    const halfSize = totalSize / 2;
    const offset = -halfSize + gridConfig.streetWidth / 2;

    for (let i = 0; i <= gridConfig.size; i++) {
      const x = offset + i * (gridConfig.buildingSpacing + gridConfig.streetWidth);
      
      const hStreet = new THREE.Mesh(
        new THREE.BoxGeometry(totalSize, 0.05, gridConfig.streetWidth),
        streetMaterial
      );
      hStreet.position.set(0, 0.01, x);
      hStreet.receiveShadow = true;
      streetGroup.add(hStreet);

      const vStreet = new THREE.Mesh(
        new THREE.BoxGeometry(gridConfig.streetWidth, 0.05, totalSize),
        streetMaterial
      );
      vStreet.position.set(x, 0.01, 0);
      vStreet.receiveShadow = true;
      streetGroup.add(vStreet);
    }

    this.scene.add(streetGroup);
  }

  private createBuildings(): void {
    for (const data of buildingData) {
      const buildingGroup = this.createBuilding(data);
      this.buildings.set(data.id, buildingGroup as BuildingMeshGroup);
      this.scene.add(buildingGroup);
    }
  }

  private createBuilding(data: BuildingData): THREE.Group {
    const group = new THREE.Group() as BuildingMeshGroup;
    group.buildingId = data.id;
    group.baseColor = BUILDING_COLORS[data.function];
    group.originalColor = BUILDING_COLORS[data.function];
    group.originalEmissive = 0x000000;
    group.windows = [];
    group.buildingMeshes = [];
    group.materials = [];
    group.isHighlighting = false;

    const width = gridConfig.buildingSpacing * 0.7;
    const depth = gridConfig.buildingSpacing * 0.7;
    const height = data.height;

    const mainGeometry = new THREE.BoxGeometry(width, height, depth);
    const mainMaterial = new THREE.MeshStandardMaterial({
      color: BUILDING_COLORS[data.function],
      roughness: 0.7,
      metalness: 0.3,
      emissive: 0x000000,
      emissiveIntensity: 0,
    });
    const mainMesh = new THREE.Mesh(mainGeometry, mainMaterial);
    mainMesh.position.y = height / 2;
    mainMesh.castShadow = true;
    mainMesh.receiveShadow = true;
    group.buildingMeshes.push(mainMesh);
    group.materials.push(mainMaterial);
    group.add(mainMesh);

    this.addWindows(group, width, height, depth, data.function);
    this.addRoof(group, width, height, depth, data);

    group.position.set(data.x, 0, data.z);

    return group;
  }

  private addWindows(
    group: BuildingMeshGroup, 
    width: number, 
    height: number, 
    depth: number,
    func: BuildingFunction
  ): void {
    const windowRows = Math.max(3, Math.floor(height / 5));
    const windowCols = 3;
    const windowWidth = width * 0.15;
    const windowHeight = height * 0.08;
    const windowDepth = 0.1;

    const windowSpacingV = (height * 0.7) / windowRows;
    const windowSpacingH = (width * 0.6) / (windowCols - 1);
    const windowDepthSpacing = (depth * 0.6) / (windowCols - 1);

    for (let row = 0; row < windowRows; row++) {
      for (let col = 0; col < windowCols; col++) {
        const isLit = Math.random() > 0.3;
        
        const winMat = isLit 
          ? new THREE.MeshBasicMaterial({ 
              color: 0xffd700, 
              transparent: true, 
              opacity: this.timeOfDay < 6 || this.timeOfDay > 18 ? 0.9 : 0.1 
            })
          : new THREE.MeshBasicMaterial({ color: 0x1a2a3a });

        const yPos = height * 0.2 + row * windowSpacingV;
        const xPos = -width * 0.3 + col * windowSpacingH;
        const zPos = -depth * 0.3 + col * windowDepthSpacing;

        const frontWindow = new THREE.Mesh(
          new THREE.BoxGeometry(windowWidth, windowHeight, windowDepth),
          winMat
        );
        frontWindow.position.set(xPos, yPos, depth / 2 + 0.05);
        group.add(frontWindow);
        if (isLit) group.windows.push(frontWindow);

        const backWindow = new THREE.Mesh(
          new THREE.BoxGeometry(windowWidth, windowHeight, windowDepth),
          isLit ? winMat.clone() : winMat
        );
        backWindow.position.set(xPos, yPos, -depth / 2 - 0.05);
        group.add(backWindow);
        if (isLit) group.windows.push(backWindow);

        const leftWindow = new THREE.Mesh(
          new THREE.BoxGeometry(windowDepth, windowHeight, windowWidth),
          isLit ? winMat.clone() : winMat
        );
        leftWindow.position.set(-width / 2 - 0.05, yPos, zPos);
        group.add(leftWindow);
        if (isLit) group.windows.push(leftWindow);

        const rightWindow = new THREE.Mesh(
          new THREE.BoxGeometry(windowDepth, windowHeight, windowWidth),
          isLit ? winMat.clone() : winMat
        );
        rightWindow.position.set(width / 2 + 0.05, yPos, zPos);
        group.add(rightWindow);
        if (isLit) group.windows.push(rightWindow);
      }
    }
  }

  private addRoof(
    group: BuildingMeshGroup,
    width: number,
    height: number,
    depth: number,
    data: BuildingData
  ): void {
    const roofColor = new THREE.Color(BUILDING_COLORS[data.function]).multiplyScalar(0.8);
    
    if (data.roofType === 'spire') {
      const spireGeometry = new THREE.ConeGeometry(
        Math.min(width, depth) * 0.3,
        height * 0.3,
        4
      );
      const spireMaterial = new THREE.MeshStandardMaterial({
        color: roofColor,
        roughness: 0.6,
        metalness: 0.4,
        emissive: 0x000000,
        emissiveIntensity: 0,
      });
      const spire = new THREE.Mesh(spireGeometry, spireMaterial);
      spire.position.y = height + height * 0.15;
      spire.rotation.y = data.roofRotation;
      spire.castShadow = true;
      group.buildingMeshes.push(spire);
      group.materials.push(spireMaterial);
      group.add(spire);
    } else {
      const flatGeometry = new THREE.BoxGeometry(
        width * 0.9,
        1.5,
        depth * 0.9
      );
      const flatMaterial = new THREE.MeshStandardMaterial({
        color: roofColor,
        roughness: 0.8,
        metalness: 0.2,
        emissive: 0x000000,
        emissiveIntensity: 0,
      });
      const flatRoof = new THREE.Mesh(flatGeometry, flatMaterial);
      flatRoof.position.y = height + 0.75;
      flatRoof.castShadow = true;
      group.buildingMeshes.push(flatRoof);
      group.materials.push(flatMaterial);
      group.add(flatRoof);

      const decorCount = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < decorCount; i++) {
        const decorSize = 1 + Math.random() * 2;
        const decorGeometry = new THREE.CylinderGeometry(
          decorSize * 0.3,
          decorSize * 0.4,
          2 + Math.random() * 3,
          8
        );
        const decorMaterial = new THREE.MeshStandardMaterial({
          color: roofColor,
          roughness: 0.5,
          metalness: 0.5,
          emissive: 0x000000,
          emissiveIntensity: 0,
        });
        const decor = new THREE.Mesh(decorGeometry, decorMaterial);
        decor.position.set(
          (Math.random() - 0.5) * width * 0.5,
          height + 3,
          (Math.random() - 0.5) * depth * 0.5
        );
        decor.castShadow = true;
        group.buildingMeshes.push(decor);
        group.materials.push(decorMaterial);
        group.add(decor);
      }
    }
  }

  highlightBuilding(buildingId: string): void {
    const building = this.buildings.get(buildingId);
    if (!building) return;

    if (this.highlightTweens.has(buildingId)) {
      this.highlightTweens.delete(buildingId);
    }

    const startColor = new THREE.Color(building.baseColor);
    const startEmissive = new THREE.Color(building.originalEmissive);
    const targetColor = new THREE.Color(0xffffff);
    const targetEmissive = new THREE.Color(0xffffff);

    this.highlightTweens.set(buildingId, {
      buildingId,
      startTime: performance.now(),
      duration: 300,
      fromColor: startColor,
      toColor: targetColor,
      fromEmissive: startEmissive,
      toEmissive: targetEmissive,
    });

    building.isHighlighting = true;
    this.spawnParticles(buildingId);
  }

  resetHighlight(buildingId: string): void {
    const building = this.buildings.get(buildingId);
    if (!building) return;

    if (this.highlightTweens.has(buildingId)) {
      this.highlightTweens.delete(buildingId);
    }

    const startColor = new THREE.Color(building.baseColor);
    const startEmissive = new THREE.Color(0xffffff);
    const targetColor = new THREE.Color(building.originalColor);
    const targetEmissive = new THREE.Color(0x000000);

    this.highlightTweens.set(buildingId, {
      buildingId,
      startTime: performance.now(),
      duration: 300,
      fromColor: startColor,
      toColor: targetColor,
      fromEmissive: startEmissive,
      toEmissive: targetEmissive,
      onComplete: () => {
        building.isHighlighting = false;
        building.baseColor = building.originalColor;
      },
    });
  }

  private spawnParticles(buildingId: string): void {
    const building = this.buildings.get(buildingId);
    const data = buildingData.find(b => b.id === buildingId);
    if (!building || !data) return;

    const colorHex = BUILDING_COLORS[data.function];
    const color = new THREE.Color(colorHex);
    const particleCount = this.PARTICLES_PER_BUILDING;

    let spawned = 0;
    const halfWidth = gridConfig.buildingSpacing * 0.3;

    for (let i = 0; i < this.particlePool.length && spawned < particleCount; i++) {
      const particle = this.particlePool[i];
      if (!particle.active) {
        const material = particle.mesh.material as THREE.MeshBasicMaterial;
        material.color.copy(color);
        material.opacity = 0.6;

        particle.mesh.position.set(
          building.position.x + (Math.random() - 0.5) * halfWidth,
          1,
          building.position.z + (Math.random() - 0.5) * halfWidth
        );

        const scale = 0.35 + Math.random() * 0.35;
        particle.mesh.scale.setScalar(scale);

        particle.velocity.set(
          (Math.random() - 0.5) * 0.25,
          6 + Math.random() * 4,
          (Math.random() - 0.5) * 0.25
        );
        particle.life = this.PARTICLE_LIFETIME;
        particle.maxLife = this.PARTICLE_LIFETIME;
        particle.buildingId = buildingId;
        particle.active = true;
        particle.mesh.visible = true;

        this.particles.push(particle);
        spawned++;
      }
    }
  }

  update(deltaTime: number): void {
    const now = performance.now();

    for (const [buildingId, tween] of this.highlightTweens) {
      const building = this.buildings.get(buildingId);
      if (!building) continue;

      const elapsed = now - tween.startTime;
      const progress = Math.min(elapsed / tween.duration, 1);
      const eased = this.easeOutCubic(progress);

      const currentColor = tween.fromColor.clone().lerp(tween.toColor, eased);
      const currentEmissive = tween.fromEmissive.clone().lerp(tween.toEmissive, eased);

      this.setBuildingColor(building, currentColor, currentEmissive);

      if (progress >= 1) {
        building.baseColor = tween.toColor.getHex();
        this.highlightTweens.delete(buildingId);
        if (tween.onComplete) {
          tween.onComplete();
        }
      }
    }

    const activeParticles = this.particles;
    for (let i = activeParticles.length - 1; i >= 0; i--) {
      const particle = activeParticles[i];
      if (!particle.active) {
        activeParticles.splice(i, 1);
        continue;
      }

      particle.life -= deltaTime;

      if (particle.life <= 0) {
        this.returnParticleToPool(particle);
        activeParticles.splice(i, 1);
        continue;
      }

      const vel = particle.velocity;
      const pos = particle.mesh.position;
      pos.x += vel.x * deltaTime;
      pos.y += vel.y * deltaTime;
      pos.z += vel.z * deltaTime;

      const lifeRatio = particle.life / particle.maxLife;
      const material = particle.mesh.material as THREE.MeshBasicMaterial;
      material.opacity = lifeRatio * 0.6;
    }
  }

  private returnParticleToPool(particle: PooledParticle): void {
    particle.active = false;
    particle.life = 0;
    particle.buildingId = '';
    particle.mesh.visible = false;
    const material = particle.mesh.material as THREE.MeshBasicMaterial;
    material.opacity = 0;
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  private setBuildingColor(building: BuildingMeshGroup, color: THREE.Color, emissive: THREE.Color): void {
    for (let i = 0; i < building.materials.length; i++) {
      const mat = building.materials[i];
      if (mat.isMeshStandardMaterial) {
        mat.color.copy(color);
        mat.emissive.copy(emissive);
        mat.emissiveIntensity = emissive.r > 0 ? 0.4 : 0;
      }
    }
  }

  setTimeOfDay(hour: number): void {
    this.timeOfDay = hour;

    const dayFactor = this.calculateDayFactor(hour);
    const nightFactor = 1 - dayFactor;

    if (this.ambientLight) {
      const ambientColor = this.dayAmbientColor.clone().lerp(this.nightAmbientColor, nightFactor);
      this.ambientLight.color.copy(ambientColor);
      this.ambientLight.intensity = 0.3 + dayFactor * 0.4;
    }

    if (this.directionalLight) {
      this.directionalLight.intensity = 0.2 + dayFactor * 0.8;
      const lightColor = new THREE.Color(0xffffff).lerp(new THREE.Color(0x4466aa), nightFactor * 0.5);
      this.directionalLight.color.copy(lightColor);
    }

    if (this.hemisphereLight) {
      this.hemisphereLight.intensity = 0.2 + dayFactor * 0.3;
    }

    const skyColor = this.daySkyColor.clone().lerp(this.nightSkyColor, nightFactor);
    this.scene.background = skyColor;
    if (this.scene.fog) {
      (this.scene.fog as THREE.Fog).color.copy(skyColor);
    }

    if (this.directionalLight) {
      const sunAngle = (hour - 6) / 12 * Math.PI;
      const sunHeight = Math.sin(sunAngle) * 100;
      const sunDist = Math.cos(sunAngle) * 80;
      this.directionalLight.position.set(sunDist, Math.max(10, sunHeight), 50);
    }

    const windowLightIntensity = Math.max(0, (nightFactor - 0.3) / 0.7);
    this.updateWindowLights(windowLightIntensity);
  }

  private calculateDayFactor(hour: number): number {
    if (hour >= 6 && hour <= 18) {
      const midday = 12;
      const dist = Math.abs(hour - midday) / 6;
      return 1 - dist * 0.3;
    } else if (hour > 18 && hour < 20) {
      return (20 - hour) / 2 * 0.9;
    } else if (hour >= 5 && hour < 6) {
      return (hour - 5) / 1 * 0.9;
    } else {
      return 0.05;
    }
  }

  private updateWindowLights(intensity: number): void {
    for (const building of this.buildings.values()) {
      for (let i = 0; i < building.windows.length; i++) {
        const window = building.windows[i];
        const mat = window.material as THREE.MeshBasicMaterial;
        if (mat.opacity !== undefined) {
          const targetOpacity = Math.max(0.05, intensity * 0.95);
          mat.opacity += (targetOpacity - mat.opacity) * 0.08;
        }
      }
    }
  }

  getBuildingByMesh(mesh: THREE.Object3D): string | null {
    let current: THREE.Object3D | null = mesh;
    while (current) {
      if ((current as BuildingMeshGroup).buildingId) {
        return (current as BuildingMeshGroup).buildingId;
      }
      current = current.parent;
    }
    return null;
  }

  getBuildingPosition(buildingId: string): THREE.Vector3 | null {
    const building = this.buildings.get(buildingId);
    if (!building) return null;
    return building.position.clone();
  }

  getBuildingHeight(buildingId: string): number {
    const data = buildingData.find(b => b.id === buildingId);
    return data?.height || 30;
  }

  getAllBuildingObjects(): THREE.Object3D[] {
    return this.buildingObjectsCache;
  }

  setFirstPersonBlur(_enabled: boolean): void {
  }

  dispose(): void {
    this.particleGeometry.dispose();
    this.particleMaterialTemplate.dispose();
    for (const particle of this.particlePool) {
      (particle.mesh.material as THREE.Material).dispose();
    }
  }
}
