import * as THREE from 'three';

export interface Building {
  mesh: THREE.Mesh;
  edges: THREE.LineSegments;
  height: number;
  width: number;
  depth: number;
  baseColor: THREE.Color;
  windows: THREE.Mesh[];
  windowFlickerSpeeds: number[];
  windowOffsets: number[];
}

export class Cityscape {
  public buildings: Building[] = [];
  public group: THREE.Group;
  private buildingCount: number;
  private radius: number;
  private selectedBuilding: Building | null = null;
  private hoveredBuilding: Building | null = null;
  private tempColor: THREE.Color = new THREE.Color();

  constructor(buildingCount: number = 100, radius: number = 10) {
    this.buildingCount = Math.min(Math.max(buildingCount, 80), 120);
    this.radius = radius;
    this.group = new THREE.Group();
    this.generateBuildings();
  }

  private generateBuildings(): void {
    const positions: { x: number; z: number; width: number; depth: number }[] = [];

    for (let i = 0; i < this.buildingCount; i++) {
      let attempts = 0;
      let placed = false;

      while (!placed && attempts < 50) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.sqrt(Math.random()) * this.radius;
        const x = Math.cos(angle) * dist;
        const z = Math.sin(angle) * dist;
        const width = 0.2 + Math.random() * 0.3;
        const depth = 0.2 + Math.random() * 0.3;

        let overlaps = false;
        for (const pos of positions) {
          const dx = Math.abs(x - pos.x);
          const dz = Math.abs(z - pos.z);
          if (dx < (width + pos.width) / 2 + 0.1 && dz < (depth + pos.depth) / 2 + 0.1) {
            overlaps = true;
            break;
          }
        }

        if (!overlaps) {
          positions.push({ x, z, width, depth });
          this.createBuilding(x, z, width, depth);
          placed = true;
        }

        attempts++;
      }
    }
  }

  private createBuilding(x: number, z: number, width: number, depth: number): void {
    const height = 0.5 + Math.random() * 5.5;
    const geometry = new THREE.BoxGeometry(width, height, depth);

    const heightRatio = (height - 0.5) / 5.5;
    const baseColor = new THREE.Color();
    const lowColor = new THREE.Color(0x4a5568);
    const highColor = new THREE.Color(0xe67e22);
    baseColor.lerpColors(lowColor, highColor, heightRatio);

    const material = new THREE.MeshStandardMaterial({
      color: baseColor.clone(),
      roughness: 0.7,
      metalness: 0.1,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, height / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.buildingIndex = this.buildings.length;

    const edgeGeometry = new THREE.EdgesGeometry(geometry);
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0,
    });
    const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    edges.position.copy(mesh.position);

    const windows: THREE.Mesh[] = [];
    const windowFlickerSpeeds: number[] = [];
    const windowOffsets: number[] = [];

    const windowRows = Math.floor(height / 0.8);
    const windowCols = Math.floor(width / 0.15);
    const windowSize = 0.08;

    for (let row = 0; row < windowRows; row++) {
      for (let col = 0; col < windowCols; col++) {
        if (Math.random() > 0.3) continue;

        const windowGeo = new THREE.PlaneGeometry(windowSize, windowSize * 1.2);
        const windowMat = new THREE.MeshBasicMaterial({
          color: 0xffdd88,
          transparent: true,
          opacity: 0,
        });

        const windowMesh = new THREE.Mesh(windowGeo, windowMat);
        const wx = (col - windowCols / 2 + 0.5) * 0.15;
        const wy = -height / 2 + 0.4 + row * 0.8;

        const side = Math.floor(Math.random() * 4);
        if (side === 0) {
          windowMesh.position.set(wx, wy, depth / 2 + 0.001);
        } else if (side === 1) {
          windowMesh.position.set(wx, wy, -depth / 2 - 0.001);
          windowMesh.rotation.y = Math.PI;
        } else if (side === 2) {
          windowMesh.position.set(width / 2 + 0.001, wy, wx);
          windowMesh.rotation.y = Math.PI / 2;
        } else {
          windowMesh.position.set(-width / 2 - 0.001, wy, wx);
          windowMesh.rotation.y = -Math.PI / 2;
        }

        mesh.add(windowMesh);
        windows.push(windowMesh);
        windowFlickerSpeeds.push(0.5 + Math.random() * 2);
        windowOffsets.push(Math.random() * Math.PI * 2);
      }
    }

    this.group.add(mesh);
    this.group.add(edges);

    this.buildings.push({
      mesh,
      edges,
      height,
      width,
      depth,
      baseColor: baseColor.clone(),
      windows,
      windowFlickerSpeeds,
      windowOffsets,
    });
  }

  public updateTime(timeRatio: number, elapsedTime: number): void {
    let brightness: number;
    let saturation: number;

    if (timeRatio <= 0.3) {
      const t = timeRatio / 0.3;
      brightness = 0.4 + t * 0.6;
      saturation = 0.2;
    } else if (timeRatio <= 0.7) {
      const t = (timeRatio - 0.3) / 0.4;
      brightness = 1.0;
      saturation = 0.2 + t * 0.6;
    } else {
      const t = (timeRatio - 0.7) / 0.3;
      brightness = 1.0 - t * 0.8;
      saturation = 0.8 - t * 0.6;
    }

    let nightFactor = 0;
    if (timeRatio > 0.7) {
      nightFactor = (timeRatio - 0.7) / 0.3;
    } else if (timeRatio < 0.05) {
      nightFactor = 1 - timeRatio / 0.05;
    }

    for (let i = 0; i < this.buildings.length; i++) {
      const building = this.buildings[i];
      const material = building.mesh.material as THREE.MeshStandardMaterial;

      this.tempColor.copy(building.baseColor);
      this.tempColor.offsetHSL(0, saturation - 0.2, brightness - 0.5);
      material.color.copy(this.tempColor);

      for (let j = 0; j < building.windows.length; j++) {
        const windowMat = building.windows[j].material as THREE.MeshBasicMaterial;
        const flicker = Math.sin(elapsedTime * building.windowFlickerSpeeds[j] + building.windowOffsets[j]);
        const baseOpacity = nightFactor * 0.8;
        const flickerAmount = 0.2 * flicker;
        windowMat.opacity = Math.max(0, baseOpacity + flickerAmount);
      }
    }
  }

  public setHoveredBuilding(index: number | null): void {
    if (this.hoveredBuilding && this.hoveredBuilding !== this.selectedBuilding) {
      const edgeMat = this.hoveredBuilding.edges.material as THREE.LineBasicMaterial;
      edgeMat.opacity = 0;
      const mat = this.hoveredBuilding.mesh.material as THREE.MeshStandardMaterial;
      mat.emissive.setHex(0x000000);
      mat.emissiveIntensity = 0;
    }

    if (index !== null && index >= 0 && index < this.buildings.length) {
      this.hoveredBuilding = this.buildings[index];
      if (this.hoveredBuilding !== this.selectedBuilding) {
        const edgeMat = this.hoveredBuilding.edges.material as THREE.LineBasicMaterial;
        edgeMat.opacity = 1;
        const mat = this.hoveredBuilding.mesh.material as THREE.MeshStandardMaterial;
        mat.emissive.setHex(0xffff00);
        mat.emissiveIntensity = 0.3;
      }
    } else {
      this.hoveredBuilding = null;
    }
  }

  public setSelectedBuilding(index: number | null): void {
    if (this.selectedBuilding) {
      const edgeMat = this.selectedBuilding.edges.material as THREE.LineBasicMaterial;
      edgeMat.opacity = 0;
      const mat = this.selectedBuilding.mesh.material as THREE.MeshStandardMaterial;
      mat.emissive.setHex(0x000000);
      mat.emissiveIntensity = 0;
    }

    if (index !== null && index >= 0 && index < this.buildings.length) {
      this.selectedBuilding = this.buildings[index];
      const edgeMat = this.selectedBuilding.edges.material as THREE.LineBasicMaterial;
      edgeMat.opacity = 1;
      const mat = this.selectedBuilding.mesh.material as THREE.MeshStandardMaterial;
      mat.emissive.setHex(0xffff00);
      mat.emissiveIntensity = 0.8;
    } else {
      this.selectedBuilding = null;
    }
  }

  public getSelectedBuilding(): Building | null {
    return this.selectedBuilding;
  }

  public getBuildingMeshes(): THREE.Mesh[] {
    return this.buildings.map(b => b.mesh);
  }
}
