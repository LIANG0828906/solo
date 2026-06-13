import * as THREE from 'three';
import { buildingData, BUILDING_COLORS, gridConfig, BuildingData, BuildingFunction } from '../data/buildingData';

interface BuildingMeshGroup extends THREE.Group {
  buildingId: string;
  baseColor: number;
  originalColor: number;
  highlightTarget: number;
  windows: THREE.Mesh[];
  windowLights: boolean;
}

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  buildingId: string;
}

export class Visualizer {
  private scene: THREE.Scene;
  private buildings: Map<string, BuildingMeshGroup> = new Map();
  private particles: Particle[] = [];
  private ground: THREE.Mesh | null = null;
  private streets: THREE.Mesh | null = null;
  private buildingHeightAnimations: Map<string, { startTime: number; duration: number; type: 'highlight' | 'reset' }> = new Map();
  private particleGeometry: THREE.SphereGeometry;
  private timeOfDay: number = 12;
  private ambientLight: THREE.AmbientLight | null = null;
  private directionalLight: THREE.DirectionalLight | null = null;
  private hemisphereLight: THREE.HemisphereLight | null = null;
  private dayColor: THREE.Color = new THREE.Color(0xfff4e0);
  private nightColor: THREE.Color = new THREE.Color(0x1a2a4a);
  private sunLight: THREE.DirectionalLight | null = null;
  private windowMaterialTemplate: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0 });
  private windowOffMaterial: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({ color: 0x1a2a3a });

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.particleGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    this.initLights();
    this.createGround();
    this.createBuildings();
  }

  private initLights(): void {
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(this.ambientLight);

    this.hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x556b2f, 0.3);
    this.scene.add(this.hemisphereLight);

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    this.directionalLight.position.set(50, 100, 50);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.set(2048, 2048);
    this.directionalLight.shadow.camera.left = -150;
    this.directionalLight.shadow.camera.right = 150;
    this.directionalLight.shadow.camera.top = 150;
    this.directionalLight.shadow.camera.bottom = -150;
    this.scene.add(this.directionalLight);
    
    this.sunLight = new THREE.DirectionalLight(0xffeedd, 0.5);
    this.sunLight.position.set(-30, 50, -30);
    this.scene.add(this.sunLight);
  }

  private createGround(): void {
    const totalSize = gridConfig.totalSize + 40;
    
    const groundGeometry = new THREE.PlaneGeometry(totalSize, totalSize);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x2c3e50,
      roughness: 0.9,
      metalness: 0.1
    });
    this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.y = -0.1;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);

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
    group.highlightTarget = BUILDING_COLORS[data.function];
    group.windows = [];
    group.windowLights = false;

    const width = gridConfig.buildingSpacing * 0.7;
    const depth = gridConfig.buildingSpacing * 0.7;
    const height = data.height;

    const mainGeometry = new THREE.BoxGeometry(width, height, depth);
    const mainMaterial = new THREE.MeshStandardMaterial({
      color: BUILDING_COLORS[data.function],
      roughness: 0.7,
      metalness: 0.3,
    });
    const mainMesh = new THREE.Mesh(mainGeometry, mainMaterial);
    mainMesh.position.y = height / 2;
    mainMesh.castShadow = true;
    mainMesh.receiveShadow = true;
    (group as any).mainMesh = mainMesh;
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

    const windowRowsV = windowHeight;
    const windowSpacingV = (height * 0.7) / windowRows;
    const windowSpacingH = (width * 0.6) / (windowCols - 1);

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

        const frontWindow = new THREE.Mesh(
          new THREE.BoxGeometry(windowWidth, windowHeight, windowDepth),
          winMat
        );
        frontWindow.position.set(
          -width * 0.3 + col * windowSpacingH,
          height * 0.2 + row * windowSpacingV,
          depth / 2 + 0.05
        );
        group.add(frontWindow);
        if (isLit) group.windows.push(frontWindow);

        const backWindow = new THREE.Mesh(
          new THREE.BoxGeometry(windowWidth, windowHeight, windowDepth),
          isLit ? winMat.clone() : winMat
        );
        backWindow.position.set(
          -width * 0.3 + col * windowSpacingH,
          height * 0.2 + row * windowSpacingV,
          -depth / 2 - 0.05
        );
        group.add(backWindow);
        if (isLit) group.windows.push(backWindow);

        const leftWindow = new THREE.Mesh(
          new THREE.BoxGeometry(windowDepth, windowHeight, windowWidth),
          isLit ? winMat.clone() : winMat
        );
        leftWindow.position.set(
          -width / 2 - 0.05,
          height * 0.2 + row * windowSpacingV,
          -depth * 0.3 + col * (depth * 0.6 / (windowCols - 1))
        );
        group.add(leftWindow);
        if (isLit) group.windows.push(leftWindow);

        const rightWindow = new THREE.Mesh(
          new THREE.BoxGeometry(windowDepth, windowHeight, windowWidth),
          isLit ? winMat.clone() : winMat
        );
        rightWindow.position.set(
          width / 2 + 0.05,
          height * 0.2 + row * windowSpacingV,
          -depth * 0.3 + col * (depth * 0.6 / (windowCols - 1))
        );
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
      });
      const spire = new THREE.Mesh(spireGeometry, spireMaterial);
      spire.position.y = height + height * 0.15;
      spire.rotation.y = data.roofRotation;
      spire.castShadow = true;
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
      });
      const flatRoof = new THREE.Mesh(flatGeometry, flatMaterial);
      flatRoof.position.y = height + 0.75;
      flatRoof.castShadow = true;
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
        });
        const decor = new THREE.Mesh(decorGeometry, decorMaterial);
        decor.position.set(
          (Math.random() - 0.5) * width * 0.5,
          height + 3,
          (Math.random() - 0.5) * depth * 0.5
        );
        decor.castShadow = true;
        group.add(decor);
      }
    }
  }

  highlightBuilding(buildingId: string): void {
    const building = this.buildings.get(buildingId);
    if (!building) return;

    building.highlightTarget = 0xffffff;
    this.buildingHeightAnimations.set(buildingId, {
      startTime: performance.now(),
      duration: 300,
      type: 'highlight'
    });

    this.spawnParticles(buildingId);
  }

  resetHighlight(buildingId: string): void {
    const building = this.buildings.get(buildingId);
    if (!building) return;

    building.highlightTarget = building.originalColor;
    this.buildingHeightAnimations.set(buildingId, {
      startTime: performance.now(),
      duration: 300,
      type: 'reset'
    });
  }

  private spawnParticles(buildingId: string): void {
    const building = this.buildings.get(buildingId);
    const data = buildingData.find(b => b.id === buildingId);
    if (!building || !data) return;

    const color = BUILDING_COLORS[data.function];
    const particleCount = 15;

    for (let i = 0; i < particleCount; i++) {
      const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.7,
      });

      const mesh = new THREE.Mesh(this.particleGeometry, material);
      const width = gridConfig.buildingSpacing * 0.3;
      mesh.position.set(
        building.position.x + (Math.random() - 0.5) * width,
        0,
        building.position.z + (Math.random() - 0.5) * width
      );
      mesh.scale.setScalar(0.5 + Math.random() * 0.5, 0.5 + Math.random() * 0.5, 0.5 + Math.random() * 0.5);

      const particle: Particle = {
        mesh,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.5,
          8 + Math.random() * 5,
          (Math.random() - 0.5) * 0.5
        ),
        life: 1.5,
        maxLife: 1.5,
        buildingId,
      };

      this.particles.push(particle);
      this.scene.add(mesh);
    }
  }

  update(deltaTime: number): void {
    const now = performance.now();

    for (const [buildingId, anim] of this.buildingHeightAnimations) {
      const building = this.buildings.get(buildingId);
      if (!building) continue;

      const elapsed = now - anim.startTime;
      const progress = Math.min(elapsed / anim.duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      const startColor = new THREE.Color(building.baseColor);
      const targetColor = new THREE.Color(building.highlightTarget);
      const currentColor = startColor.clone().lerp(targetColor, eased);

      this.setBuildingColor(building, currentColor);

      if (progress >= 1) {
        building.baseColor = building.highlightTarget;
        this.buildingHeightAnimations.delete(buildingId);
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.life -= deltaTime;

      if (particle.life <= 0) {
        this.scene.remove(particle.mesh);
        (particle.mesh.material as THREE.Material).dispose();
        this.particles.splice(i, 1);
        continue;
      }

      particle.mesh.position.add(
        particle.velocity.clone().multiplyScalar(deltaTime)
      );

      const opacity = (particle.life / particle.maxLife) * 0.7;
      (particle.mesh.material as THREE.MeshBasicMaterial).opacity = opacity;
    }
  }

  private setBuildingColor(building: BuildingMeshGroup, color: THREE.Color): void {
    building.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const mat = child.material as THREE.MeshStandardMaterial;
        if (mat.isMeshStandardMaterial && mat.color) {
          if (building.windows.includes(child)) return;
          mat.color.copy(color);
        }
      }
    });
  }

  setTimeOfDay(hour: number): void {
    this.timeOfDay = hour;

    const dayFactor = this.calculateDayFactor(hour);

    if (this.ambientLight) {
      this.ambientLight.intensity = 0.2 + dayFactor * 0.3;
    }

    if (this.directionalLight) {
      this.directionalLight.intensity = 0.3 + dayFactor * 0.7;
    }

    if (this.hemisphereLight) {
      this.hemisphereLight.intensity = 0.2 + dayFactor * 0.3;
    }

    const skyColor = this.nightColor.clone().lerp(this.dayColor, dayFactor);
    this.scene.background = skyColor;

    if (this.directionalLight) {
      const sunAngle = (hour - 6) / 12 * Math.PI;
      const sunHeight = Math.sin(sunAngle) * 100;
      const sunDist = Math.cos(sunAngle) * 80;
      this.directionalLight.position.set(sunDist, Math.max(10, sunHeight), 50);
    }

    const windowLightIntensity = 1 - dayFactor;
    this.updateWindowLights(windowLightIntensity);
  }

  private calculateDayFactor(hour: number): number {
    if (hour >= 6 && hour <= 18) {
      const midday = 12;
      const dist = Math.abs(hour - midday) / 6;
      return 1 - dist * 0.3;
    } else if (hour > 18 && hour < 20) {
      return (20 - hour) / 2 * 0.7;
    } else if (hour >= 5 && hour < 6) {
      return (hour - 5) / 1 * 0.7;
    } else {
      return 0.1;
    }
  }

  private updateWindowLights(intensity: number): void {
    for (const building of this.buildings.values()) {
      for (const window of building.windows) {
        const mat = window.material as THREE.MeshBasicMaterial;
        if (mat.opacity !== undefined) {
          mat.opacity = Math.max(0.1, intensity * 0.9);
        }
      }
    }
  }

  getBuildingByMesh(mesh: THREE.Object3D): string | null {
    let current: THREE.Object3D | null = mesh;
    while (current) {
      if ((current as any).buildingId) {
        return (current as any).buildingId;
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
}
