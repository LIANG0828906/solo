export interface RockLayer {
  id: string;
  name: string;
  type: 'sedimentary' | 'shale' | 'granite' | 'basalt' | 'metamorphic' | 'igneous';
  color: string;
  opacity: number;
  topDepth: number;
  bottomDepth: number;
  thickness: number;
  visible: boolean;
}

export interface MineralNode {
  id: string;
  name: string;
  type: 'gold' | 'copper' | 'iron' | 'coal';
  color: string;
  position: { x: number; y: number; z: number };
  radius: number;
  depth: number;
  density: number;
  reserve: number;
  layerId: string;
  visible: boolean;
  pulsePhase: number;
  pulsePeriod: number;
  pulseAmplitude: number;
}

export interface RegionData {
  id: string;
  name: string;
  centerX: number;
  centerZ: number;
  radius: number;
}

export interface SlicedData {
  layers: RockLayer[];
  minerals: MineralNode[];
}

class SimplexNoise {
  private perm: number[];
  private grad3: number[][];

  constructor(seed: number = Math.random()) {
    this.grad3 = [
      [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
      [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
      [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]
    ];
    const p: number[] = [];
    for (let i = 0; i < 256; i++) {
      p[i] = Math.floor(this.seededRandom(seed + i) * 256);
    }
    this.perm = new Array(512);
    for (let i = 0; i < 512; i++) {
      this.perm[i] = p[i & 255];
    }
  }

  private seededRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  private dot(g: number[], x: number, y: number, z: number): number {
    return g[0] * x + g[1] * y + g[2] * z;
  }

  noise3D(xin: number, yin: number, zin: number): number {
    const F3 = 1.0 / 3.0;
    const G3 = 1.0 / 6.0;
    let n0, n1, n2, n3;
    const s = (xin + yin + zin) * F3;
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    const k = Math.floor(zin + s);
    const t = (i + j + k) * G3;
    const X0 = i - t;
    const Y0 = j - t;
    const Z0 = k - t;
    const x0 = xin - X0;
    const y0 = yin - Y0;
    const z0 = zin - Z0;
    let i1, j1, k1, i2, j2, k2;
    if (x0 >= y0) {
      if (y0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
      else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; }
      else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; }
    } else {
      if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; }
      else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; }
      else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
    }
    const x1 = x0 - i1 + G3;
    const y1 = y0 - j1 + G3;
    const z1 = z0 - k1 + G3;
    const x2 = x0 - i2 + 2.0 * G3;
    const y2 = y0 - j2 + 2.0 * G3;
    const z2 = z0 - k2 + 2.0 * G3;
    const x3 = x0 - 1.0 + 3.0 * G3;
    const y3 = y0 - 1.0 + 3.0 * G3;
    const z3 = z0 - 1.0 + 3.0 * G3;
    const ii = i & 255;
    const jj = j & 255;
    const kk = k & 255;
    const gi0 = this.perm[ii + this.perm[jj + this.perm[kk]]] % 12;
    const gi1 = this.perm[ii + i1 + this.perm[jj + j1 + this.perm[kk + k1]]] % 12;
    const gi2 = this.perm[ii + i2 + this.perm[jj + j2 + this.perm[kk + k2]]] % 12;
    const gi3 = this.perm[ii + 1 + this.perm[jj + 1 + this.perm[kk + 1]]] % 12;
    let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
    if (t0 < 0) n0 = 0.0;
    else {
      t0 *= t0;
      n0 = t0 * t0 * this.dot(this.grad3[gi0], x0, y0, z0);
    }
    let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
    if (t1 < 0) n1 = 0.0;
    else {
      t1 *= t1;
      n1 = t1 * t1 * this.dot(this.grad3[gi1], x1, y1, z1);
    }
    let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
    if (t2 < 0) n2 = 0.0;
    else {
      t2 *= t2;
      n2 = t2 * t2 * this.dot(this.grad3[gi2], x2, y2, z2);
    }
    let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
    if (t3 < 0) n3 = 0.0;
    else {
      t3 *= t3;
      n3 = t3 * t3 * this.dot(this.grad3[gi3], x3, y3, z3);
    }
    return 32.0 * (n0 + n1 + n2 + n3);
  }
}

const ROCK_TYPES = [
  { type: 'sedimentary' as const, name: '沉积岩', color: '#DAA520', opacity: 0.65 },
  { type: 'shale' as const, name: '页岩', color: '#8B4513', opacity: 0.7 },
  { type: 'granite' as const, name: '花岗岩', color: '#808080', opacity: 0.65 },
  { type: 'basalt' as const, name: '玄武岩', color: '#2F4F4F', opacity: 0.75 },
  { type: 'metamorphic' as const, name: '变质岩', color: '#9370DB', opacity: 0.6 },
  { type: 'igneous' as const, name: '岩浆岩', color: '#CD853F', opacity: 0.7 }
];

