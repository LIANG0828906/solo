import * as THREE from 'three';

export type LayoutMode = 'grid' | 'random' | 'ring';

export interface BuildingConfig {
  count: number;
  maxHeight: number;
  layout: LayoutMode;
  spacing: number;
}

interface BuildingInstance {
  mesh: THREE.Mesh;
  baseMesh: THREE.Mesh;
  targetHeight: number;
  growthDuration: number;
  growthStartTime: number;
  isGrowing: boolean;
  isFadingBase: boolean;
  baseFadeStartTime: number;
  rowIndex: number;
  baseColor: THREE.Color;
  topColor: THREE.Color;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export class BuildingManager {
  private scene: THREE.Scene;
  private config: BuildingConfig;
  private buildings: BuildingInstance[] = [];
  private buildingGroup: THREE.Group;
  private groundSize: number = 60;
  private isTransitioning: boolean = false;

  constructor(scene: THREE.Scene, config: BuildingConfig) {
    this.scene = scene;
    this.config = { ...config };
    this.buildingGroup = new THREE.Group();
    this.scene.add(this.buildingGroup);
  }

  generateBuildings(): void {
    this.clearBuildings();
    const positions = this.calculatePositions();

    positions.forEach((pos, index) => {
      const building = this.createBuilding(pos, index);
      this.buildings.push(building);
    });

    this.sortBuildingsByRow();
  }

  private calculatePositions(): THREE.Vector3[] {
    const positions: THREE.Vector3[] = [];
    const { count, layout, spacing } = this.config;
    const halfGround = this.groundSize / 2 - 5;

    switch (layout) {
      case 'grid': {
        const cols = Math.ceil(Math.sqrt(count));
        const rows = Math.ceil(count / cols);
        const startX = -((cols - 1) * spacing) / 2;
        const startZ = -((rows - 1) * spacing) / 2;

        for (let i = 0; i < count; i++) {
          const col = i % cols;
          const row = Math.floor(i / cols);
          positions.push(new THREE.Vector3(
            startX + col * spacing,
            0,
            startZ + row * spacing
          ));
        }
        break;
      }
      case 'random': {
        for (let i = 0; i < count; i++) {
          let x, z;
          let valid = false;
          let attempts = 0;

          while (!valid && attempts < 100) {
            x = (Math.random() - 0.5) * halfGround * 1.5;
            z = (Math.random() - 0.5) * halfGround * 1.5;
            valid = true;

            for (const pos of positions) {
              const dist = Math.sqrt((x - pos.x) ** 2 + (z - pos.z) ** 2);
              if (dist < spacing * 0.8) {
                valid = false;
                break;
              }
            }
            attempts++;
          }

          if (valid) {
            positions.push(new THREE.Vector3(x, 0, z));
          }
        }
        break;
      }
      case 'ring': {
        const rings = Math.min(3, Math.ceil(count / 8));
        let placed = 0;

        for (let r = 0; r < rings && placed < count; r++) {
          const radius = (r + 1) * spacing * 2;
          const ringCount = Math.min(
            count - placed,
            r === 0 ? 1 : Math.floor((2 * Math.PI * radius) / (spacing * 1.5))
          );

          if (r === 0) {
            positions.push(new THREE.Vector3(0, 0, 0));
            placed++;
          } else {
            for (let i = 0; i < ringCount && placed < count; i++) {
              const angle = (i / ringCount) * Math.PI * 2 + r * 0.3;
              positions.push(new THREE.Vector3(
                Math.cos(angle) * radius,
                0,
                Math.sin(angle) * radius
              ));
              placed++;
            }
          }
        }
        break;
      }
    }

    return positions;
  }

  private createBuilding(position: THREE.Vector3, _index: number): BuildingInstance {
    const width = 1.5 + Math.random() * 1.5;
    const depth = 1.5 + Math.random() * 1.5;
    const height = 2 + Math.random() * (this.config.maxHeight - 2);

    const geometry = new THREE.BoxGeometry(width, 1, depth);

    const baseColor = new THREE.Color(0x4A4A4A);
    const topColor = new THREE.Color(0xD3D3D3);
    const randomTint = Math.random() * 0.1;
    const adjustedBase = baseColor.clone().offsetHSL(0, 0, -randomTint);
    const adjustedTop = topColor.clone().offsetHSL(0, 0, -randomTint * 0.5);

    const positions = geometry.attributes.position;
    const colors = new Float32Array(positions.count * 3);

    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i);
      const t = (y + 0.5);
      const color = adjustedBase.clone().lerp(adjustedTop, t);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.7,
      metalness: 0.1,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.position.y = 0.5;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.scale.y = 0.01;
    mesh.userData.height = height;
    mesh.userData.width = width;
    mesh.userData.depth = depth;

    const baseGeometry = new THREE.CircleGeometry(Math.max(width, depth) * 0.7, 32);
    const baseMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
    baseMesh.rotation.x = -Math.PI / 2;
    baseMesh.position.set(position.x, 0.01, position.z);

    this.buildingGroup.add(mesh);
    this.buildingGroup.add(baseMesh);

    const growthDuration = 0.5 + Math.random() * 1.0;

    return {
      mesh,
      baseMesh,
      targetHeight: height,
      growthDuration,
      growthStartTime: 0,
      isGrowing: false,
      isFadingBase: false,
      baseFadeStartTime: 0,
      rowIndex: 0,
      baseColor,
      topColor,
    };
  }

