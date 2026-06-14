import * as THREE from 'three';
import { SceneManager } from './sceneManager';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {
  IBuilding,
  BuildingStyle,
  BuildingStyleConfig,
  GROWTH_INTERVAL,
  FLOOR_HEIGHT,
  GRID_SIZE,
  CELL_SIZE,
  MAX_BUILDINGS_BEFORE_MERGE,
  BUILDING_BASE_WIDTH,
  BUILDING_BASE_DEPTH,
  PUSH_RADIUS,
  PUSH_FORCE,
  STYLE_CONFIGS,
  generateBuildingId,
  getRandomStyle,
  getRandomFloors,
  gridToWorld,
} from '../models/buildingConfig';

export class BuildingManager {
  buildings: IBuilding[] = [];
  sceneManager: SceneManager;
  private occupiedCells: Set<string> = new Set();
  private lodMergedMesh: THREE.Mesh | null = null;
  private isMerged: boolean = false;

  constructor(sceneManager: SceneManager) {
    this.sceneManager = sceneManager;
  }

  placeBuilding(gridX: number, gridZ: number): IBuilding | null {
    const cellKey = `${gridX},${gridZ}`;
    if (this.occupiedCells.has(cellKey)) {
      return null;
    }

    const style = getRandomStyle();
    const targetFloors = getRandomFloors();
    const targetHeight = targetFloors * FLOOR_HEIGHT;
    const worldPos = gridToWorld(gridX, gridZ);

    const buildingGroup = new THREE.Group();
    buildingGroup.position.set(worldPos.x, 0, worldPos.z);
    buildingGroup.scale.y = 0.01;

    const building: IBuilding = {
      id: generateBuildingId(),
      position: { x: worldPos.x, z: worldPos.z },
      targetHeight,
      currentHeight: 0,
      style,
      isGrowing: false,
      isComplete: false,
      mesh: buildingGroup,
      floors: [],
      windowLights: [],
      growthProgress: 0,
      lastGrowthTime: 0,
      targetFloor: targetFloors,
      currentFloor: 0,
      spawnAnimation: {
        startTime: Date.now(),
        duration: 800,
        isComplete: false
      },
      pushOffset: { x: 0, z: 0 },
      lodLevel: 0
    };

    this.createBuildingGeometry(building);
    this.sceneManager.getScene().add(buildingGroup);
    this.buildings.push(building);
    this.occupiedCells.add(cellKey);

    this.pushNearbyBuildings(worldPos.x, worldPos.z, building.id);
    this.sceneManager.focusOnPosition(worldPos.x, worldPos.z, targetHeight);

    setTimeout(() => {
      building.spawnAnimation.isComplete = true;
      building.isGrowing = true;
      building.lastGrowthTime = Date.now();
    }, 800);

    setTimeout(() => {
      this.checkAndMergeLOD();
    }, 100);

    return building;
  }

  private createBuildingGeometry(building: IBuilding): void {
    const styleConfig = STYLE_CONFIGS[building.style];
    const baseWidth = BUILDING_BASE_WIDTH + Math.random() * 0.3;
    const baseDepth = BUILDING_BASE_DEPTH + Math.random() * 0.3;

    for (let i = 0; i < building.targetFloor; i++) {
      const floorHeight = FLOOR_HEIGHT;
      const widthVariation = 1 - (i / building.targetFloor) * 0.15;
      const floorWidth = baseWidth * widthVariation;
      const floorDepth = baseDepth * widthVariation;

      const floorGeometry = new THREE.BoxGeometry(floorWidth, floorHeight * 0.95, floorDepth);
      const floorMaterial = this.createFloorMaterial(styleConfig);
      const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
      floorMesh.position.y = i * floorHeight + floorHeight / 2;
      floorMesh.castShadow = true;
      floorMesh.receiveShadow = true;
      floorMesh.visible = false;

      const edgesGeometry = new THREE.EdgesGeometry(floorGeometry);
      const edgesMaterial = new THREE.LineBasicMaterial({
        color: styleConfig.edgeColor,
        transparent: true,
        opacity: 0.8
      });
      const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
      edges.position.copy(floorMesh.position);
      edges.visible = false;

      const windowLights = this.createWindowLights(floorWidth, floorHeight, floorDepth, i, building.targetFloor, styleConfig);
      windowLights.forEach(light => {
        light.visible = false;
        building.windowLights.push(light);
        building.mesh.add(light);
      });

      building.floors.push(floorMesh);
      building.mesh.add(floorMesh);
      building.mesh.add(edges);
    }

    this.createBeaconLight(building, styleConfig);
    this.createBuildingBase(building, styleConfig);
  }