const MINERAL_TYPES = [
  { type: 'gold' as const, name: '金矿', color: '#FFD700', densityRange: [15.0, 19.3], reserveFactor: 10000 },
  { type: 'copper' as const, name: '铜矿', color: '#FF8C00', densityRange: [7.0, 8.96], reserveFactor: 50000 },
  { type: 'iron' as const, name: '铁矿', color: '#C0C0C0', densityRange: [6.5, 7.87], reserveFactor: 200000 },
  { type: 'coal' as const, name: '煤矿', color: '#333333', densityRange: [1.2, 1.8], reserveFactor: 500000 }
];

class DataProvider {
  private noise: SimplexNoise;
  private layers: RockLayer[] = [];
  private minerals: MineralNode[] = [];
  private regions: RegionData[] = [];
  private currentRegion: RegionData | null = null;
  private seed: number;
  private readonly MAX_DEPTH = 100;
  private readonly SURFACE_RADIUS = 50;
  private layerBoundaryCache: Map<string, (x: number, z: number) => number> = new Map();

  constructor(seed: number = 42) {
    this.seed = seed;
    this.noise = new SimplexNoise(seed);
    this.generateRegions();
    this.selectRegion(this.regions[0].id);
  }

  private generateRegions(): void {
    const regionNames = ['华北平原', '长江流域', '青藏高原', '塔里木盆地', '松辽平原'];
    this.regions = regionNames.map((name, index) => ({
      id: `region_${index}`,
      name,
      centerX: (Math.random() - 0.5) * 40,
      centerZ: (Math.random() - 0.5) * 40,
      radius: 20 + Math.random() * 20
    }));
  }

  selectRegion(regionId: string): void {
    const region = this.regions.find(r => r.id === regionId);
    if (!region) return;
    this.currentRegion = region;
    this.layerBoundaryCache.clear();
    this.generateLayers();
    this.generateMinerals();
  }

  private generateLayers(): void {
    const layerCount = 4 + Math.floor(Math.random() * 3);
    const selectedTypes: typeof ROCK_TYPES = [];
    const availableTypes = [...ROCK_TYPES];
    for (let i = 0; i < layerCount && availableTypes.length > 0; i++) {
      const idx = Math.floor(Math.random() * availableTypes.length);
      selectedTypes.push(availableTypes[idx]);
      availableTypes.splice(idx, 1);
    }

    let currentDepth = 0;
    this.layers = selectedTypes.map((rockType, index) => {
      const thickness = 10 + Math.random() * 20;
      const bottomDepth = Math.min(currentDepth + thickness, this.MAX_DEPTH);
      const actualThickness = bottomDepth - currentDepth;
      const layer: RockLayer = {
        id: `layer_${index}`,
        name: rockType.name,
        type: rockType.type,
        color: rockType.color,
        opacity: rockType.opacity,
        topDepth: currentDepth,
        bottomDepth: bottomDepth,
        thickness: actualThickness,
        visible: true
      };
      currentDepth = bottomDepth;
      this.createLayerBoundaryFunction(layer.id, layer.topDepth, layer.bottomDepth, index);
      return layer;
    });

    if (this.layers.length > 0) {
      this.layers[this.layers.length - 1].bottomDepth = this.MAX_DEPTH;
      this.layers[this.layers.length - 1].thickness = this.MAX_DEPTH - this.layers[this.layers.length - 1].topDepth;
    }
  }

  private createLayerBoundaryFunction(layerId: string, topDepth: number, bottomDepth: number, layerIndex: number): void {
    const seed = this.seed + layerIndex * 1000;
    this.layerBoundaryCache.set(`top_${layerId}`, (x: number, z: number) => {
      const n1 = this.noise.noise3D(x * 0.04 + seed, z * 0.04, 0.5) * 3;
      const n2 = this.noise.noise3D(x * 0.08 + seed * 2, z * 0.08, 1.2) * 1.5;
      return Math.max(0, topDepth + n1 + n2);
    });
    this.layerBoundaryCache.set(`bottom_${layerId}`, (x: number, z: number) => {
      const n1 = this.noise.noise3D(x * 0.04 + seed + 100, z * 0.04 + 100, 0.7) * 3;
      const n2 = this.noise.noise3D(x * 0.08 + seed * 3, z * 0.08 + 50, 1.5) * 1.5;
      return Math.min(this.MAX_DEPTH, bottomDepth + n1 + n2);
    });
  }

