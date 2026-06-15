export interface Stratum {
  name: string;
  era: string;
  baseColor: string;
  accentColor: string;
  minThickness: number;
  maxThickness: number;
  hasArtifacts: boolean;
}

export const STRATA_DEFINITIONS: Stratum[] = [
  { name: '表土层', era: '现代', baseColor: '#6b4423', accentColor: '#8b5a2b', minThickness: 1, maxThickness: 2, hasArtifacts: false },
  { name: '文化层', era: '商周秦汉', baseColor: '#8b6914', accentColor: '#b8860b', minThickness: 1.5, maxThickness: 2.5, hasArtifacts: true },
  { name: '古土层', era: '新石器时代', baseColor: '#a0522d', accentColor: '#cd853f', minThickness: 1.5, maxThickness: 3, hasArtifacts: true },
  { name: '岩石层', era: '远古地质', baseColor: '#4a4a4a', accentColor: '#696969', minThickness: 2, maxThickness: 3, hasArtifacts: true },
  { name: '基岩层', era: '前寒武纪', baseColor: '#2f2f3a', accentColor: '#484858', minThickness: 2, maxThickness: 3, hasArtifacts: false }
];

export const MAX_MINING_LAYERS = 5;

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
  artifactsUncovered: string[];
  timestamp: number;
}

export interface ArtifactLocation {
  id: string;
  artifactId: string;
  x: number;
  z: number;
  depthLevel: number;
  discovered: boolean;
  restored: boolean;
  pieceClaimed: boolean[];
}

export interface HeightSample {
  height: number;
  stratum: number;
  stratumColor: string;
  slope: number;
  isInsideTerrain: boolean;
}

export interface CollisionResult {
  hit: boolean;
  worldX: number;
  worldZ: number;
  height: number;
  stratum: number;
  distanceToCenter: number;
  normalX: number;
  normalZ: number;
}

export interface TerrainChangeListener {
  onHoleMined?: (hole: MiningHole) => void;
  onArtifactDiscovered?: (location: ArtifactLocation) => void;
  onTerrainChanged?: () => void;
}

export class TerrainEngine {
  private size: number;
  private resolution: number;
  private vertices: TerrainVertex[][] = [];
  private holes: MiningHole[] = [];
  private artifactLocations: ArtifactLocation[] = [];
  private stratumThicknesses: Float32Array[] = [];
  private heightMapCache: Float32Array | null = null;
  private holeIdCounter = 0;
  private listeners: Set<TerrainChangeListener> = new Set();
  private dirtyFlags = { vertices: true, heightMap: true, artifacts: true };

  constructor(size: number = 40, resolution: number = 80) {
    this.size = size;
    this.resolution = resolution;
    this.initializeStratumThicknesses();
    this.generateTerrain();
    this.generateArtifactLocations();
  }

  private initializeStratumThicknesses() {
    const vertCount = (this.resolution + 1) * (this.resolution + 1);
    for (let s = 0; s < STRATA_DEFINITIONS.length; s++) {
      this.stratumThicknesses[s] = new Float32Array(vertCount);
    }
    for (let i = 0; i <= this.resolution; i++) {
      for (let j = 0; j <= this.resolution; j++) {
        const idx = i * (this.resolution + 1) + j;
        for (let s = 0; s < STRATA_DEFINITIONS.length; s++) {
          const stratum = STRATA_DEFINITIONS[s];
          const r1 = Math.sin(i * 0.37 + j * 0.19 + s * 7.3) * 0.5 + 0.5;
          const r2 = Math.cos(i * 0.23 - j * 0.31 + s * 3.7) * 0.5 + 0.5;
          const variation = (r1 + r2) * 0.5;
          this.stratumThicknesses[s][idx] = stratum.minThickness +
            variation * (stratum.maxThickness - stratum.minThickness);
        }
      }
    }
  }

  private valueNoise(x: number, y: number, seed: number = 0): number {
    const n = Math.sin(x * 12.9898 + y * 78.233 + seed * 37.719) * 43758.5453;
    return n - Math.floor(n);
  }

  private smoothNoise(x: number, y: number, seed: number = 0): number {
    const ix = Math.floor(x), iy = Math.floor(y);
    const fx = x - ix, fy = y - iy;
    const a = this.valueNoise(ix, iy, seed);
    const b = this.valueNoise(ix + 1, iy, seed);
    const c = this.valueNoise(ix, iy + 1, seed);
    const d = this.valueNoise(ix + 1, iy + 1, seed);
    const ux = fx * fx * (3 - 2 * fx);
    const uy = fy * fy * (3 - 2 * fy);
    return a * (1 - ux) * (1 - uy) + b * ux * (1 - uy) + c * (1 - ux) * uy + d * ux * uy;
  }

