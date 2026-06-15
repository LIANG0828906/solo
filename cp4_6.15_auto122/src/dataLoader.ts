import type { Species, SpeciesTreeLayer, RenderableSpecies, EnvParams } from './types';

const SPECIES_DATA: Species[] = [
  {
    id: 'sp-001',
    name: '珊瑚礁鱼类',
    latinName: 'Chaetodon spp.',
    category: 'shallow',
    preferredTemp: [22, 28],
    preferredSalinity: [34, 37],
    baseDepth: 5,
    depthRange: [0, 30],
    color: '#ff6b35',
    samplePoints: [
      { lat: 18.2, lng: 109.5, depth: 5, abundance: 0.92, season: 'summer' },
      { lat: 18.5, lng: 110.2, depth: 8, abundance: 0.85, season: 'summer' },
      { lat: 19.0, lng: 109.8, depth: 12, abundance: 0.65, season: 'autumn' },
      { lat: 18.8, lng: 110.5, depth: 6, abundance: 0.88, season: 'spring' },
      { lat: 18.3, lng: 109.9, depth: 15, abundance: 0.45, season: 'winter' },
    ],
  },
  {
    id: 'sp-002',
    name: '小丑鱼',
    latinName: 'Amphiprion ocellaris',
    category: 'shallow',
    preferredTemp: [24, 28],
    preferredSalinity: [33, 36],
    baseDepth: 3,
    depthRange: [0, 15],
    color: '#ff9a3c',
    samplePoints: [
      { lat: 18.4, lng: 109.6, depth: 3, abundance: 0.78, season: 'summer' },
      { lat: 18.6, lng: 110.0, depth: 5, abundance: 0.82, season: 'spring' },
      { lat: 18.9, lng: 109.7, depth: 8, abundance: 0.55, season: 'autumn' },
      { lat: 18.7, lng: 110.3, depth: 4, abundance: 0.90, season: 'summer' },
    ],
  },
  {
    id: 'sp-003',
    name: '海龟',
    latinName: 'Chelonia mydas',
    category: 'shallow',
    preferredTemp: [20, 28],
    preferredSalinity: [33, 37],
    baseDepth: 10,
    depthRange: [0, 40],
    color: '#ffd166',
    samplePoints: [
      { lat: 18.1, lng: 109.4, depth: 10, abundance: 0.35, season: 'summer' },
      { lat: 18.7, lng: 110.1, depth: 15, abundance: 0.28, season: 'spring' },
      { lat: 19.2, lng: 109.6, depth: 20, abundance: 0.15, season: 'autumn' },
      { lat: 18.5, lng: 110.4, depth: 8, abundance: 0.42, season: 'summer' },
      { lat: 18.3, lng: 109.8, depth: 12, abundance: 0.30, season: 'winter' },
      { lat: 18.9, lng: 110.0, depth: 25, abundance: 0.12, season: 'spring' },
    ],
  },
  {
    id: 'sp-004',
    name: '水母',
    latinName: 'Aurelia aurita',
    category: 'mid',
    preferredTemp: [15, 24],
    preferredSalinity: [33, 37],
    baseDepth: 50,
    depthRange: [10, 200],
    color: '#7b68ee',
    samplePoints: [
      { lat: 18.0, lng: 109.3, depth: 50, abundance: 0.68, season: 'spring' },
      { lat: 18.5, lng: 110.0, depth: 80, abundance: 0.55, season: 'summer' },
      { lat: 19.0, lng: 109.5, depth: 120, abundance: 0.35, season: 'autumn' },
      { lat: 18.8, lng: 110.2, depth: 60, abundance: 0.72, season: 'spring' },
      { lat: 18.3, lng: 109.7, depth: 100, abundance: 0.42, season: 'winter' },
    ],
  },
  {
    id: 'sp-005',
    name: '鱿鱼',
    latinName: 'Loligo vulgaris',
    category: 'mid',
    preferredTemp: [12, 22],
    preferredSalinity: [34, 38],
    baseDepth: 100,
    depthRange: [30, 300],
    color: '#4ecdc4',
    samplePoints: [
      { lat: 18.2, lng: 109.5, depth: 100, abundance: 0.58, season: 'summer' },
      { lat: 18.6, lng: 110.1, depth: 150, abundance: 0.45, season: 'autumn' },
      { lat: 19.1, lng: 109.4, depth: 200, abundance: 0.30, season: 'winter' },
      { lat: 18.4, lng: 110.3, depth: 80, abundance: 0.65, season: 'spring' },
    ],
  },
  {
    id: 'sp-006',
    name: '灯笼鱼',
    latinName: 'Myctophidae spp.',
    category: 'deep',
    preferredTemp: [5, 15],
    preferredSalinity: [34, 38],
    baseDepth: 500,
    depthRange: [200, 1000],
    color: '#00b4d8',
    samplePoints: [
      { lat: 18.0, lng: 109.2, depth: 500, abundance: 0.72, season: 'spring' },
      { lat: 18.4, lng: 109.8, depth: 600, abundance: 0.65, season: 'summer' },
      { lat: 18.8, lng: 110.0, depth: 800, abundance: 0.40, season: 'autumn' },
      { lat: 19.0, lng: 109.5, depth: 400, abundance: 0.80, season: 'winter' },
      { lat: 18.6, lng: 110.2, depth: 700, abundance: 0.55, season: 'spring' },
    ],
  },
  {
    id: 'sp-007',
    name: '深海章鱼',
    latinName: 'Graneledone verrucosa',
    category: 'deep',
    preferredTemp: [2, 10],
    preferredSalinity: [34, 37],
    baseDepth: 800,
    depthRange: [500, 2000],
    color: '#0077b6',
    samplePoints: [
      { lat: 18.1, lng: 109.3, depth: 800, abundance: 0.45, season: 'winter' },
      { lat: 18.5, lng: 109.9, depth: 1200, abundance: 0.30, season: 'spring' },
      { lat: 18.9, lng: 110.1, depth: 1000, abundance: 0.38, season: 'autumn' },
      { lat: 18.3, lng: 109.6, depth: 600, abundance: 0.52, season: 'summer' },
    ],
  },
  {
    id: 'sp-008',
    name: '管虫',
    latinName: 'Riftia pachyptila',
    category: 'deep',
    preferredTemp: [2, 8],
    preferredSalinity: [34, 37],
    baseDepth: 1500,
    depthRange: [800, 3000],
    color: '#023e8a',
    samplePoints: [
      { lat: 18.2, lng: 109.4, depth: 1500, abundance: 0.62, season: 'winter' },
      { lat: 18.6, lng: 110.0, depth: 2000, abundance: 0.48, season: 'spring' },
      { lat: 19.0, lng: 109.6, depth: 1800, abundance: 0.55, season: 'autumn' },
      { lat: 18.4, lng: 110.2, depth: 1200, abundance: 0.35, season: 'summer' },
    ],
  },
  {
    id: 'sp-009',
    name: '海葵',
    latinName: 'Actiniaria spp.',
    category: 'shallow',
    preferredTemp: [18, 26],
    preferredSalinity: [33, 37],
    baseDepth: 8,
    depthRange: [2, 50],
    color: '#ef476f',
    samplePoints: [
      { lat: 18.3, lng: 109.7, depth: 8, abundance: 0.82, season: 'summer' },
      { lat: 18.7, lng: 110.2, depth: 12, abundance: 0.70, season: 'spring' },
      { lat: 19.1, lng: 109.5, depth: 20, abundance: 0.45, season: 'autumn' },
      { lat: 18.5, lng: 110.4, depth: 6, abundance: 0.88, season: 'summer' },
    ],
  },
  {
    id: 'sp-010',
    name: '深海虾',
    latinName: 'Rimicaris exoculata',
    category: 'deep',
    preferredTemp: [5, 15],
    preferredSalinity: [34, 38],
    baseDepth: 1200,
    depthRange: [600, 2500],
    color: '#48bfe3',
    samplePoints: [
      { lat: 18.0, lng: 109.1, depth: 1200, abundance: 0.55, season: 'winter' },
      { lat: 18.4, lng: 109.7, depth: 1500, abundance: 0.42, season: 'spring' },
      { lat: 18.8, lng: 110.3, depth: 1000, abundance: 0.60, season: 'autumn' },
      { lat: 19.2, lng: 109.3, depth: 1800, abundance: 0.30, season: 'summer' },
    ],
  },
  {
    id: 'sp-011',
    name: '金枪鱼',
    latinName: 'Thunnus thynnus',
    category: 'mid',
    preferredTemp: [15, 25],
    preferredSalinity: [34, 37],
    baseDepth: 60,
    depthRange: [10, 200],
    color: '#5e60ce',
    samplePoints: [
      { lat: 18.1, lng: 109.5, depth: 60, abundance: 0.50, season: 'summer' },
      { lat: 18.5, lng: 110.1, depth: 80, abundance: 0.45, season: 'spring' },
      { lat: 18.9, lng: 109.3, depth: 100, abundance: 0.38, season: 'autumn' },
      { lat: 18.7, lng: 110.4, depth: 50, abundance: 0.55, season: 'summer' },
      { lat: 18.3, lng: 109.9, depth: 120, abundance: 0.32, season: 'winter' },
    ],
  },
  {
    id: 'sp-012',
    name: '海绵',
    latinName: 'Porifera spp.',
    category: 'mid',
    preferredTemp: [10, 20],
    preferredSalinity: [34, 38],
    baseDepth: 150,
    depthRange: [30, 500],
    color: '#6930c3',
    samplePoints: [
      { lat: 18.2, lng: 109.6, depth: 150, abundance: 0.62, season: 'spring' },
      { lat: 18.6, lng: 110.0, depth: 200, abundance: 0.50, season: 'winter' },
      { lat: 19.0, lng: 109.8, depth: 250, abundance: 0.38, season: 'autumn' },
      { lat: 18.4, lng: 110.3, depth: 100, abundance: 0.70, season: 'summer' },
    ],
  },
];