  getLayerTopDepth(layerId: string, x: number, z: number): number {
    const fn = this.layerBoundaryCache.get(`top_${layerId}`);
    return fn ? fn(x, z) : 0;
  }

  getLayerBottomDepth(layerId: string, x: number, z: number): number {
    const fn = this.layerBoundaryCache.get(`bottom_${layerId}`);
    return fn ? fn(x, z) : this.MAX_DEPTH;
  }

  private generateMinerals(): void {
    const count = 100 + Math.floor(Math.random() * 51);
    this.minerals = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.sqrt(Math.random()) * (this.SURFACE_RADIUS - 5);
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const depth = Math.random() * this.MAX_DEPTH * 0.95 + 3;
      const layer = this.findLayerAtDepth(x, z, depth);
      if (!layer) continue;

      const mineralType = MINERAL_TYPES[Math.floor(Math.random() * MINERAL_TYPES.length)];
      const density = mineralType.densityRange[0] + Math.random() * (mineralType.densityRange[1] - mineralType.densityRange[0]);
      const radius = 0.4 + Math.random() * 0.8;
      const volume = (4 / 3) * Math.PI * Math.pow(radius * 3, 3);
      const reserve = Math.floor(density * volume * mineralType.reserveFactor * (0.5 + Math.random()));

      this.minerals.push({
        id: `mineral_${i}`,
        name: mineralType.name,
        type: mineralType.type,
        color: mineralType.color,
        position: { x, y: -depth, z },
        radius,
        depth,
        density: Math.round(density * 100) / 100,
        reserve,
        layerId: layer.id,
        visible: true,
        pulsePhase: Math.random() * Math.PI * 2,
        pulsePeriod: 2 + Math.random() * 2,
        pulseAmplitude: 0.1
      });
    }
  }

  private findLayerAtDepth(x: number, z: number, depth: number): RockLayer | null {
    for (const layer of this.layers) {
      const top = this.getLayerTopDepth(layer.id, x, z);
      const bottom = this.getLayerBottomDepth(layer.id, x, z);
      if (depth >= top && depth <= bottom) {
        return layer;
      }
    }
    return this.layers.length > 0 ? this.layers[this.layers.length - 1] : null;
  }

  getRegions(): RegionData[] {
    return this.regions;
  }

  getCurrentRegion(): RegionData | null {
    return this.currentRegion;
  }

  getLayers(): RockLayer[] {
    return this.layers.map(l => ({ ...l }));
  }

  setLayerVisibility(layerId: string, visible: boolean): void {
    const layer = this.layers.find(l => l.id === layerId);
    if (layer) {
      layer.visible = visible;
    }
  }

  getMinerals(): MineralNode[] {
    return this.minerals.map(m => ({ ...m, position: { ...m.position } }));
  }

  getMineralById(id: string): MineralNode | null {
    const m = this.minerals.find(m => m.id === id);
    return m ? { ...m, position: { ...m.position } } : null;
  }

  sliceByDepth(minDepth: number, maxDepth: number): SlicedData {
    const visibleLayers = this.layers.filter(layer => {
      const sampleX = 0, sampleZ = 0;
      const top = this.getLayerTopDepth(layer.id, sampleX, sampleZ);
      const bottom = this.getLayerBottomDepth(layer.id, sampleX, sampleZ);
      return layer.visible && top < maxDepth && bottom > minDepth;
    });

    const visibleMinerals = this.minerals.filter(m =>
      m.depth >= minDepth && m.depth <= maxDepth &&
      this.layers.find(l => l.id === m.layerId)?.visible
    );

    return { layers: visibleLayers, minerals: visibleMinerals };
  }

  queryByRegion(regionId: string): SlicedData {
    const region = this.regions.find(r => r.id === regionId);
    if (!region) return { layers: [], minerals: [] };

    const mineralsInRegion = this.minerals.filter(m => {
      const dx = m.position.x - region.centerX;
      const dz = m.position.z - region.centerZ;
      return Math.sqrt(dx * dx + dz * dz) <= region.radius;
    });

    return { layers: this.layers.filter(l => l.visible), minerals: mineralsInRegion };
  }

  getStatistics() {
    const typeCount = new Map<string, number>();
    const totalReserve = new Map<string, number>();
    this.minerals.forEach(m => {
      typeCount.set(m.name, (typeCount.get(m.name) || 0) + 1);
      totalReserve.set(m.name, (totalReserve.get(m.name) || 0) + m.reserve);
    });
    return {
      totalMinerals: this.minerals.length,
      totalLayers: this.layers.length,
      typeCount: Object.fromEntries(typeCount),
      totalReserve: Object.fromEntries(totalReserve)
    };
  }
}

export const dataProvider = new DataProvider(42);
export default dataProvider;
