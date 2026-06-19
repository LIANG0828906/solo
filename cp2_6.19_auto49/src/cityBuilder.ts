import * as THREE from 'three';

export interface BuildingData {
  position: THREE.Vector3;
  width: number;
  depth: number;
  height: number;
  mesh: THREE.Mesh;
  windows: THREE.PointLight[];
}

export class CityBuilder {
  public buildings: BuildingData[] = [];
  public group: THREE.Group;
  public ground: THREE.Mesh;
  private gridSize = 120;
  private cellSize = 15;
  private roadWidth = 6;
  private buildingCount = 25;

  constructor() {
    this.group = new THREE.Group();
    this.ground = this.createGround();
    this.group.add(this.ground);
    this.createRoads();
    this.generateBuildings();
  }

  private createGround(): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(this.gridSize, this.gridSize, 1, 1);
    const material = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.9,
      metalness: 0.1
    });
    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    return ground;
  }

  private createRoads(): void {
    const numCells = Math.floor(this.gridSize / this.cellSize);
    const roadMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a3a42,
      roughness: 0.85,
      metalness: 0.05
    });

    for (let i = 0; i <= numCells; i++) {
      const pos = -this.gridSize / 2 + i * this.cellSize;

      const hRoad = new THREE.Mesh(
        new THREE.PlaneGeometry(this.gridSize, this.roadWidth),
        roadMaterial
      );
      hRoad.rotation.x = -Math.PI / 2;
      hRoad.position.set(0, 0.01, pos);
      hRoad.receiveShadow = true;
      this.group.add(hRoad);

      const vRoad = new THREE.Mesh(
        new THREE.PlaneGeometry(this.roadWidth, this.gridSize),
        roadMaterial
      );
      vRoad.rotation.x = -Math.PI / 2;
      vRoad.position.set(pos, 0.01, 0);
      vRoad.receiveShadow = true;
      this.group.add(vRoad);

      this.addLaneMarkings(pos, i, numCells);
    }
  }

  private addLaneMarkings(pos: number, index: number, maxIndex: number): void {
    const markingMaterial = new THREE.MeshBasicMaterial({ color: 0xffee88 });
    const dashLength = 1.5;
    const dashGap = 1.0;
    const dashWidth = 0.15;

    for (let j = -this.gridSize / 2 + 2; j < this.gridSize / 2 - 2; j += dashLength + dashGap) {
      if (index % 2 === 0 || index === maxIndex) continue;

      const hMark = new THREE.Mesh(
        new THREE.PlaneGeometry(dashLength, dashWidth),
        markingMaterial
      );
      hMark.rotation.x = -Math.PI / 2;
      hMark.position.set(j, 0.02, pos);
      this.group.add(hMark);

      const vMark = new THREE.Mesh(
        new THREE.PlaneGeometry(dashWidth, dashLength),
        markingMaterial
      );
      vMark.rotation.x = -Math.PI / 2;
      vMark.position.set(pos, 0.02, j);
      this.group.add(vMark);
    }
  }

  private generateBuildings(): void {
    const numCells = Math.floor(this.gridSize / this.cellSize);
    const placedPositions = new Set<string>();

    let attempts = 0;
    while (this.buildings.length < this.buildingCount && attempts < 500) {
      attempts++;

      const gx = Math.floor(Math.random() * numCells);
      const gz = Math.floor(Math.random() * numCells);

      const key = `${gx},${gz}`;
      if (placedPositions.has(key)) continue;
      placedPositions.add(key);

      const cellCenterX = -this.gridSize / 2 + gx * this.cellSize + this.cellSize / 2;
      const cellCenterZ = -this.gridSize / 2 + gz * this.cellSize + this.cellSize / 2;

      const onRoad =
        Math.abs(cellCenterX % this.cellSize) < this.roadWidth / 2 ||
        Math.abs(cellCenterZ % this.cellSize) < this.roadWidth / 2;

      const buildingWidth = 4 + Math.random() * 4;
      const buildingDepth = 4 + Math.random() * 4;
      const buildingHeight = 2 + Math.random() * 6;

      const offsetX = (Math.random() - 0.5) * (this.cellSize - this.roadWidth - buildingWidth - 2);
      const offsetZ = (Math.random() - 0.5) * (this.cellSize - this.roadWidth - buildingDepth - 2);

      let posX = cellCenterX + offsetX;
      let posZ = cellCenterZ + offsetZ;

      if (onRoad && attempts > 100) {
        posX = cellCenterX + (offsetX * 0.3);
        posZ = cellCenterZ + (offsetZ * 0.3);
      }

      posX = Math.max(-this.gridSize / 2 + 5, Math.min(this.gridSize / 2 - 5, posX));
      posZ = Math.max(-this.gridSize / 2 + 5, Math.min(this.gridSize / 2 - 5, posZ));

      const building = this.createBuilding(
        posX,
        posZ,
        buildingWidth,
        buildingDepth,
        buildingHeight
      );

      if (building) {
        this.buildings.push(building);
        this.group.add(building.mesh);
      }
    }

    this.addLandmarks();
  }

  private createBuilding(
    x: number,
    z: number,
    width: number,
    depth: number,
    height: number
  ): BuildingData | null {
    const colors = [
      0x5a7a8a, 0x6a8a9a, 0x7a9aaa, 0x8a6a6a, 0x9a7a8a,
      0x5a6a7a, 0x8a9aaa, 0x6a5a5a, 0x7a8a6a, 0x9a9a8a,
      0x4a5a6a, 0xa09080, 0x708090, 0x908070
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];

    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.7,
      metalness: 0.2
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, height / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const windows: THREE.PointLight[] = [];
    const windowRows = Math.floor(height / 1.2);
    const windowCols = Math.floor(width / 1.5);

    for (let r = 0; r < windowRows; r++) {
      for (let c = 0; c < windowCols; c++) {
        if (Math.random() < 0.45) {
          const wx = x - width / 2 + 0.8 + c * (width - 1.2) / Math.max(1, windowCols - 1);
          const wy = 1 + r * 1.2;

          const emissiveGeo = new THREE.PlaneGeometry(0.6, 0.5);
          const emissiveMat = new THREE.MeshBasicMaterial({
            color: 0xffee88,
            transparent: true,
            opacity: 0
          });

          const winFront = new THREE.Mesh(emissiveGeo, emissiveMat);
          winFront.position.set(wx, wy, z + depth / 2 + 0.01);
          winFront.userData.emissive = true;
          this.group.add(winFront);

          const winBack = new THREE.Mesh(emissiveGeo.clone(), emissiveMat.clone() as THREE.MeshBasicMaterial);
          winBack.position.set(wx, wy, z - depth / 2 - 0.01);
          winBack.rotation.y = Math.PI;
          winBack.userData.emissive = true;
          this.group.add(winBack);

          const winLeft = new THREE.Mesh(
            new THREE.PlaneGeometry(0.6, 0.5),
            emissiveMat.clone() as THREE.MeshBasicMaterial
          );
          const wxLeft = x - width / 2 - 0.01;
          const wzLeft = z - depth / 2 + 0.8 + r * 0.8;
          if (Math.random() < 0.35) {
            winLeft.position.set(wxLeft, wy, wzLeft);
            winLeft.rotation.y = -Math.PI / 2;
            winLeft.userData.emissive = true;
            this.group.add(winLeft);
          }

          const winRight = new THREE.Mesh(
            new THREE.PlaneGeometry(0.6, 0.5),
            emissiveMat.clone() as THREE.MeshBasicMaterial
          );
          const wxRight = x + width / 2 + 0.01;
          const wzRight = z - depth / 2 + 0.8 + r * 0.8;
          if (Math.random() < 0.35) {
            winRight.position.set(wxRight, wy, wzRight);
            winRight.rotation.y = Math.PI / 2;
            winRight.userData.emissive = true;
            this.group.add(winRight);
          }
        }
      }
    }

    return {
      position: new THREE.Vector3(x, height / 2, z),
      width,
      depth,
      height,
      mesh,
      windows
    };
  }

  private addLandmarks(): void {
    const towerHeight = 14;
    const towerGeo = new THREE.CylinderGeometry(1.5, 2.5, towerHeight, 8);
    const towerMat = new THREE.MeshStandardMaterial({
      color: 0x8899aa,
      roughness: 0.5,
      metalness: 0.4
    });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(0, towerHeight / 2, 0);
    tower.castShadow = true;
    this.group.add(tower);

    const tipGeo = new THREE.ConeGeometry(1.2, 3, 8);
    const tipMat = new THREE.MeshStandardMaterial({
      color: 0xccddee,
      roughness: 0.3,
      metalness: 0.7,
      emissive: 0x223344,
      emissiveIntensity: 0.3
    });
    const tip = new THREE.Mesh(tipGeo, tipMat);
    tip.position.set(0, towerHeight + 1.5, 0);
    this.group.add(tip);

    const beaconGeo = new THREE.SphereGeometry(0.35, 16, 16);
    const beaconMat = new THREE.MeshBasicMaterial({
      color: 0xff4444,
      transparent: true,
      opacity: 0
    });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(0, towerHeight + 3, 0);
    beacon.userData.beaconMesh = true;
    this.group.add(beacon);

    const beaconGlowGeo = new THREE.SphereGeometry(0.8, 16, 16);
    const beaconGlowMat = new THREE.MeshBasicMaterial({
      color: 0xff4444,
      transparent: true,
      opacity: 0,
      depthWrite: false
    });
    const beaconGlow = new THREE.Mesh(beaconGlowGeo, beaconGlowMat);
    beaconGlow.position.set(0, towerHeight + 3, 0);
    beaconGlow.userData.beaconGlow = true;
    this.group.add(beaconGlow);

    const plazaGeo = new THREE.CircleGeometry(6, 32);
    const plazaMat = new THREE.MeshStandardMaterial({
      color: 0x4a4a5a,
      roughness: 0.8,
      metalness: 0.1
    });
    const plaza = new THREE.Mesh(plazaGeo, plazaMat);
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.set(0, 0.015, 0);
    this.group.add(plaza);
  }

  public getStreetPositions(): THREE.Vector3[] {
    const positions: THREE.Vector3[] = [];
    const numCells = Math.floor(this.gridSize / this.cellSize);

    for (let i = 0; i <= numCells; i++) {
      const pos = -this.gridSize / 2 + i * this.cellSize;
      for (let j = -numCells; j <= numCells; j++) {
        positions.push(new THREE.Vector3(
          pos,
          0,
          j * this.cellSize / 2
        ));
        positions.push(new THREE.Vector3(
          j * this.cellSize / 2,
          0,
          pos
        ));
      }
    }

    return positions.filter(p =>
      Math.abs(p.x) < this.gridSize / 2 - 2 &&
      Math.abs(p.z) < this.gridSize / 2 - 2
    );
  }

  public getBounds(): { minX: number; maxX: number; minZ: number; maxZ: number } {
    return {
      minX: -this.gridSize / 2 + 2,
      maxX: this.gridSize / 2 - 2,
      minZ: -this.gridSize / 2 + 2,
      maxZ: this.gridSize / 2 - 2
    };
  }
}
