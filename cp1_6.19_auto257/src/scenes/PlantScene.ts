import * as THREE from 'three';
import { useSeasonStore } from '../store/seasonStore';
import { Season, PlantType, plantColors, lerpColor } from '../utils/colorPalette';

export interface PlantObject {
  group: THREE.Group;
  type: PlantType;
  flowerMesh: THREE.Mesh;
  leafMeshes: THREE.Mesh[];
  fruitMesh: THREE.Mesh;
  centerPosition: THREE.Vector3;
}

export class PlantScene {
  private scene: THREE.Scene;
  private plants: PlantObject[] = [];
  private flowerPetalCount = 8;
  private leafCount = 12;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.createPlants();
    this.createDecorativeRings();
    this.createGround();
  }

  private createGround(): void {
    const groundGeometry = new THREE.CircleGeometry(15, 64);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d3436,
      roughness: 0.9,
      metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  private createDecorativeRings(): void {
    for (let i = 0; i < 5; i++) {
      const radius = 4 + i * 2.5;
      const ringGeometry = new THREE.RingGeometry(radius - 0.02, radius, 128);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.1,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = -0.49;
      this.scene.add(ring);
    }
  }

  private createPlant(type: PlantType, position: THREE.Vector3): PlantObject {
    const group = new THREE.Group();
    group.position.copy(position);

    const trunkGeometry = new THREE.CylinderGeometry(0.15, 0.2, 1.5, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a3728,
      roughness: 0.9
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 0.75;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    group.add(trunk);

    const flowerGroup = new THREE.Group();
    flowerGroup.position.y = 2.2;
    
    const petalGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    const flowerColor = plantColors[type].flower[Season.SPRING];
    const flowerMaterial = new THREE.MeshStandardMaterial({
      color: flowerColor,
      roughness: 0.4,
      metalness: 0.1,
      side: THREE.DoubleSide
    });

    for (let i = 0; i < this.flowerPetalCount; i++) {
      const angle = (i / this.flowerPetalCount) * Math.PI * 2;
      const petal = new THREE.Mesh(petalGeometry, flowerMaterial.clone());
      petal.position.x = Math.cos(angle) * 0.25;
      petal.position.z = Math.sin(angle) * 0.25;
      petal.scale.set(0.5, 0.2, 0.5);
      flowerGroup.add(petal);
    }

    const centerGeometry = new THREE.SphereGeometry(0.2, 12, 12);
    const centerMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      roughness: 0.3
    });
    const flowerCenter = new THREE.Mesh(centerGeometry, centerMaterial);
    flowerGroup.add(flowerCenter);

    group.add(flowerGroup);

    const leafMeshes: THREE.Mesh[] = [];
    const leafColor = plantColors[type].leaf[Season.SPRING];
    
    for (let i = 0; i < this.leafCount; i++) {
      const leafGeometry = new THREE.SphereGeometry(0.4, 8, 6);
      leafGeometry.scale(1, 0.3, 0.8);
      const leafMaterial = new THREE.MeshStandardMaterial({
        color: leafColor,
        roughness: 0.6,
        side: THREE.DoubleSide
      });
      const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
      
      const height = 0.8 + Math.random() * 1.2;
      const angle = Math.random() * Math.PI * 2;
      const distance = 0.3 + Math.random() * 0.4;
      
      leaf.position.set(
        Math.cos(angle) * distance,
        height,
        Math.sin(angle) * distance
      );
      leaf.rotation.set(
        Math.random() * 0.5,
        angle,
        Math.random() * 0.3
      );
      leaf.castShadow = true;
      leaf.receiveShadow = true;
      
      leafMeshes.push(leaf);
      group.add(leaf);
    }

    const fruitGeometry = new THREE.SphereGeometry(0.25, 12, 12);
    const fruitColor = plantColors[type].fruit[Season.SPRING];
    const fruitMaterial = new THREE.MeshStandardMaterial({
      color: fruitColor,
      roughness: 0.5
    });
    const fruit = new THREE.Mesh(fruitGeometry, fruitMaterial);
    fruit.position.set(0.2, 1.8, 0.1);
    fruit.castShadow = true;
    group.add(fruit);

    group.userData = { plantType: type };

    return {
      group,
      type,
      flowerMesh: flowerCenter,
      leafMeshes,
      fruitMesh: fruit,
      centerPosition: position.clone().add(new THREE.Vector3(0, 1.5, 0))
    };
  }

  private createPlants(): void {
    const plantPositions = [
      { type: PlantType.CHERRY_BLOSSOM, pos: new THREE.Vector3(-5, 0, -3) },
      { type: PlantType.SUNFLOWER, pos: new THREE.Vector3(5, 0, -2) },
      { type: PlantType.GINKGO, pos: new THREE.Vector3(4, 0, 4) },
      { type: PlantType.MAPLE, pos: new THREE.Vector3(-4, 0, 3) }
    ];

    plantPositions.forEach(({ type, pos }) => {
      const plant = this.createPlant(type, pos);
      this.plants.push(plant);
      this.scene.add(plant.group);
    });
  }

  public update(deltaTime: number): void {
    const { currentSeason, plantParams, transitionProgress } = useSeasonStore.getState();
    const nextSeason = (currentSeason + 1) % 4 as Season;

    this.plants.forEach((plant) => {
      const params = plantParams[plant.type];
      const currentColors = plantColors[plant.type];
      const nextColors = plantColors[plant.type];

      const flowerGroup = plant.group.children[1] as THREE.Group;
      const openness = params.openness;
      
      flowerGroup.children.forEach((petal, index) => {
        if (index < this.flowerPetalCount) {
          const angle = (index / this.flowerPetalCount) * Math.PI * 2;
          const baseDistance = 0.25;
          const targetDistance = baseDistance + openness * 0.3;
          petal.position.x = Math.cos(angle) * targetDistance;
          petal.position.z = Math.sin(angle) * targetDistance;
          petal.scale.set(0.5 * openness + 0.1, 0.2 * openness + 0.05, 0.5 * openness + 0.1);
          
          const material = (petal as THREE.Mesh).material as THREE.MeshStandardMaterial;
          const currentFlowerColor = currentColors.flower[currentSeason];
          const nextFlowerColor = nextColors.flower[nextSeason];
          material.color.set(lerpColor(currentFlowerColor, nextFlowerColor, transitionProgress));
          material.opacity = openness;
          material.transparent = true;
        }
      });

      const currentLeafColor = currentColors.leaf[currentSeason];
      const nextLeafColor = nextColors.leaf[nextSeason];
      const leafColor = lerpColor(currentLeafColor, nextLeafColor, transitionProgress);

      plant.leafMeshes.forEach((leaf, index) => {
        const material = leaf.material as THREE.MeshStandardMaterial;
        material.color.set(leafColor);
        
        const fallAmount = params.leafFallAmount;
        const shouldFall = index < this.leafCount * fallAmount;
        
        if (shouldFall) {
          material.opacity = Math.max(0, 1 - fallAmount * 1.5);
          material.transparent = true;
          leaf.position.y -= deltaTime * 0.5 * fallAmount;
          if (leaf.position.y < -0.5) {
            leaf.visible = false;
          }
        } else {
          leaf.visible = true;
          material.opacity = 1;
          material.transparent = false;
        }
      });

      const fruitScale = params.fruitScale;
      plant.fruitMesh.scale.setScalar(fruitScale);
      const fruitMaterial = plant.fruitMesh.material as THREE.MeshStandardMaterial;
      const currentFruitColor = currentColors.fruit[currentSeason];
      const nextFruitColor = nextColors.fruit[nextSeason];
      fruitMaterial.color.set(lerpColor(currentFruitColor, nextFruitColor, transitionProgress));
    });
  }

  public getPlants(): PlantObject[] {
    return this.plants;
  }

  public getPlantPositions(): Record<PlantType, THREE.Vector3> {
    const positions: Partial<Record<PlantType, THREE.Vector3>> = {};
    this.plants.forEach((plant) => {
      positions[plant.type] = plant.centerPosition.clone();
    });
    return positions as Record<PlantType, THREE.Vector3>;
  }

  public getPlantByType(type: PlantType): PlantObject | undefined {
    return this.plants.find((p) => p.type === type);
  }

  public getPlantByGroup(group: THREE.Group): PlantObject | undefined {
    return this.plants.find((p) => p.group === group);
  }

  public raycast(raycaster: THREE.Raycaster): PlantObject | null {
    const intersects = raycaster.intersectObjects(
      this.plants.map((p) => p.group),
      true
    );
    
    if (intersects.length > 0) {
      let obj = intersects[0].object;
      while (obj.parent && obj.parent !== this.scene) {
        obj = obj.parent;
      }
      return this.getPlantByGroup(obj as THREE.Group) || null;
    }
    return null;
  }

  public dispose(): void {
    this.plants.forEach((plant) => {
      this.scene.remove(plant.group);
      plant.group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    });
    this.plants = [];
  }
}