  private sortBuildingsByRow(): void {
    const { layout } = this.config;

    if (layout === 'grid') {
      const cols = Math.ceil(Math.sqrt(this.config.count));
      this.buildings.forEach((b, i) => {
        b.rowIndex = i % cols;
      });
    } else if (layout === 'ring') {
      this.buildings.sort((a, b) => {
        const distA = Math.sqrt(a.mesh.position.x ** 2 + a.mesh.position.z ** 2);
        const distB = Math.sqrt(b.mesh.position.x ** 2 + b.mesh.position.z ** 2);
        return distA - distB;
      });
      let ringIdx = 0;
      let lastDist = 0;
      this.buildings.forEach((b) => {
        const dist = Math.sqrt(b.mesh.position.x ** 2 + b.mesh.position.z ** 2);
        if (dist - lastDist > this.config.spacing * 1.5) {
          ringIdx++;
          lastDist = dist;
        }
        b.rowIndex = ringIdx;
      });
    } else {
      this.buildings.sort((a, b) => a.mesh.position.x - b.mesh.position.x);
      let col = 0;
      let lastX = -Infinity;
      this.buildings.forEach((b) => {
        if (b.mesh.position.x - lastX > this.config.spacing * 0.8) {
          col++;
          lastX = b.mesh.position.x;
        }
        b.rowIndex = col;
      });
    }
  }

  startGrowthAnimation(): void {
    const totalDuration = 5000;
    const maxRowIndex = Math.max(...this.buildings.map((b) => b.rowIndex));
    const rowDelay = totalDuration / (maxRowIndex + 1);

    this.buildings.forEach((building) => {
      building.growthStartTime = performance.now() / 1000 + (building.rowIndex * rowDelay) / 1000;
      building.isGrowing = true;
      building.isFadingBase = false;
      building.mesh.scale.y = 0.01;
      building.mesh.position.y = 0.5 * 0.01;

      const baseMaterial = building.baseMesh.material as THREE.MeshBasicMaterial;
      baseMaterial.opacity = 0.1;
    });
  }

  update(_delta: number): void {
    const now = performance.now() / 1000;
    let anyActive = false;

    this.buildings.forEach((building) => {
      if (building.isGrowing) {
        anyActive = true;
        const elapsed = now - building.growthStartTime;
        if (elapsed < 0) return;

        const progress = Math.min(elapsed / building.growthDuration, 1);
        const easedProgress = easeOutCubic(progress);
        const currentHeight = building.targetHeight * easedProgress;

        building.mesh.scale.y = currentHeight;
        building.mesh.position.y = currentHeight * 0.5;

        if (progress >= 1) {
          building.isGrowing = false;
          building.isFadingBase = true;
          building.baseFadeStartTime = now;
        }
      }

      if (building.isFadingBase) {
        anyActive = true;
        const fadeDuration = 0.8;
        const elapsed = now - building.baseFadeStartTime;
        const progress = Math.min(elapsed / fadeDuration, 1);

        const baseMaterial = building.baseMesh.material as THREE.MeshBasicMaterial;
        baseMaterial.opacity = 0.1 * (1 - progress);

        if (progress >= 1) {
          building.isFadingBase = false;
        }
      }
    });

    this.isTransitioning = anyActive;
  }

  async switchLayout(newLayout: LayoutMode): Promise<void> {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    await this.shrinkAllBuildings();
    this.config.layout = newLayout;
    this.generateBuildings();
    this.startGrowthAnimation();
  }

  private async shrinkAllBuildings(): Promise<void> {
    const duration = 0.3;
    const startTime = performance.now() / 1000;

    const initialScales = this.buildings.map((b) => b.mesh.scale.y);
    const initialPositions = this.buildings.map((b) => b.mesh.position.y);

    return new Promise((resolve) => {
      const animate = () => {
        const now = performance.now() / 1000;
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - easeOutCubic(1 - progress);

        this.buildings.forEach((building, idx) => {
          const scale = initialScales[idx] * (1 - eased);
          building.mesh.scale.y = Math.max(scale, 0.01);
          building.mesh.position.y = initialPositions[idx] * (1 - eased);
        });

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          this.clearBuildings();
          this.isTransitioning = false;
          resolve();
        }
      };
      animate();
    });
  }

  setBuildingCount(count: number): void {
    if (this.isTransitioning) return;
    this.config.count = count;
    this.generateBuildings();
    this.startGrowthAnimation();
  }

  setMaxHeight(height: number): void {
    if (this.isTransitioning) return;
    this.config.maxHeight = height;

    this.buildings.forEach((building) => {
      const newHeight = 2 + Math.random() * (height - 2);
      building.targetHeight = newHeight;
    });

    const now = performance.now() / 1000;
    this.buildings.forEach((building) => {
      building.growthStartTime = now + building.rowIndex * 0.1;
      building.isGrowing = true;
      building.growthDuration = 0.8 + Math.random() * 0.5;
    });
  }

  private clearBuildings(): void {
    this.buildings.forEach((building) => {
      this.buildingGroup.remove(building.mesh);
      this.buildingGroup.remove(building.baseMesh);
      building.mesh.geometry.dispose();
      (building.mesh.material as THREE.Material).dispose();
      building.baseMesh.geometry.dispose();
      (building.baseMesh.material as THREE.Material).dispose();
    });
    this.buildings = [];
  }

  getBuildingGroup(): THREE.Group {
    return this.buildingGroup;
  }

  getBuildingCount(): number {
    return this.buildings.length;
  }

  isAnimating(): boolean {
    return this.isTransitioning;
  }

  dispose(): void {
    this.clearBuildings();
    this.scene.remove(this.buildingGroup);
  }
}