  private fbm(x: number, y: number, octaves: number = 4, seed: number = 0): number {
    let value = 0, amp = 1, freq = 1, norm = 0;
    for (let i = 0; i < octaves; i++) {
      value += this.smoothNoise(x * freq, y * freq, seed + i) * amp;
      norm += amp;
      amp *= 0.5;
      freq *= 2;
    }
    return value / norm - 0.5;
  }

  private generateTerrain() {
    const step = this.size / this.resolution;
    const vertCount = (this.resolution + 1) * (this.resolution + 1);
    this.heightMapCache = new Float32Array(vertCount);

    for (let i = 0; i <= this.resolution; i++) {
      this.vertices[i] = [];
      for (let j = 0; j <= this.resolution; j++) {
        const x = -this.size / 2 + j * step;
        const z = -this.size / 2 + i * step;
        const h1 = this.fbm(x * 0.06, z * 0.06, 4, 1) * 4.0;
        const h2 = this.fbm(x * 0.12, z * 0.12, 3, 2) * 2.0;
        const h3 = this.fbm(x * 0.25, z * 0.25, 2, 3) * 0.8;
        const height = 1.5 + h1 + h2 + h3;
        const idx = i * (this.resolution + 1) + j;
        this.vertices[i][j] = {
          x, z,
          baseHeight: height,
          currentHeight: height,
          originalHeight: height
        };
        this.heightMapCache[idx] = height;
      }
    }
  }

  private generateArtifactLocations() {
    const artifactIds = ['pottery', 'arrowhead', 'jade_disc', 'trilobite',
      'bronze_ding', 'stone_axe', 'fossil_shell', 'jade_pendant'];
    const count = 18;

    for (let i = 0; i < count; i++) {
      const depthLevel = 1 + Math.floor(this.valueNoise(i * 13.7, i * 29.1) * 3);
      const r = this.valueNoise(i * 7.3, i * 17.9) * this.size * 0.35 + this.size * 0.05;
      const theta = this.valueNoise(i * 3.1, i * 11.5) * Math.PI * 2;
      this.artifactLocations.push({
        id: `loc_${i}`,
        artifactId: artifactIds[Math.floor(this.valueNoise(i * 19.3, i * 23.7) * artifactIds.length)],
        x: Math.cos(theta) * r,
        z: Math.sin(theta) * r,
        depthLevel,
        discovered: false,
        restored: false,
        pieceClaimed: []
      });
    }
  }