  private createFloorMaterial(styleConfig: BuildingStyleConfig): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: styleConfig.bodyColor,
      roughness: styleConfig.roughness,
      metalness: styleConfig.metalness,
      envMapIntensity: 0.5
    });
  }

  private createWindowLights(
    width: number,
    height: number,
    depth: number,
    floorIndex: number,
    totalFloors: number,
    styleConfig: BuildingStyleConfig
  ): THREE.Mesh[] {
    const lights: THREE.Mesh[] = [];
    const windowSize = 0.2;
    const windowSpacing = 0.4;
    const yOffset = floorIndex * FLOOR_HEIGHT + FLOOR_HEIGHT / 2;

    const windowMaterial = new THREE.MeshBasicMaterial({
      color: styleConfig.windowColor,
      transparent: true,
      opacity: 0
    });

    for (let side = 0; side < 4; side++) {
      const isFrontBack = side < 2;
      const maxWindows = Math.floor((isFrontBack ? width : depth) / windowSpacing) - 1;
      
      for (let w = 0; w < maxWindows; w++) {
        if (Math.random() > 0.7) continue;
        
        const windowGeo = new THREE.PlaneGeometry(windowSize, windowSize * 1.5);
        const windowMesh = new THREE.Mesh(windowGeo, windowMaterial.clone());
        
        const offset = (w - (maxWindows - 1) / 2) * windowSpacing;
        
        if (side === 0) {
          windowMesh.position.set(offset, yOffset, depth / 2 + 0.01);
        } else if (side === 1) {
          windowMesh.position.set(offset, yOffset, -depth / 2 - 0.01);
          windowMesh.rotation.y = Math.PI;
        } else if (side === 2) {
          windowMesh.position.set(width / 2 + 0.01, yOffset, offset);
          windowMesh.rotation.y = Math.PI / 2;
        } else {
          windowMesh.position.set(-width / 2 - 0.01, yOffset, offset);
          windowMesh.rotation.y = -Math.PI / 2;
        }
        
        lights.push(windowMesh);
      }
    }

    return lights;
  }

  private createBeaconLight(building: IBuilding, styleConfig: BuildingStyleConfig): void {
    const beaconY = building.targetHeight + 1;
    
    const beaconGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const beaconMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0
    });
    const beaconMesh = new THREE.Mesh(beaconGeometry, beaconMaterial);
    beaconMesh.position.y = beaconY;
    beaconMesh.visible = false;
    
    const beaconLight = new THREE.PointLight(0xffff00, 0, 15);
    beaconLight.position.y = beaconY;
    beaconLight.castShadow = false;

    building.beaconLight = beaconLight;
    building.beaconMesh = beaconMesh;
    building.mesh.add(beaconMesh);
    building.mesh.add(beaconLight);

    const supportGeometry = new THREE.CylinderGeometry(0.05, 0.08, 1, 8);
    const supportMaterial = new THREE.MeshStandardMaterial({
      color: styleConfig.edgeColor,
      metalness: 0.9,
      roughness: 0.2
    });
    const supportMesh = new THREE.Mesh(supportGeometry, supportMaterial);
    supportMesh.position.y = beaconY - 0.5;
    supportMesh.visible = false;
    building.mesh.add(supportMesh);
  }

  private createBuildingBase(building: IBuilding, styleConfig: BuildingStyleConfig): void {
    const baseGeometry = new THREE.BoxGeometry(
      BUILDING_BASE_WIDTH * 1.2,
      0.3,
      BUILDING_BASE_DEPTH * 1.2
    );
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(styleConfig.bodyColor).multiplyScalar(0.5),
      roughness: 0.9,
      metalness: 0.1
    });
    const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
    baseMesh.position.y = 0.15;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    
    const baseEdges = new THREE.EdgesGeometry(baseGeometry);
    const baseEdgesMaterial = new THREE.LineBasicMaterial({
      color: styleConfig.edgeColor,
      transparent: true,
      opacity: 0.6
    });
    const baseEdgesMesh = new THREE.LineSegments(baseEdges, baseEdgesMaterial);
    baseEdgesMesh.position.y = 0.15;
    
    building.mesh.add(baseMesh);
    building.mesh.add(baseEdgesMesh);
  }

  updateGrowth(deltaTime: number): void {
    const now = Date.now();

    for (const building of this.buildings) {
      if (!building.spawnAnimation.isComplete) {
        const spawnProgress = Math.min((now - building.spawnAnimation.startTime) / building.spawnAnimation.duration, 1);
        const eased = this.elasticOut(spawnProgress);
        building.mesh.scale.y = eased;
      }

      if (building.pushOffset.x !== 0 || building.pushOffset.z !== 0) {
        building.pushOffset.x *= 0.95;
        building.pushOffset.z *= 0.95;
        if (Math.abs(building.pushOffset.x) < 0.001) building.pushOffset.x = 0;
        if (Math.abs(building.pushOffset.z) < 0.001) building.pushOffset.z = 0;
        
        building.mesh.position.x = building.position.x + building.pushOffset.x;
        building.mesh.position.z = building.position.z + building.pushOffset.z;
      }

      if (building.isGrowing && !building.isComplete) {
        if (now - building.lastGrowthTime >= GROWTH_INTERVAL && building.currentFloor < building.targetFloor) {
          this.addFloor(building);
          building.lastGrowthTime = now;
        }

        const targetHeight = building.currentFloor * FLOOR_HEIGHT;
        building.currentHeight += (targetHeight - building.currentHeight) * 0.1;
      }
    }
  }

  private addFloor(building: IBuilding): void {
    if (building.currentFloor >= building.targetFloor) {
      building.isComplete = true;
      building.isGrowing = false;
      this.activateBeaconLight(building);
      return;
    }

    const floorMesh = building.floors[building.currentFloor];
    if (floorMesh) {
      floorMesh.visible = true;
      floorMesh.scale.set(0.8, 0.8, 0.8);
      
      const edges = building.mesh.children.find(
        child => child instanceof THREE.LineSegments && 
        Math.abs(child.position.y - floorMesh.position.y) < 0.1
      ) as THREE.LineSegments;
      
      if (edges) {
        edges.visible = true;
      }

      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / 300, 1);
        const scale = 0.8 + progress * 0.2;
        floorMesh.scale.set(scale, scale, scale);
        
        const mat = floorMesh.material as THREE.MeshStandardMaterial;
        mat.emissive = new THREE.Color(STYLE_CONFIGS[building.style].edgeColor);
        mat.emissiveIntensity = (1 - progress) * 0.5;
        
        if (edges) {
          const edgeMat = edges.material as THREE.LineBasicMaterial;
          edgeMat.opacity = 0.4 + progress * 0.4;
        }
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          mat.emissiveIntensity = 0;
        }
      };
      animate();
    }

    building.currentFloor++;
    building.growthProgress = building.currentFloor / building.targetFloor;
  }

  private activateBeaconLight(building: IBuilding): void {
    if (building.beaconLight && building.beaconMesh) {
      building.beaconLight.visible = true;
      building.beaconMesh.visible = true;
      
      const startTime = Date.now();
      const duration = 1000;
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        
        building.beaconLight!.intensity = eased * 2;
        (building.beaconMesh!.material as THREE.MeshBasicMaterial).opacity = eased;
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      animate();
    }
  }

  private pushNearbyBuildings(centerX: number, centerZ: number, excludeId: string): void {
    for (const building of this.buildings) {
      if (building.id === excludeId) continue;
      
      const dx = building.position.x - centerX;
      const dz = building.position.z - centerZ;
      const distance = Math.sqrt(dx * dx + dz * dz);
      
      if (distance < PUSH_RADIUS && distance > 0) {
        const force = (1 - distance / PUSH_RADIUS) * PUSH_FORCE;
        const normalizedDx = dx / distance;
        const normalizedDz = dz / distance;
        
        building.pushOffset.x += normalizedDx * force;
        building.pushOffset.z += normalizedDz * force;
      }
    }
  }

  checkAndMergeLOD(): void {
    if (this.buildings.length < MAX_BUILDINGS_BEFORE_MERGE) {
      if (this.isMerged && this.lodMergedMesh) {
        this.sceneManager.getScene().remove(this.lodMergedMesh);
        this.lodMergedMesh.geometry.dispose();
        (this.lodMergedMesh.material as THREE.Material).dispose();
        this.lodMergedMesh = null;
        this.isMerged = false;
        
        for (const building of this.buildings) {
          building.mesh.visible = true;
        }
      }
      return;
    }

    if (this.isMerged) return;

    const geometries: THREE.BufferGeometry[] = [];
    const matrix = new THREE.Matrix4();

    for (const building of this.buildings) {
      if (building.isComplete && building.lodLevel === 0) {
        building.mesh.updateMatrixWorld(true);
        
        building.floors.forEach((floor, index) => {
          if (floor.visible) {
            const clonedGeo = floor.geometry.clone();
            matrix.copy(floor.matrixWorld);
            clonedGeo.applyMatrix4(matrix);
            geometries.push(clonedGeo);
          }
        });

        building.lodLevel = 1;
      }
    }

    if (geometries.length > 0) {
      const mergedGeometry = mergeGeometries(geometries);

      const mergedMaterial = new THREE.MeshStandardMaterial({
        color: 0x2a2a4a,
        roughness: 0.5,
        metalness: 0.5
      });

      this.lodMergedMesh = new THREE.Mesh(mergedGeometry, mergedMaterial);
      this.lodMergedMesh.castShadow = true;
      this.lodMergedMesh.receiveShadow = true;
      this.sceneManager.getScene().add(this.lodMergedMesh);
      this.isMerged = true;

      for (const building of this.buildings) {
        if (building.lodLevel === 1) {
          building.mesh.visible = false;
        }
      }

      geometries.forEach(geo => geo.dispose());
    }
  }

  private mergeGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
    const merged = new THREE.BufferGeometry();
    let vertexCount = 0;
    let indexCount = 0;

    geometries.forEach(geo => {
      vertexCount += geo.attributes.position.count;
      if (geo.index) {
        indexCount += geo.index.count;
      } else {
        indexCount += geo.attributes.position.count;
      }
    });

    const positions = new Float32Array(vertexCount * 3);
    const normals = new Float32Array(vertexCount * 3);
    const uvs = new Float32Array(vertexCount * 2);
    const indices = new Uint32Array(indexCount);

    let posOffset = 0;
    let normOffset = 0;
    let uvOffset = 0;
    let indexOffset = 0;
    let vertexOffset = 0;

    geometries.forEach(geo => {
      const pos = geo.attributes.position.array as Float32Array;
      positions.set(pos, posOffset);
      posOffset += pos.length;

      if (geo.attributes.normal) {
        const norm = geo.attributes.normal.array as Float32Array;
        normals.set(norm, normOffset);
        normOffset += norm.length;
      }

      if (geo.attributes.uv) {
        const uv = geo.attributes.uv.array as Float32Array;
        uvs.set(uv, uvOffset);
        uvOffset += uv.length;
      }

      if (geo.index) {
        const idx = geo.index.array as Uint32Array;
        for (let i = 0; i < idx.length; i++) {
          indices[indexOffset + i] = idx[i] + vertexOffset;
        }
        indexOffset += idx.length;
      } else {
        for (let i = 0; i < geo.attributes.position.count; i++) {
          indices[indexOffset + i] = i + vertexOffset;
        }
        indexOffset += geo.attributes.position.count;
      }

      vertexOffset += geo.attributes.position.count;
    });

    merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    merged.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    merged.setIndex(new THREE.BufferAttribute(indices, 1));

    return merged;
  }

  private elasticOut(t: number): number {
    const p = 0.3;
    return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
  }

  getBuildings(): IBuilding[] {
    return this.buildings;
  }

  getBuildingCount(): number {
    return this.buildings.length;
  }

  dispose(): void {
    for (const building of this.buildings) {
      this.sceneManager.getScene().remove(building.mesh);
      building.floors.forEach(floor => {
        floor.geometry.dispose();
        (floor.material as THREE.Material).dispose();
      });
      building.windowLights.forEach(light => {
        light.geometry.dispose();
        (light.material as THREE.Material).dispose();
      });
      if (building.beaconLight) {
        building.beaconLight.dispose();
      }
    }
    this.buildings = [];
    this.occupiedCells.clear();
    
    if (this.lodMergedMesh) {
      this.sceneManager.getScene().remove(this.lodMergedMesh);
      this.lodMergedMesh.geometry.dispose();
      (this.lodMergedMesh.material as THREE.Material).dispose();
    }
  }
}
