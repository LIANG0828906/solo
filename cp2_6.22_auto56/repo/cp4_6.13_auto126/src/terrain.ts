import * as THREE from 'three';
import { HeightData } from './module_a/shared_types';
import { heightToColor, clamp } from './module_b/utils';

export class Terrain {
  public mesh: THREE.Mesh;
  public geometry: THREE.PlaneGeometry;
  public gridSize: number;
  public vertexCount: number;
  public cellSize: number;
  private heightData: HeightData;
  private colors: Float32Array;

  constructor(gridSize: number = 30, cellSize: number = 1) {
    this.gridSize = gridSize;
    this.vertexCount = gridSize + 1;
    this.cellSize = cellSize;

    this.heightData = {
      size: this.vertexCount,
      heights: new Float32Array(this.vertexCount * this.vertexCount)
    };

    this.generateRandomHeights();

    const width = gridSize * cellSize;
    this.geometry = new THREE.PlaneGeometry(width, width, gridSize, gridSize);
    this.geometry.rotateX(-Math.PI / 2);

    this.colors = new Float32Array(this.geometry.attributes.position.count * 3);

    this.updateGeometryFromHeights();
    this.updateColors();

    this.geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      flatShading: false,
      metalness: 0.1,
      roughness: 0.8
    });

    this.mesh = new THREE.Mesh(this.geometry, material);
    this.mesh.receiveShadow = true;
    this.mesh.castShadow = true;
  }

  private generateRandomHeights(): void {
    for (let i = 0; i < this.vertexCount * this.vertexCount; i++) {
      this.heightData.heights[i] = Math.random() * 2 - 1;
    }
  }

  public getHeightData(): HeightData {
    return this.heightData;
  }

  public getVertexCount(): number {
    return this.geometry.attributes.position.count;
  }

  public getTriangleCount(): number {
    return this.geometry.index
      ? this.geometry.index.count / 3
      : this.geometry.attributes.position.count / 3;
  }

  public getHeightAt(ix: number, iz: number): number {
    if (ix < 0 || ix >= this.vertexCount || iz < 0 || iz >= this.vertexCount) {
      return 0;
    }
    return this.heightData.heights[iz * this.vertexCount + ix];
  }

  public setHeightAt(ix: number, iz: number, height: number): void {
    if (ix < 0 || ix >= this.vertexCount || iz < 0 || iz >= this.vertexCount) {
      return;
    }
    this.heightData.heights[iz * this.vertexCount + ix] = clamp(height, -5, 5);
  }

  public addHeightAt(ix: number, iz: number, delta: number): void {
    if (ix < 0 || ix >= this.vertexCount || iz < 0 || iz >= this.vertexCount) {
      return;
    }
    const idx = iz * this.vertexCount + ix;
    this.heightData.heights[idx] = clamp(this.heightData.heights[idx] + delta, -5, 5);
  }

  public updateGeometryFromHeights(): void {
    const positions = this.geometry.attributes.position;

    for (let iz = 0; iz < this.vertexCount; iz++) {
      for (let ix = 0; ix < this.vertexCount; ix++) {
        const idx = iz * this.vertexCount + ix;
        const y = this.heightData.heights[idx];
        positions.setY(idx, y);
      }
    }

    positions.needsUpdate = true;
    this.geometry.computeVertexNormals();
  }

  public updateColors(): void {
    const positions = this.geometry.attributes.position;
    const count = positions.count;

    for (let i = 0; i < count; i++) {
      const y = positions.getY(i);
      const color = heightToColor(y);
      this.colors[i * 3] = color.r;
      this.colors[i * 3 + 1] = color.g;
      this.colors[i * 3 + 2] = color.b;
    }

    if (!this.geometry.attributes.color) {
      this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    } else {
      this.geometry.attributes.color.needsUpdate = true;
    }
  }

  public update(): void {
    this.updateGeometryFromHeights();
    this.updateColors();
  }

  public worldToGrid(worldX: number, worldZ: number): { ix: number; iz: number } {
    const halfSize = this.gridSize * this.cellSize / 2;
    const ix = Math.round((worldX + halfSize) / this.cellSize);
    const iz = Math.round((worldZ + halfSize) / this.cellSize);
    return { ix, iz };
  }

  public gridToWorld(ix: number, iz: number): { x: number; z: number } {
    const halfSize = this.gridSize * this.cellSize / 2;
    const x = ix * this.cellSize - halfSize;
    const z = iz * this.cellSize - halfSize;
    return { x, z };
  }

  public dispose(): void {
    this.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}