  addListener(listener: TerrainChangeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getVertices(): TerrainVertex[][] { return this.vertices; }
  getSize(): number { return this.size; }
  getResolution(): number { return this.resolution; }
  getHoles(): MiningHole[] { return [...this.holes]; }

  getVertex(i: number, j: number): TerrainVertex | null {
    if (i < 0 || i > this.resolution || j < 0 || j > this.resolution) return null;
    return this.vertices[i][j];
  }

  getStratumThicknessAt(i: number, j: number, stratumIndex: number): number {
    if (i < 0 || i > this.resolution || j < 0 || j > this.resolution) return 0;
    const clamped = Math.max(0, Math.min(STRATA_DEFINITIONS.length - 1, stratumIndex));
    return this.stratumThicknesses[clamped][i * (this.resolution + 1) + j] || 1;
  }

  getCumulativeDepthAt(i: number, j: number, upToStratum: number): number {
    if (i < 0 || i > this.resolution || j < 0 || j > this.resolution) return 0;
    const idx = i * (this.resolution + 1) + j;
    let total = 0;
    const limit = Math.min(upToStratum, STRATA_DEFINITIONS.length - 1);
    for (let s = 0; s <= limit; s++) {
      total += this.stratumThicknesses[s][idx] || 1;
    }
    return total;
  }

  getStratumByWorldDepth(i: number, j: number, depthBelowOriginal: number): number {
    if (depthBelowOriginal <= 0) return 0;
    const idx = i * (this.resolution + 1) + j;
    let cum = 0;
    for (let s = 0; s < STRATA_DEFINITIONS.length; s++) {
      cum += this.stratumThicknesses[s][idx] || 1;
      if (depthBelowOriginal <= cum) return s;
    }
    return STRATA_DEFINITIONS.length - 1;
  }

  worldToGrid(worldX: number, worldZ: number): { i: number; j: number; fi: number; fj: number; inside: boolean } {
    const normX = (worldX + this.size / 2) / this.size;
    const normZ = (worldZ + this.size / 2) / this.size;
    const fj = normX * this.resolution;
    const fi = normZ * this.resolution;
    return {
      i: Math.round(fi),
      j: Math.round(fj),
      fi, fj,
      inside: normX >= 0 && normX <= 1 && normZ >= 0 && normZ <= 1
    };
  }

  sampleHeight(worldX: number, worldZ: number): HeightSample {
    const grid = this.worldToGrid(worldX, worldZ);
    if (!grid.inside) {
      return { height: -100, stratum: 0, stratumColor: STRATA_DEFINITIONS[0].baseColor, slope: 0, isInsideTerrain: false };
    }
    const v = this.vertices[grid.i]?.[grid.j];
    if (!v) return { height: 0, stratum: 0, stratumColor: STRATA_DEFINITIONS[0].baseColor, slope: 0, isInsideTerrain: false };

    const gi = Math.max(0, Math.min(this.resolution, grid.i));
    const gj = Math.max(0, Math.min(this.resolution, grid.j));
    const depthBelow = v.originalHeight - v.currentHeight;
    const stratum = this.getStratumByWorldDepth(gi, gj, Math.max(0, depthBelow));

    const vR = this.vertices[gi]?.[Math.min(gj + 1, this.resolution)];
    const vD = this.vertices[Math.min(gi + 1, this.resolution)]?.[gj];
    const dx = (vR ? vR.currentHeight - v.currentHeight : 0);
    const dz = (vD ? vD.currentHeight - v.currentHeight : 0);
    const slope = Math.sqrt(dx * dx + dz * dz);

    return {
      height: v.currentHeight,
      stratum,
      stratumColor: STRATA_DEFINITIONS[stratum].baseColor,
      slope,
      isInsideTerrain: true
    };
  }

  checkCollision(worldX: number, worldZ: number, radius: number = 0.5): CollisionResult {
    const sample = this.sampleHeight(worldX, worldZ);
    const grid = this.worldToGrid(worldX, worldZ);

    return {
      hit: sample.isInsideTerrain,
      worldX,
      worldZ,
      height: sample.height,
      stratum: sample.stratum,
      distanceToCenter: Math.sqrt(worldX * worldX + worldZ * worldZ),
      normalX: grid.fi - Math.round(grid.fi),
      normalZ: grid.fj - Math.round(grid.fj)
    };
  }

  canMineAt(worldX: number, worldZ: number): boolean {
    const sample = this.sampleHeight(worldX, worldZ);
    if (!sample.isInsideTerrain) return false;
    const grid = this.worldToGrid(worldX, worldZ);
    const v = this.vertices[grid.i]?.[grid.j];
    if (!v) return false;
    const depthBelow = v.originalHeight - v.currentHeight;
    const maxTotalDepth = STRATA_DEFINITIONS.slice(0, MAX_MINING_LAYERS).reduce((s, d) => s + d.maxThickness, 0);
    return depthBelow < maxTotalDepth * 0.95;
  }

  mineAt(
    worldX: number,
    worldZ: number,
    radius: number = 2.5,
    depth: number = 1.2,
    layerLimit: number = MAX_MINING_LAYERS
  ): MiningHole | null {
    if (!this.canMineAt(worldX, worldZ)) return null;

    const grid = this.worldToGrid(worldX, worldZ);
    let lowestHeight = Infinity;
    let lowestGi = grid.i, lowestGj = grid.j;
    const artifactsUncovered: string[] = [];
    const revealedSet = new Set<number>();

    for (let i = 0; i <= this.resolution; i++) {
      for (let j = 0; j <= this.resolution; j++) {
        const v = this.vertices[i][j];
        const dx = v.x - worldX;
        const dz = v.z - worldZ;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < radius) {
          const falloff = Math.pow(1 - dist / radius, 1.5);
          const applyDepth = depth * falloff;
          const maxBelow = this.getCumulativeDepthAt(i, j, layerLimit - 1) * 0.95;
          const newHeight = Math.max(v.originalHeight - maxBelow, v.currentHeight - applyDepth);
          v.currentHeight = newHeight;

          if (newHeight < lowestHeight) {
            lowestHeight = newHeight;
            lowestGi = i;
            lowestGj = j;
          }
          const dBelow = v.originalHeight - newHeight;
          if (dBelow > 0) {
            revealedSet.add(this.getStratumByWorldDepth(i, j, dBelow * 0.3));
            revealedSet.add(this.getStratumByWorldDepth(i, j, dBelow * 0.6));
            revealedSet.add(this.getStratumByWorldDepth(i, j, dBelow));
          }
        }
      }
    }

    if (this.heightMapCache) {
      for (let i = 0; i <= this.resolution; i++) {
        for (let j = 0; j <= this.resolution; j++) {
          this.heightMapCache[i * (this.resolution + 1) + j] = this.vertices[i][j].currentHeight;
        }
      }
    }

    const expandR = radius + 1.5;
    for (const loc of this.artifactLocations) {
      if (loc.discovered) continue;
      const dx = loc.x - worldX;
      const dz = loc.z - worldZ;
      if (dx * dx + dz * dz < expandR * expandR) {
        const lg = this.worldToGrid(loc.x, loc.z);
        const lv = this.vertices[lg.i]?.[lg.j];
        if (lv) {
          const requiredBelow = this.getCumulativeDepthAt(lg.i, lg.j, loc.depthLevel - 1) * 0.55;
          if (lv.originalHeight - lv.currentHeight >= requiredBelow) {
            loc.discovered = true;
            artifactsUncovered.push(loc.id);
            this.listeners.forEach(l => l.onArtifactDiscovered?.(loc));
          }
        }
      }
    }

    const hole: MiningHole = {
      id: this.holeIdCounter++,
      centerX: worldX,
      centerZ: worldZ,
      radius,
      depth,
      strataRevealed: Array.from(revealedSet).sort((a, b) => a - b),
      artifactsUncovered,
      timestamp: performance.now()
    };
    this.holes.push(hole);

    this.dirtyFlags.vertices = true;
    this.dirtyFlags.heightMap = true;
    this.listeners.forEach(l => l.onHoleMined?.(hole));
    this.listeners.forEach(l => l.onTerrainChanged?.());

    return hole;
  }

