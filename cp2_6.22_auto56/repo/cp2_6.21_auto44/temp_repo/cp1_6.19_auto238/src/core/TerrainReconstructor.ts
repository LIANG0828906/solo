import * as THREE from 'three';
import { EchoData } from './SonarController';

export interface TerrainMetrics {
  complexity: number;
  avgDepth: number;
  relief: number;
  coverage: number;
}

export interface TerrainData {
  geometry: THREE.BufferGeometry;
  metrics: TerrainMetrics;
}

const GRID_SIZE = 50;
const TERRAIN_SIZE = 60;

export class TerrainReconstructor {
  private gridSize: number = GRID_SIZE;
  private terrainSize: number = TERRAIN_SIZE;
  private heightMap: number[][] = [];
  private geometry: THREE.PlaneGeometry | null = null;
  private metrics: TerrainMetrics = {
    complexity: 0,
    avgDepth: 0,
    relief: 0,
    coverage: 0,
  };

  constructor() {
    this.initializeHeightMap();
    this.generateBaseTerrain();
  }

  private initializeHeightMap() {
    this.heightMap = [];
    for (let i = 0; i <= this.gridSize; i++) {
      this.heightMap[i] = [];
      for (let j = 0; j <= this.gridSize; j++) {
        this.heightMap[i][j] = 0;
      }
    }
  }

  private generateBaseTerrain() {
    const seed = 12345;
    const random = (i: number, j: number) => {
      const x = Math.sin(seed + i * 12.9898 + j * 78.233) * 43758.5453;
      return x - Math.floor(x);
    };

    for (let i = 0; i <= this.gridSize; i++) {
      for (let j = 0; j <= this.gridSize; j++) {
        const nx = i / this.gridSize;
        const ny = j / this.gridSize;

        let height = 0;
        height += Math.sin(nx * 3 + seed) * Math.cos(ny * 2) * 5;
        height += Math.sin(nx * 7 + 1) * Math.cos(ny * 5 + 2) * 2;
        height += random(i, j) * 1.5;
        height += Math.sin(nx * 1.5) * 3;

        this.heightMap[i][j] = height;
      }
    }
  }

  reconstruct(echoData: EchoData[], scanAngle: number): TerrainData {
    const halfAngle = (scanAngle / 2) * (Math.PI / 180);
    const coverageMask: boolean[][] = [];

    for (let i = 0; i <= this.gridSize; i++) {
      coverageMask[i] = [];
      for (let j = 0; j <= this.gridSize; j++) {
        coverageMask[i][j] = false;
      }
    }

    echoData.forEach((echo) => {
      const gridX = Math.floor(
        ((echo.x + this.terrainSize / 2) / this.terrainSize) * this.gridSize
      );
      const gridZ = Math.floor(
        ((-echo.z + this.terrainSize / 2) / this.terrainSize) * this.gridSize
      );

      const influenceRadius = Math.floor(3 + echo.intensity * 5);

      for (let di = -influenceRadius; di <= influenceRadius; di++) {
        for (let dj = -influenceRadius; dj <= influenceRadius; dj++) {
          const i = gridX + di;
          const j = gridZ + dj;
          if (i >= 0 && i <= this.gridSize && j >= 0 && j <= this.gridSize) {
            const dist = Math.sqrt(di * di + dj * dj);
            if (dist <= influenceRadius) {
              const weight =
                (1 - dist / influenceRadius) * echo.intensity * 0.5;
              this.heightMap[i][j] =
                this.heightMap[i][j] * (1 - weight * 0.3) +
                echo.depth * weight * 0.3;
              coverageMask[i][j] = true;
            }
          }
        }
      }
    });

    let coveredCells = 0;
    let totalCellsInBeam = 0;

    for (let i = 0; i <= this.gridSize; i++) {
      for (let j = 0; j <= this.gridSize; j++) {
        const x = (i / this.gridSize) * this.terrainSize - this.terrainSize / 2;
        const z = (j / this.gridSize) * this.terrainSize - this.terrainSize / 2;

        if (z < 0) {
          const angle = Math.atan2(x, -z);
          if (Math.abs(angle) <= halfAngle) {
            totalCellsInBeam++;
            if (coverageMask[i][j]) {
              coveredCells++;
            }
          }
        }
      }
    }

    this.calculateMetrics(coverageMask, totalCellsInBeam, coveredCells);
    const geometry = this.buildGeometry();

    return { geometry, metrics: { ...this.metrics } };
  }

  private calculateMetrics(
    coverageMask: boolean[][],
    totalCellsInBeam: number,
    coveredCells: number
  ) {
    let totalHeight = 0;
    let minHeight = Infinity;
    let maxHeight = -Infinity;
    let count = 0;

    for (let i = 0; i <= this.gridSize; i++) {
      for (let j = 0; j <= this.gridSize; j++) {
        if (coverageMask[i][j]) {
          const h = this.heightMap[i][j];
          totalHeight += h;
          minHeight = Math.min(minHeight, h);
          maxHeight = Math.max(maxHeight, h);
          count++;
        }
      }
    }

    if (count > 0) {
      this.metrics.avgDepth = totalHeight / count;
      this.metrics.relief = maxHeight - minHeight;
    }

    this.metrics.coverage =
      totalCellsInBeam > 0 ? (coveredCells / totalCellsInBeam) * 100 : 0;

    let complexity = 0;
    for (let i = 1; i < this.gridSize; i++) {
      for (let j = 1; j < this.gridSize; j++) {
        if (coverageMask[i][j]) {
          const dx = this.heightMap[i + 1][j] - this.heightMap[i - 1][j];
          const dy = this.heightMap[i][j + 1] - this.heightMap[i][j - 1];
          complexity += Math.sqrt(dx * dx + dy * dy);
        }
      }
    }
    this.metrics.complexity = Math.min(100, complexity / (count || 1) * 10);
  }

  private buildGeometry(): THREE.PlaneGeometry {
    const geometry = new THREE.PlaneGeometry(
      this.terrainSize,
      this.terrainSize,
      this.gridSize,
      this.gridSize
    );

    const positions = geometry.attributes.position;
    const colors: number[] = [];

    const colorStops = [
      { h: 5, color: new THREE.Color('#2C4C3B') },
      { h: 15, color: new THREE.Color('#5B8C5A') },
      { h: 25, color: new THREE.Color('#8DB580') },
      { h: 35, color: new THREE.Color('#C4B77D') },
      { h: 45, color: new THREE.Color('#E8D5A3') },
    ];

    const getColor = (height: number): THREE.Color => {
      for (let i = 0; i < colorStops.length - 1; i++) {
        if (height <= colorStops[i + 1].h) {
          const t =
            (height - colorStops[i].h) /
            (colorStops[i + 1].h - colorStops[i].h);
          return colorStops[i].color.clone().lerp(colorStops[i + 1].color, t);
        }
      }
      return colorStops[colorStops.length - 1].color;
    };

    for (let i = 0; i < positions.count; i++) {
      const gridX = i % (this.gridSize + 1);
      const gridY = Math.floor(i / (this.gridSize + 1));
      const height = this.heightMap[gridX][gridY];
      positions.setZ(i, height);

      const color = getColor(height);
      colors.push(color.r, color.g, color.b);
    }

    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    return geometry;
  }

  getMetrics(): TerrainMetrics {
    return { ...this.metrics };
  }

  getHeightMap(): number[][] {
    return this.heightMap.map((row) => [...row]);
  }

  dispose() {
    if (this.geometry) {
      this.geometry.dispose();
    }
  }
}
