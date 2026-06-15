export interface Stratum {
  name: string;
  era: string;
  baseColor: string;
  minThickness: number;
  maxThickness: number;
  hasArtifacts: boolean;
}

export const STRATA_DEFINITIONS: Stratum[] = [
  { name: '表土层', era: '现代', baseColor: '#6b4423', minThickness: 1, maxThickness: 2, hasArtifacts: false },
  { name: '文化层', era: '商周秦汉', baseColor: '#8b6914', minThickness: 1.5, maxThickness: 2.5, hasArtifacts: true },
  { name: '古土层', era: '新石器时代', baseColor: '#a0522d', minThickness: 1.5, maxThickness: 3, hasArtifacts: true },
  { name: '岩石层', era: '远古地质', baseColor: '#4a4a4a', minThickness: 2, maxThickness: 3, hasArtifacts: true }
];

export interface TerrainVertex {
  x: number;
  z: number;
  baseHeight: number;
  currentHeight: number;
  originalHeight: number;
}

export interface MiningHole {
  id: number;
  centerX: number;
  centerZ: number;
  radius: number;
  depth: number;
  strataRevealed: number[];
}

export interface ArtifactLocation {
  id: string;
  artifactId: string;
  x: number;
  z: number;
  depthLevel: number;
  discovered: boolean;
  restored: boolean;
}

export class TerrainEngine {
  private size: number;
  private resolution: number;
  private vertices: TerrainVertex[][] = [];
  private holes: MiningHole[] = [];
  private artifactLocations: ArtifactLocation[] = [];
  private stratumThicknesses: number[][] = [];
  private holeIdCounter = 0;

  constructor(size: number = 40, resolution: number = 80) {
    this.size = size;
    this.resolution = resolution;
    this.generateTerrain();
    this.generateStratumThicknesses();
    this.generateArtifactLocations();
  }

  private generateTerrain() {
    const step = this.size / this.resolution;
    for (let i = 0; i <= this.resolution; i++) {
      this.vertices[i] = [];
      for (let j = 0; j <= this.resolution; j++) {
        const x = -this.size / 2 + j * step;
        const z = -this.size / 2 + i * step;
        const height = this.perlinNoise(x * 0.08, z * 0.08) * 3 +
                       this.perlinNoise(x * 0.15, z * 0.15) * 1.5 + 1;
        this.vertices[i][j] = {
          x, z,
          baseHeight: height,
          currentHeight: height,
          originalHeight: height
        };
      }
    }
  }

  private perlinNoise(x: number, z: number): number {
    const n = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
    const n2 = Math.sin(x * 33.12 + z * 11.7) * 12345.678;
    return ((n - Math.floor(n)) + (n2 - Math.floor(n2))) / 2 - 0.5;
  }

  private generateStratumThicknesses() {
    for (let i = 0; i <= this.resolution; i++) {
      this.stratumThicknesses[i] = [];
      for (let j = 0; j <= this.resolution; j++) {
        let total = 0;
        const thicknesses: number[] = [];
        for (let s = 0; s < STRATA_DEFINITIONS.length; s++) {
          const stratum = STRATA_DEFINITIONS[s];
          const t = stratum.minThickness + Math.random() * (stratum.maxThickness - stratum.minThickness);
          thicknesses.push(t);
          total += t;
        }
        this.stratumThicknesses[i].push(...thicknesses);
      }
    }
  }

  private generateArtifactLocations() {
    const artifactIds = ['pottery', 'arrowhead', 'jade_disc', 'trilobite', 'bronze_ding', 'stone_axe', 'fossil_shell', 'jade_pendant'];
    const count = 18;
    
    for (let i = 0; i < count; i++) {
      const depthLevel = 1 + Math.floor(Math.random() * 3);
      this.artifactLocations.push({
        id: `loc_${i}`,
        artifactId: artifactIds[Math.floor(Math.random() * artifactIds.length)],
        x: (Math.random() - 0.5) * this.size * 0.7,
        z: (Math.random() - 0.5) * this.size * 0.7,
        depthLevel,
        discovered: false,
        restored: false
      });
    }
  }

  getVertices(): TerrainVertex[][] {
    return this.vertices;
  }

  getSize(): number {
    return this.size;
  }

  getResolution(): number {
    return this.resolution;
  }

  getStratumThickness(i: number, j: number, stratumIndex: number): number {
    if (i < 0 || i > this.resolution || j < 0 || j > this.resolution) return 0;
    const idx = Math.min(stratumIndex, STRATA_DEFINITIONS.length - 1);
    return this.stratumThicknesses[i][j * STRATA_DEFINITIONS.length + idx] || 1;
  }

