import * as THREE from 'three';

export interface BuildingData {
  position: THREE.Vector3;
  width: number;
  depth: number;
  height: number;
  mesh: THREE.Mesh;
  windows: THREE.PointLight[];
  windowMeshes: THREE.Mesh[];
}

export interface StreetLightData {
  light: THREE.PointLight;
  pole: THREE.Group;
}

export class CityBuilder {
  public buildings: BuildingData[] = [];
  public streetLights: StreetLightData[] = [];
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
    this.createStreetLights();
    this.createTrees();
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
    const desaturatedColors = [
      0xaac8dd,
      0xf0ece2,
      0xd8d8d8,
      0xe8d5da,
      0xc8e0cc,
      0xbcd4e0,
      0xe8e2d0,
      0xd4d4dc,
      0xe0cccc,
      0xcce0d4
    ];
    const color = desaturatedColors[Math.floor(Math.random() * desaturatedColors.length)];

    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.75,
      metalness: 0.15
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, height / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const windows: THREE.PointLight[] = [];
    const windowMeshes: THREE.Mesh[] = [];

    const windowCount = 2 + Math.floor(Math.random() * 3);
    const windowWidth = 0.5;
    const windowHeight = 0.6;
    const spacing = (width - 1) / Math.max(1, windowCount - 1);
    const windowY = height * 0.35 + Math.random() * (height * 0.25);

    for (let i = 0; i < windowCount; i++) {
      const wx = x - width / 2 + 0.5 + i * spacing;

      const dayOpacity = 0.5 + Math.random() * 0.2;
      const nightEmissive = 0.8 + Math.random() * 0.2;

      const winGeo = new THREE.PlaneGeometry(windowWidth, windowHeight);
      const winMat = new THREE.MeshStandardMaterial({
        color: 0xffee88,
        emissive: 0xffcc44,
        emissiveIntensity: 0,
        transparent: true,
        opacity: dayOpacity
      });

      const winFront = new THREE.Mesh(winGeo, winMat);
      winFront.position.set(wx, windowY, z + depth / 2 + 0.01);
      winFront.userData.windowMesh = true;
      winFront.userData.dayOpacity = dayOpacity;
      winFront.userData.nightEmissive = nightEmissive;
      windowMeshes.push(winFront);
      this.group.add(winFront);
    }

    return {
      position: new THREE.Vector3(x, height / 2, z),
      width,
      depth,
      height,
      mesh,
      windows,
      windowMeshes
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

  private createStreetLights(): void {
    const halfGrid = this.gridSize / 2;
    const spacing = 17;
    const maxLights = 8;
    let count = 0;

    for (let z = -halfGrid + spacing / 2; z <= halfGrid && count < maxLights; z += spacing) {
      if (count >= maxLights) break;
      this.addStreetLight(-halfGrid + 8, z, count);
      count++;
      if (count >= maxLights) break;
      this.addStreetLight(halfGrid - 8, z, count);
      count++;
    }

    for (let x = -halfGrid + spacing / 2 + spacing; x <= halfGrid - spacing && count < maxLights; x += spacing) {
      if (count >= maxLights) break;
      this.addStreetLight(x, -halfGrid + 8, count);
      count++;
      if (count >= maxLights) break;
      this.addStreetLight(x, halfGrid - 8, count);
      count++;
    }
  }

  private addStreetLight(x: number, z: number, index: number): void {
    const poleGroup = new THREE.Group();

    const poleGeo = new THREE.CylinderGeometry(0.12, 0.15, 4, 8);
    const poleMat = new THREE.MeshStandardMaterial({
      color: 0x3a3a3a,
      roughness: 0.7,
      metalness: 0.6
    });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(0, 2, 0);
    pole.castShadow = true;
    poleGroup.add(pole);

    const topGeo = new THREE.SphereGeometry(0.28, 12, 12);
    const topMat = new THREE.MeshStandardMaterial({
      color: 0xffcc66,
      emissive: 0xffaa33,
      emissiveIntensity: 0
    });
    const top = new THREE.Mesh(topGeo, topMat);
    top.position.set(0, 4.1, 0);
    top.userData.lampTop = true;
    poleGroup.add(top);

    const light = new THREE.PointLight(0xffcc66, 0, 15, 2);
    light.position.set(0, 4, 0);
    light.castShadow = true;
    poleGroup.add(light);

    poleGroup.position.set(x, 0, z);
    this.group.add(poleGroup);

    this.streetLights.push({ light, pole: poleGroup });
  }

  private createTrees(): void {
    const halfGrid = this.gridSize / 2;
    const margin = 3;
    const treeSpacing = 6;

    for (let x = -halfGrid + margin; x <= halfGrid - margin; x += treeSpacing) {
      this.addTree(x + (Math.random() - 0.5) * 1.5, -halfGrid + margin + Math.random() * 2);
      this.addTree(x + (Math.random() - 0.5) * 1.5, halfGrid - margin - Math.random() * 2);
    }

    for (let z = -halfGrid + margin + treeSpacing; z <= halfGrid - margin - treeSpacing; z += treeSpacing) {
      this.addTree(-halfGrid + margin + Math.random() * 2, z + (Math.random() - 0.5) * 1.5);
      this.addTree(halfGrid - margin - Math.random() * 2, z + (Math.random() - 0.5) * 1.5);
    }
  }

  private addTree(x: number, z: number): void {
    const treeGroup = new THREE.Group();
    const totalHeight = 3 + Math.random() * 2;
    const trunkHeight = totalHeight * 0.4;
    const crownHeight = totalHeight * 0.6;

    const trunkGeo = new THREE.CylinderGeometry(0.15, 0.2, trunkHeight, 6);
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x5a3a2a,
      roughness: 0.9,
      metalness: 0
    });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(0, trunkHeight / 2, 0);
    trunk.castShadow = true;
    treeGroup.add(trunk);

    const greenShades = [0x3a6a3a, 0x4a7a4a, 0x2a5a2a, 0x5a8a5a, 0x3a7a3a];
    const crownColor = greenShades[Math.floor(Math.random() * greenShades.length)];

    const crownGeo = new THREE.ConeGeometry(0.9 + Math.random() * 0.3, crownHeight, 7);
    const crownMat = new THREE.MeshStandardMaterial({
      color: crownColor,
      roughness: 0.85,
      metalness: 0
    });
    const crown = new THREE.Mesh(crownGeo, crownMat);
    crown.position.set(0, trunkHeight + crownHeight / 2, 0);
    crown.castShadow = true;
    treeGroup.add(crown);

    treeGroup.position.set(x, 0, z);
    treeGroup.rotation.y = Math.random() * Math.PI;
    this.group.add(treeGroup);
  }
}
