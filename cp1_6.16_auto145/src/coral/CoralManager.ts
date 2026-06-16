import * as THREE from 'three';
import { useStore, CoralData, CoralSpeciesType } from '../store/useStore';
import { CoralSpecies, getGrowthMultiplier, getCoralColor, getLodGeometry } from './CoralSpecies';

interface CoralInstance {
  data: CoralData;
  group: THREE.Group;
  lodLevel: number;
  connectionLines: THREE.Line[];
}

export class CoralManager {
  private scene: THREE.Scene;
  private corals: Map<string, CoralInstance> = new Map();
  private placementPreview: THREE.Mesh | null = null;
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private mouse: THREE.Vector2 = new THREE.Vector2();
  private camera: THREE.PerspectiveCamera;
  private seaFloor: THREE.Mesh;
  private maxCoralsForLod: number = 200;

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, seaFloor: THREE.Mesh) {
    this.scene = scene;
    this.camera = camera;
    this.seaFloor = seaFloor;
    this.initPlacementPreview();
    this.setupEventListeners();
  }

  private initPlacementPreview(): void {
    const geometry = new THREE.RingGeometry(1.4, 1.5, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00FF7F,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    });

    this.placementPreview = new THREE.Mesh(geometry, material);
    this.placementPreview.rotation.x = -Math.PI / 2;
    this.placementPreview.visible = false;
    this.scene.add(this.placementPreview);
  }

  private setupEventListeners(): void {
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
    window.addEventListener('click', this.onClick.bind(this));
  }

  private onMouseMove(event: MouseEvent): void {
    if (!useStore.getState().isPlacementMode) return;

    const rect = (event.target as HTMLElement).getBoundingClientRect?.();
    if (!rect) return;

    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.updatePlacementPreview();
  }

  private onClick(event: MouseEvent): void {
    if (!useStore.getState().isPlacementMode) return;
    if ((event.target as HTMLElement).closest('.lil-gui')) return;

    this.placeCoral();
  }

  private updatePlacementPreview(): void {
    if (!this.placementPreview || !this.seaFloor) return;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObject(this.seaFloor);

    if (intersects.length > 0) {
      const point = intersects[0].point;
      this.placementPreview.position.set(point.x, point.y + 0.01, point.z);
      this.placementPreview.visible = true;

      const time = useStore.getState().time;
      const material = this.placementPreview.material as THREE.MeshBasicMaterial;
      material.opacity = 0.4 + Math.sin(time * 3) * 0.2;
    } else {
      this.placementPreview.visible = false;
    }
  }

  private placeCoral(): void {
    if (!this.placementPreview || !this.placementPreview.visible) return;

    const species = useStore.getState().selectedSpecies;
    const pos = this.placementPreview.position;

    this.createCoralColony(species, pos.x, pos.z);
  }

  public createCoralColony(species: CoralSpeciesType, x: number, z: number, initialAge: number = 0): void {
    const mainId = `coral_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const mainScale = Math.min(1, initialAge / 30);
    const mainBranches = Math.min(
      CoralSpecies[species].branchCount * 2,
      CoralSpecies[species].branchCount + Math.floor(initialAge / 5)
    );
    
    const mainCoral: CoralData = {
      id: mainId,
      species,
      position: { x, y: -5, z },
      age: initialAge,
      scale: mainScale,
      health: 1,
      branches: mainBranches,
      isSeedling: false,
    };

    useStore.getState().addCoral(mainCoral);
    this.createCoralMesh(mainCoral);

    const seedlingCount = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < seedlingCount; i++) {
      const angle = (i / seedlingCount) * Math.PI * 2 + Math.random() * 0.5;
      const distance = 2 + Math.random() * 2;
      const seedlingId = `coral_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const seedlingAge = Math.max(0, initialAge - 20);
      const seedlingScale = initialAge > 30 ? 0.2 + (seedlingAge / 120) * 0.6 : 0.2;

      const seedling: CoralData = {
        id: seedlingId,
        species,
        position: {
          x: x + Math.cos(angle) * distance,
          y: -5,
          z: z + Math.sin(angle) * distance,
        },
        age: seedlingAge,
        scale: seedlingScale,
        health: 1,
        branches: Math.floor(CoralSpecies[species].branchCount * 0.3) + Math.floor(seedlingAge / 10),
        isSeedling: true,
      };

      useStore.getState().addCoral(seedling);
      this.createCoralMesh(seedling);
    }
  }

  private createCoralMesh(coralData: CoralData): void {
    const group = new THREE.Group();
    
    for (let i = 0; i < coralData.branches; i++) {
      const branch = this.createBranch(coralData.species, coralData.age, i, coralData.branches);
      group.add(branch);
    }

    group.position.set(
      coralData.position.x,
      coralData.position.y,
      coralData.position.z
    );
    group.scale.setScalar(coralData.scale);

    const coralInstance: CoralInstance = {
      data: coralData,
      group,
      lodLevel: 0,
      connectionLines: [],
    };

    this.corals.set(coralData.id, coralInstance);
    this.scene.add(group);
  }

  private createBranch(
    species: CoralSpeciesType,
    age: number,
    index: number,
    totalBranches: number
  ): THREE.Group {
    const params = CoralSpecies[species];
    const group = new THREE.Group();

    const angle = (index / totalBranches) * Math.PI * 2;
    const heightFactor = Math.min(1, age / 120);
    
    const mainLength = params.branchLength * heightFactor;
    const mainRadius = 0.15 * (1 + heightFactor * 0.5);

    const mainGeometry = new THREE.CylinderGeometry(
      mainRadius * 0.6,
      mainRadius,
      mainLength,
      6
    );
    const color = getCoralColor(species, age, 1);
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color.r, color.g, color.b),
      roughness: 0.8,
      metalness: 0.1,
    });

    const mainBranch = new THREE.Mesh(mainGeometry, material);
    mainBranch.position.y = mainLength / 2;
    group.add(mainBranch);

    const branchCount = Math.floor(3 + Math.min(5, age / 20));
    for (let i = 0; i < branchCount; i++) {
      const subBranch = this.createSubBranch(species, age, i, branchCount, mainLength);
      group.add(subBranch);
    }

    group.rotation.y = angle;
    group.rotation.z = -0.3 + Math.random() * 0.2;
    group.rotation.x = 0.2 + Math.random() * 0.2;

    return group;
  }

  private createSubBranch(
    species: CoralSpeciesType,
    age: number,
    index: number,
    total: number,
    parentLength: number
  ): THREE.Group {
    const params = CoralSpecies[species];
    const group = new THREE.Group();

    const heightRatio = 0.3 + (index / total) * 0.6;
    const length = params.branchLength * 0.4 * Math.min(1, age / 60);
    const radius = 0.08 * (1 + heightRatio * 0.3);

    const geometry = new THREE.CylinderGeometry(radius * 0.5, radius, length, 5);
    const color = getCoralColor(species, age, 1);
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color.r, color.g, color.b),
      roughness: 0.8,
      metalness: 0.1,
    });

    const branch = new THREE.Mesh(geometry, material);
    branch.position.y = length / 2;
    group.add(branch);

    const sphereGeometry = new THREE.SphereGeometry(radius * 1.2, 8, 6);
    const tip = new THREE.Mesh(sphereGeometry, material);
    tip.position.y = length;
    group.add(tip);

    group.position.y = parentLength * heightRatio;
    group.rotation.z = 0.4 + Math.random() * 0.3;
    group.rotation.y = (index / total) * Math.PI * 2 + Math.random() * 0.5;

    return group;
  }

  public update(deltaTime: number): void {
    const env = useStore.getState().environment;
    const coralsData = useStore.getState().corals;

    this.updateLodLevels();

    for (const coralData of coralsData) {
      const coralInstance = this.corals.get(coralData.id);
      if (!coralInstance) continue;

      const growthMultiplier = getGrowthMultiplier(
        coralData.species,
        env.lightIntensity,
        env.waterTemperature
      );

      const competitionEffect = this.calculateCompetitionEffect(coralData);
      
      let newAge = coralData.age + deltaTime;
      let newScale = coralData.scale;
      let newHealth = coralData.health;
      let newBranches = coralData.branches;

      const growthRate = CoralSpecies[coralData.species].growthRate * 
        growthMultiplier * 
        competitionEffect.growth;

      if (newAge < 120) {
        const targetScale = coralData.isSeedling ? 
          0.2 + (newAge / 120) * 0.8 : 
          Math.min(1, newAge / 30);
        newScale += (targetScale - newScale) * growthRate * deltaTime;
      }

      newHealth = Math.max(0, Math.min(1, newHealth + competitionEffect.health * deltaTime));

      if (newAge > 30 && Math.floor(newAge / 5) > Math.floor(coralData.age / 5)) {
        const params = CoralSpecies[coralData.species];
        newBranches = Math.min(params.branchCount * 2, newBranches + 1);
      }

      useStore.getState().updateCoral(coralData.id, {
        age: newAge,
        scale: newScale,
        health: newHealth,
        branches: newBranches,
      });

      this.updateCoralVisual(coralInstance, newAge, newHealth, newScale);
    }

    this.updateConnections();

    if (this.placementPreview && useStore.getState().isPlacementMode) {
      const material = this.placementPreview.material as THREE.MeshBasicMaterial;
      material.opacity = 0.4 + Math.sin(useStore.getState().time * 3) * 0.2;
    }
  }

  private calculateCompetitionEffect(coralData: CoralData): { growth: number; health: number } {
    let growthMod = 1;
    let healthMod = 0;
    const coralsData = useStore.getState().corals;

    for (const other of coralsData) {
      if (other.id === coralData.id) continue;

      const dx = other.position.x - coralData.position.x;
      const dz = other.position.z - coralData.position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (other.species === coralData.species) {
        if (distance < 2) {
          growthMod *= 1.15;
        }
      } else {
        if (distance < 4) {
          growthMod *= 0.7;
          healthMod -= 0.005;
        }
      }
    }

    return { growth: growthMod, health: healthMod };
  }

  private updateCoralVisual(
    coralInstance: CoralInstance,
    age: number,
    health: number,
    scale: number
  ): void {
    coralInstance.group.scale.setScalar(scale);

    const color = getCoralColor(coralInstance.data.species, age, health);
    const colorObj = new THREE.Color(color.r, color.g, color.b);

    coralInstance.group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const material = child.material as THREE.MeshStandardMaterial;
        if (material.color) {
          material.color.copy(colorObj);
        }
      }
    });

    if (age > 120) {
      const fadeProgress = Math.min(1, (age - 120) / 60);
      coralInstance.group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const material = child.material as THREE.MeshStandardMaterial;
          const gray = new THREE.Color(0x888888);
          material.color.lerpColors(colorObj, gray, fadeProgress * 0.5);
        }
      });
    }
  }

  private updateConnections(): void {
    const coralsData = useStore.getState().corals;
    
    for (const coral of this.corals.values()) {
      for (const line of coral.connectionLines) {
        this.scene.remove(line);
        line.geometry.dispose();
        (line.material as THREE.Material).dispose();
      }
      coral.connectionLines = [];
    }

    for (let i = 0; i < coralsData.length; i++) {
      for (let j = i + 1; j < coralsData.length; j++) {
        const a = coralsData[i];
        const b = coralsData[j];

        if (a.species !== b.species) continue;

        const dx = b.position.x - a.position.x;
        const dz = b.position.z - a.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        if (distance < 2) {
          this.createConnectionLine(a, b);
        }
      }
    }
  }

  private createConnectionLine(a: CoralData, b: CoralData): void {
    const points = [];
    const segments = 8;
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = a.position.x + (b.position.x - a.position.x) * t;
      const z = a.position.z + (b.position.z - a.position.z) * t;
      const y = -5 + Math.sin(t * Math.PI) * 0.5;
      points.push(new THREE.Vector3(x, y, z));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.4,
    });

    const line = new THREE.Line(geometry, material);
    this.scene.add(line);

    const coralA = this.corals.get(a.id);
    const coralB = this.corals.get(b.id);
    
    if (coralA) coralA.connectionLines.push(line);
    if (coralB) coralB.connectionLines.push(line);
  }

  private updateLodLevels(): void {
    const coralCount = this.corals.size;
    
    if (coralCount <= this.maxCoralsForLod) {
      for (const coral of this.corals.values()) {
        if (coral.lodLevel !== 0) {
          this.updateCoralLod(coral, 0);
        }
      }
      return;
    }

    const cameraPos = this.camera.position;

    for (const coral of this.corals.values()) {
      const dx = coral.group.position.x - cameraPos.x;
      const dy = coral.group.position.y - cameraPos.y;
      const dz = coral.group.position.z - cameraPos.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      let targetLod = 0;
      if (distance > 30) targetLod = 1;
      if (distance > 50) targetLod = 2;

      if (coral.lodLevel !== targetLod) {
        this.updateCoralLod(coral, targetLod);
      }
    }
  }

  private updateCoralLod(coral: CoralInstance, lodLevel: number): void {
    coral.lodLevel = lodLevel;

    while (coral.group.children.length > 0) {
      const child = coral.group.children[0];
      coral.group.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      }
    }

    const lodInfo = getLodGeometry(coral.data.species, lodLevel);
    
    const branchCount = lodInfo.branchCount;
    
    for (let i = 0; i < branchCount; i++) {
      const branch = this.createLodBranch(coral.data.species, coral.data.age, i, branchCount, lodInfo.segments);
      coral.group.add(branch);
    }
  }

  private createLodBranch(
    species: CoralSpeciesType,
    age: number,
    index: number,
    totalBranches: number,
    segments: number
  ): THREE.Group {
    const params = CoralSpecies[species];
    const group = new THREE.Group();

    const angle = (index / totalBranches) * Math.PI * 2;
    const heightFactor = Math.min(1, age / 120);
    
    const length = params.branchLength * heightFactor;
    const radius = 0.15 * (1 + heightFactor * 0.5);

    const geometry = new THREE.ConeGeometry(radius, length, Math.max(3, segments));
    const color = getCoralColor(species, age, 1);
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color.r, color.g, color.b),
      roughness: 0.8,
      metalness: 0.1,
    });

    const branch = new THREE.Mesh(geometry, material);
    branch.position.y = length / 2;
    group.add(branch);

    group.rotation.y = angle;
    group.rotation.z = -0.3;

    return group;
  }

  public getCoralTransforms(): Map<string, { position: THREE.Vector3; scale: number; species: CoralSpeciesType }> {
    const transforms = new Map();
    
    for (const [id, coral] of this.corals) {
      transforms.set(id, {
        position: coral.group.position.clone(),
        scale: coral.group.scale.x,
        species: coral.data.species,
      });
    }
    
    return transforms;
  }

  public removeCoral(id: string): void {
    const coral = this.corals.get(id);
    if (!coral) return;

    for (const line of coral.connectionLines) {
      this.scene.remove(line);
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    }

    coral.group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      }
    });

    this.scene.remove(coral.group);
    this.corals.delete(id);
    useStore.getState().removeCoral(id);
  }

  public getCoralCount(): number {
    return this.corals.size;
  }

  public dispose(): void {
    for (const [id] of this.corals) {
      this.removeCoral(id);
    }
    
    if (this.placementPreview) {
      this.placementPreview.geometry.dispose();
      (this.placementPreview.material as THREE.Material).dispose();
      this.scene.remove(this.placementPreview);
    }

    window.removeEventListener('mousemove', this.onMouseMove.bind(this));
    window.removeEventListener('click', this.onClick.bind(this));
  }
}