  getStratumAt(i: number, j: number, height: number): number {
    if (i < 0 || i > this.resolution || j < 0 || j > this.resolution) return 0;
    let depth = this.vertices[i][j].originalHeight - height;
    let cumDepth = 0;
    for (let s = 0; s < STRATA_DEFINITIONS.length; s++) {
      cumDepth += this.stratumThicknesses[i][j * STRATA_DEFINITIONS.length + s] || 1;
      if (depth <= cumDepth) return s;
    }
    return STRATA_DEFINITIONS.length - 1;
  }

  mineAt(worldX: number, worldZ: number, radius: number = 2.5, depth: number = 1): MiningHole | null {
    const gi = Math.floor((worldZ + this.size / 2) / this.size * this.resolution);
    const gj = Math.floor((worldX + this.size / 2) / this.size * this.resolution);
    
    let actualDepth = depth;
    let lowestHeight = Infinity;
    
    for (let i = 0; i <= this.resolution; i++) {
      for (let j = 0; j <= this.resolution; j++) {
        const v = this.vertices[i][j];
        const dx = v.x - worldX;
        const dz = v.z - worldZ;
        const dist = Math.sqrt(dx * dx + dz * dz);
        
        if (dist < radius) {
          const falloff = 1 - (dist / radius);
          const targetHeight = v.currentHeight - actualDepth * falloff * falloff;
          const minHeight = v.originalHeight - this.getMaxMiningDepth();
          v.currentHeight = Math.max(targetHeight, minHeight);
          if (v.currentHeight < lowestHeight) lowestHeight = v.currentHeight;
        }
      }
    }

    const strataRevealed: number[] = [];
    for (let s = 0; s < STRATA_DEFINITIONS.length; s++) {
      if (lowestHeight <= this.vertices[gi]?.[gj]?.originalHeight - this.getCumulativeDepth(gi, gj, s) || true) {
        strataRevealed.push(s);
      }
    }

    const hole: MiningHole = {
      id: this.holeIdCounter++,
      centerX: worldX,
      centerZ: worldZ,
      radius,
      depth: actualDepth,
      strataRevealed
    };
    this.holes.push(hole);

    this.checkArtifactDiscovery(worldX, worldZ, radius);

    return hole;
  }

  private getCumulativeDepth(i: number, j: number, upTo: number): number {
    let total = 0;
    for (let s = 0; s <= upTo && s < STRATA_DEFINITIONS.length; s++) {
      total += this.stratumThicknesses[i]?.[j * STRATA_DEFINITIONS.length + s] || 1;
    }
    return total;
  }

  private getMaxMiningDepth(): number {
    return STRATA_DEFINITIONS.reduce((sum, s) => sum + s.maxThickness, 0) * 0.9;
  }

  private checkArtifactDiscovery(worldX: number, worldZ: number, radius: number) {
    const expandedRadius = radius + 1.5;
    for (const loc of this.artifactLocations) {
      if (loc.discovered) continue;
      const dx = loc.x - worldX;
      const dz = loc.z - worldZ;
      if (Math.sqrt(dx * dx + dz * dz) < expandedRadius) {
        const gi = Math.floor((loc.z + this.size / 2) / this.size * this.resolution);
        const gj = Math.floor((loc.x + this.size / 2) / this.size * this.resolution);
        const v = this.vertices[gi]?.[gj];
        if (v && v.currentHeight <= v.originalHeight - this.getCumulativeDepth(gi, gj, loc.depthLevel - 1) * 0.5) {
          loc.discovered = true;
        }
      }
    }
  }

  getArtifactLocations(): ArtifactLocation[] {
    return [...this.artifactLocations];
  }

  discoverArtifact(locationId: string) {
    const loc = this.artifactLocations.find(l => l.id === locationId);
    if (loc) loc.discovered = true;
  }

  restoreArtifact(locationId: string) {
    const loc = this.artifactLocations.find(l => l.id === locationId);
    if (loc) loc.restored = true;
  }

  pickTerrain(worldX: number, worldZ: number): { hit: boolean; height: number; stratum: number } {
    const gi = Math.round((worldZ + this.size / 2) / this.size * this.resolution);
    const gj = Math.round((worldX + this.size / 2) / this.size * this.resolution);
    const v = this.vertices[gi]?.[gj];
    if (!v) return { hit: false, height: 0, stratum: 0 };
    return {
      hit: Math.abs(worldX - v.x) < this.size / this.resolution && Math.abs(worldZ - v.z) < this.size / this.resolution,
      height: v.currentHeight,
      stratum: this.getStratumAt(gi, gj, v.currentHeight)
    };
  }

  getDiscoveredArtifacts(): ArtifactLocation[] {
    return this.artifactLocations.filter(l => l.discovered);
  }
}

export const terrainEngine = new TerrainEngine();
