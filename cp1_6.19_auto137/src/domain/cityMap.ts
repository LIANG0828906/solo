import * as THREE from 'three';

export interface BuildingData {
  position: THREE.Vector3;
  width: number;
  depth: number;
  height: number;
  mesh: THREE.Mesh;
}

export interface RoadData {
  center: THREE.Vector3;
  direction: 'horizontal' | 'vertical';
  width: number;
  length: number;
}

const GRID_SIZE = 100;
const ROAD_POSITIONS = [0, 20, 40, 60, 80, 100];
const ROAD_WIDTH = 4;
const BLOCK_COUNT = 5;

export class CityMap {
  private buildings: BuildingData[] = [];
  private roads: RoadData[] = [];
  private groundPlane!: THREE.Mesh;
  private roadMeshes: THREE.Mesh[] = [];
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.createGround();
    this.createRoads();
    this.createBuildings();
  }

  private createGround(): void {
    const geo = new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xe0e0e0,
      transparent: true,
      opacity: 0.5,
      roughness: 0.9,
    });
    this.groundPlane = new THREE.Mesh(geo, mat);
    this.groundPlane.position.set(GRID_SIZE / 2, 0, GRID_SIZE / 2);
    this.groundPlane.receiveShadow = true;
    this.scene.add(this.groundPlane);
  }

  private createRoads(): void {
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x333340,
      roughness: 0.8,
    });

    for (const pos of ROAD_POSITIONS) {
      const hGeo = new THREE.PlaneGeometry(GRID_SIZE, ROAD_WIDTH);
      hGeo.rotateX(-Math.PI / 2);
      const hMesh = new THREE.Mesh(hGeo, roadMat);
      hMesh.position.set(GRID_SIZE / 2, 0.02, pos);
      this.scene.add(hMesh);
      this.roadMeshes.push(hMesh);
      this.roads.push({
        center: new THREE.Vector3(GRID_SIZE / 2, 0, pos),
        direction: 'horizontal',
        width: ROAD_WIDTH,
        length: GRID_SIZE,
      });

      const vGeo = new THREE.PlaneGeometry(ROAD_WIDTH, GRID_SIZE);
      vGeo.rotateX(-Math.PI / 2);
      const vMesh = new THREE.Mesh(vGeo, roadMat);
      vMesh.position.set(pos, 0.02, GRID_SIZE / 2);
      this.scene.add(vMesh);
      this.roadMeshes.push(vMesh);
      this.roads.push({
        center: new THREE.Vector3(pos, 0, GRID_SIZE / 2),
        direction: 'vertical',
        width: ROAD_WIDTH,
        length: GRID_SIZE,
      });
    }
  }

  private createBuildings(): void {
    const buildingMat = new THREE.MeshStandardMaterial({
      color: 0x555555,
      roughness: 0.7,
      metalness: 0.1,
    });

    const count = 30 + Math.floor(Math.random() * 21);
    const occupied: { x: number; z: number; hw: number; hd: number }[] = [];

    for (let i = 0; i < count; i++) {
      const width = 6 + Math.random() * 6;
      const depth = 6 + Math.random() * 6;
      const height = 10 + Math.random() * 20;

      let placed = false;
      for (let attempt = 0; attempt < 50; attempt++) {
        const blockX = Math.floor(Math.random() * BLOCK_COUNT);
        const blockZ = Math.floor(Math.random() * BLOCK_COUNT);

        const blockStartX = ROAD_POSITIONS[blockX] + ROAD_WIDTH / 2 + 1;
        const blockStartZ = ROAD_POSITIONS[blockZ] + ROAD_WIDTH / 2 + 1;
        const blockEndX = ROAD_POSITIONS[blockX + 1] - ROAD_WIDTH / 2 - 1;
        const blockEndZ = ROAD_POSITIONS[blockZ + 1] - ROAD_WIDTH / 2 - 1;

        const x = blockStartX + width / 2 + Math.random() * Math.max(0, (blockEndX - blockStartX) - width);
        const z = blockStartZ + depth / 2 + Math.random() * Math.max(0, (blockEndZ - blockStartZ) - depth);

        let overlap = false;
        for (const o of occupied) {
          if (Math.abs(x - o.x) < (width / 2 + o.hw + 0.5) &&
              Math.abs(z - o.z) < (depth / 2 + o.hd + 0.5)) {
            overlap = true;
            break;
          }
        }

        if (!overlap) {
          const geo = new THREE.BoxGeometry(width, height, depth);
          const mesh = new THREE.Mesh(geo, buildingMat);
          mesh.position.set(x, height / 2, z);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          this.scene.add(mesh);

          const building: BuildingData = {
            position: new THREE.Vector3(x, 0, z),
            width,
            depth,
            height,
            mesh,
          };
          this.buildings.push(building);
          occupied.push({ x, z, hw: width / 2, hd: depth / 2 });
          placed = true;
          break;
        }
      }
    }
  }

  getBuildings(): BuildingData[] {
    return this.buildings;
  }

  getRoads(): RoadData[] {
    return this.roads;
  }

  getGroundPlane(): THREE.Mesh {
    return this.groundPlane;
  }

  isOnRoad(position: THREE.Vector3): boolean {
    for (const road of this.roads) {
      if (road.direction === 'horizontal') {
        if (Math.abs(position.z - road.center.z) < road.width / 2 &&
            position.x >= 0 && position.x <= GRID_SIZE) {
          return true;
        }
      } else {
        if (Math.abs(position.x - road.center.x) < road.width / 2 &&
            position.z >= 0 && position.z <= GRID_SIZE) {
          return true;
        }
      }
    }
    return false;
  }

  getRandomRoadPosition(): THREE.Vector3 {
    const road = this.roads[Math.floor(Math.random() * this.roads.length)];
    if (road.direction === 'horizontal') {
      const x = Math.random() * GRID_SIZE;
      const z = road.center.z + (Math.random() - 0.5) * (road.width * 0.6);
      return new THREE.Vector3(x, 0.5, z);
    } else {
      const x = road.center.x + (Math.random() - 0.5) * (road.width * 0.6);
      const z = Math.random() * GRID_SIZE;
      return new THREE.Vector3(x, 0.5, z);
    }
  }

  getGridPosition(worldPos: THREE.Vector3): { x: number; y: number } {
    return {
      x: Math.floor((worldPos.x / GRID_SIZE) * 80),
      y: Math.floor((worldPos.z / GRID_SIZE) * 80),
    };
  }

  getWorldPosition(gridX: number, gridY: number): THREE.Vector3 {
    return new THREE.Vector3(
      (gridX + 0.5) * (GRID_SIZE / 80),
      0,
      (gridY + 0.5) * (GRID_SIZE / 80),
    );
  }

  getGridSize(): number {
    return GRID_SIZE;
  }
}