  mineSwipe(
    fromX: number, fromZ: number,
    toX: number, toZ: number,
    radius: number = 2.5,
    depth: number = 1.0
  ): MiningHole[] {
    const dx = toX - fromX, dz = toZ - fromZ;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const step = Math.max(0.8, radius * 0.4);
    const steps = Math.max(1, Math.ceil(dist / step));
    const created: MiningHole[] = [];
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const h = this.mineAt(fromX + dx * t, fromZ + dz * t, radius, depth);
      if (h) created.push(h);
    }
    return created;
  }

  getStratumColorAtGrid(i: number, j: number): THREECOLOR {
    const v = this.vertices[i]?.[j];
    if (!v) return STRATA_DEFINITIONS[0].baseColor;
    const dBelow = v.originalHeight - v.currentHeight;
    const s = this.getStratumByWorldDepth(i, j, Math.max(0, dBelow));
    const def = STRATA_DEFINITIONS[s];
    const noise = (Math.sin(i * 0.7 + j * 1.3) * 0.5 + 0.5) * 0.15 - 0.075;
    const base = this.hexToRgb(def.baseColor);
    const acc = this.hexToRgb(def.accentColor);
    const r = Math.round(Math.max(0, Math.min(255, (base.r + (acc.r - base.r) * noise))));
    const g = Math.round(Math.max(0, Math.min(255, (base.g + (acc.g - base.g) * noise))));
    const b = Math.round(Math.max(0, Math.min(255, (base.b + (acc.b - base.b) * noise))));
    return `rgb(${r},${g},${b})`;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const h = hex.replace('#', '');
    return {
      r: parseInt(h.substring(0, 2), 16),
      g: parseInt(h.substring(2, 4), 16),
      b: parseInt(h.substring(4, 6), 16)
    };
  }

  getArtifactLocations(): ArtifactLocation[] { return [...this.artifactLocations]; }

  getDiscoveredArtifacts(): ArtifactLocation[] {
    return this.artifactLocations.filter(l => l.discovered);
  }

  getArtifactLocation(id: string): ArtifactLocation | undefined {
    return this.artifactLocations.find(l => l.id === id);
  }

  claimArtifactPiece(locationId: string, pieceIndex: number): boolean {
    const loc = this.artifactLocations.find(l => l.id === locationId);
    if (!loc || !loc.discovered) return false;
    if (!loc.pieceClaimed) loc.pieceClaimed = [];
    if (loc.pieceClaimed[pieceIndex]) return false;
    loc.pieceClaimed[pieceIndex] = true;
    return true;
  }

  setArtifactRestored(locationId: string): void {
    const loc = this.artifactLocations.find(l => l.id === locationId);
    if (loc) {
      loc.restored = true;
      this.dirtyFlags.artifacts = true;
    }
  }

  getHeightMapData(): Float32Array | null {
    return this.heightMapCache;
  }

  getBounds(): { minX: number; maxX: number; minZ: number; maxZ: number } {
    return {
      minX: -this.size / 2,
      maxX: this.size / 2,
      minZ: -this.size / 2,
      maxZ: this.size / 2
    };
  }

  isDirty(type: 'vertices' | 'heightMap' | 'artifacts'): boolean {
    return this.dirtyFlags[type];
  }
  clearDirty(type: 'vertices' | 'heightMap' | 'artifacts'): void {
    this.dirtyFlags[type] = false;
  }
  markDirtyAll(): void {
    this.dirtyFlags.vertices = true;
    this.dirtyFlags.heightMap = true;
    this.dirtyFlags.artifacts = true;
  }
}

export type THREECOLOR = string;

export const terrainEngine = new TerrainEngine();