function latLngToWorld(lat: number, lng: number): [number, number] {
  const x = (lng - 110) * 40;
  const z = (lat - 18.5) * 40;
  return [x, z];
}

function depthToWorld(depth: number): number {
  return -depth * 0.5;
}

export function loadSpeciesData(): Species[] {
  return SPECIES_DATA;
}

export function formatToTree(species: Species[]): SpeciesTreeLayer[] {
  const layers: SpeciesTreeLayer[] = [
    { depth: 'shallow', label: '浅海层 (0-200m)', species: [] },
    { depth: 'mid', label: '中层 (200-1000m)', species: [] },
    { depth: 'deep', label: '深海层 (1000m+)', species: [] },
  ];
  for (const sp of species) {
    const layer = layers.find((l) => l.depth === sp.category);
    if (layer) layer.species.push(sp);
  }
  return layers;
}

export function speciesToRenderable(
  species: Species[],
  envParams: EnvParams
): RenderableSpecies[] {
  const results: RenderableSpecies[] = [];
  for (const sp of species) {
    for (const pt of sp.samplePoints) {
      const [wx, wz] = latLngToWorld(pt.lat, pt.lng);
      const wy = depthToWorld(pt.depth);
      const tempFit = gaussianFit(
        envParams.temperature,
        sp.preferredTemp[0],
        sp.preferredTemp[1]
      );
      const salFit = gaussianFit(
        envParams.salinity,
        sp.preferredSalinity[0],
        sp.preferredSalinity[1]
      );
      const lightFactor =
        pt.depth < envParams.lightPenetration
          ? 1.0
          : Math.max(0.3, 1.0 - (pt.depth - envParams.lightPenetration) / 200);
      const fitness = tempFit * salFit * lightFactor;
      const depthOpacity = Math.max(
        0.15,
        1.0 - (pt.depth / 3000) * 0.85
      );
      results.push({
        speciesId: sp.id,
        position: [wx, wy, wz],
        scale: 0.3 + pt.abundance * fitness * 0.7,
        opacity: depthOpacity * (0.4 + fitness * 0.6),
        color: sp.color,
        name: sp.name,
        latinName: sp.latinName,
        depth: pt.depth,
        abundance: pt.abundance * fitness,
        category: sp.category,
        preferredTemp: sp.preferredTemp,
      });
    }
  }
  return results;
}

function gaussianFit(value: number, min: number, max: number): number {
  const mid = (min + max) / 2;
  const sigma = (max - min) / 2;
  const diff = value - mid;
  return Math.exp(-(diff * diff) / (2 * sigma * sigma));
}

export async function loadSpeciesFromAPI(): Promise<Species[]> {
  return SPECIES_DATA;
}
