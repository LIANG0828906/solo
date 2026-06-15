import type { Species, SpeciesTreeLayer, RenderableSpecies, EnvParams, SamplePoint } from './types';

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
    samplePoints: generateSamplePoints(18.5, 110, 5, 30, 0.75, 8),
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
    samplePoints: generateSamplePoints(18.6, 110.1, 3, 15, 0.72, 6),
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
    samplePoints: generateSamplePoints(18.4, 109.8, 10, 40, 0.32, 7),
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
    samplePoints: generateSamplePoints(18.3, 109.9, 50, 200, 0.58, 8),
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
    samplePoints: generateSamplePoints(18.5, 109.7, 100, 300, 0.48, 7),
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
    samplePoints: generateSamplePoints(18.4, 109.8, 500, 1000, 0.55, 9),
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
    samplePoints: generateSamplePoints(18.5, 109.9, 800, 2000, 0.42, 6),
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
    samplePoints: generateSamplePoints(18.6, 109.8, 1500, 3000, 0.52, 7),
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
    samplePoints: generateSamplePoints(18.7, 110, 8, 50, 0.72, 6),
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
    samplePoints: generateSamplePoints(18.2, 109.4, 1200, 2500, 0.48, 7),
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
    samplePoints: generateSamplePoints(18.5, 109.6, 60, 200, 0.45, 8),
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
    samplePoints: generateSamplePoints(18.4, 109.5, 150, 500, 0.55, 7),
  },
  {
    id: 'sp-013',
    name: '海马',
    latinName: 'Hippocampus spp.',
    category: 'shallow',
    preferredTemp: [20, 26],
    preferredSalinity: [33, 36],
    baseDepth: 12,
    depthRange: [0, 40],
    color: '#ffc857',
    samplePoints: generateSamplePoints(18.8, 110.2, 12, 40, 0.38, 5),
  },
  {
    id: 'sp-014',
    name: '皇带鱼',
    latinName: 'Regalecus glesne',
    category: 'deep',
    preferredTemp: [4, 12],
    preferredSalinity: [34, 37],
    baseDepth: 700,
    depthRange: [200, 1200],
    color: '#90e0ef',
    samplePoints: generateSamplePoints(18.3, 109.5, 700, 1200, 0.28, 6),
  },
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function generateSamplePoints(
  centerLat: number,
  centerLng: number,
  baseDepth: number,
  maxDepth: number,
  baseAbundance: number,
  count: number
): SamplePoint[] {
  const seasons: SamplePoint['season'][] = ['spring', 'summer', 'autumn', 'winter'];
  const rand = seededRandom(Math.floor(centerLat * 1000 + centerLng * 100 + baseDepth));
  const points: SamplePoint[] = [];
  for (let i = 0; i < count; i++) {
    const latOffset = (rand() - 0.5) * 2.0;
    const lngOffset = (rand() - 0.5) * 2.0;
    const depth =
      Math.max(0, baseDepth + (rand() - 0.5) * Math.min(maxDepth, baseDepth * 2));
    const seasonAbundanceFactor =
      seasons[i % seasons.length] === 'summer'
        ? 1.1
        : seasons[i % seasons.length] === 'winter'
        ? 0.8
        : 1.0;
    const abundance = Math.max(
      0.05,
      Math.min(1, baseAbundance * seasonAbundanceFactor + (rand() - 0.5) * 0.3)
    );
    points.push({
      lat: centerLat + latOffset,
      lng: centerLng + lngOffset,
      depth,
      abundance,
      season: seasons[i % seasons.length],
    });
  }
  return points;
}

export function loadSpeciesData(): Species[] {
  return SPECIES_DATA;
}

export async function loadSpeciesDataAsync(): Promise<Species[]> {
  await new Promise((resolve) => setTimeout(resolve, 50));
  return SPECIES_DATA;
}

export async function loadSpeciesFromAPI(
  apiUrl: string = '/api/species'
): Promise<Species[]> {
  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = (await response.json()) as Species[];
    return validateSpeciesData(data);
  } catch (_err) {
    return SPECIES_DATA;
  }
}

function validateSpeciesData(data: Species[]): Species[] {
  if (!Array.isArray(data)) return SPECIES_DATA;
  return data.filter(
    (sp) =>
      sp &&
      typeof sp.id === 'string' &&
      typeof sp.name === 'string' &&
      Array.isArray(sp.samplePoints)
  );
}

export function formatToTree(species: Species[]): SpeciesTreeLayer[] {
  const layers: SpeciesTreeLayer[] = [
    { depth: 'shallow', label: '浅海层 (0-200m)', species: [] },
    { depth: 'mid', label: '中层 (200-1000m)', species: [] },
    { depth: 'deep', label: '深海层 (1000m+)', species: [] },
  ];
  for (const sp of species) {
    if (sp.category === 'shallow') layers[0].species.push(sp);
    else if (sp.category === 'mid') layers[1].species.push(sp);
    else if (sp.category === 'deep') layers[2].species.push(sp);
  }
  return layers;
}

export function buildHierarchicalTree(species: Species[]) {
  return {
    name: '海洋生态系统',
    children: [
      {
        name: '浅海层',
        depthRange: [0, 200],
        species: species.filter((s) => s.category === 'shallow'),
      },
      {
        name: '中层',
        depthRange: [200, 1000],
        species: species.filter((s) => s.category === 'mid'),
      },
      {
        name: '深海层',
        depthRange: [1000, 5000],
        species: species.filter((s) => s.category === 'deep'),
      },
    ],
  };
}

function gaussianFit(value: number, min: number, max: number): number {
  const mid = (min + max) / 2;
  const sigma = (max - min) / 2;
  const diff = value - mid;
  return Math.exp(-(diff * diff) / (2 * sigma * sigma));
}

export function latLngDepthToWorld(
  lat: number,
  lng: number,
  depth: number,
  scale = 40,
  depthScale = 0.06
): [number, number, number] {
  const x = (lng - 110) * scale;
  const y = -depth * depthScale;
  const z = (lat - 18.5) * scale;
  return [x, y, z];
}

export function speciesToRenderable(
  species: Species[],
  envParams: EnvParams
): RenderableSpecies[] {
  const results: RenderableSpecies[] = [];
  const { temperature, salinity, lightPenetration } = envParams;
  for (const sp of species) {
    const [tMin, tMax] = sp.preferredTemp;
    const [sMin, sMax] = sp.preferredSalinity;
    const tempOptimal = (tMin + tMax) / 2;
    const isWarmSpecies = tempOptimal >= 20;
    const isColdSpecies = tempOptimal < 12;
    for (const pt of sp.samplePoints) {
      const tempFit = gaussianFit(temperature, tMin, tMax);
      const salFit = gaussianFit(salinity, sMin, sMax);
      const lightFactor =
        pt.depth < lightPenetration
          ? 1.0
          : Math.max(0.25, 1 - (pt.depth - lightPenetration) / 220);
      const tempDiff = temperature - tempOptimal;
      let depthBias = 0;
      if (isWarmSpecies && tempDiff > 0) {
        depthBias = tempDiff * 6;
      } else if (isColdSpecies && tempDiff > 0) {
        depthBias = tempDiff * 10;
      } else if (isColdSpecies && tempDiff < 0) {
        depthBias = tempDiff * 5;
      }
      const adjustedDepth = Math.max(0, pt.depth + depthBias);
      const fitness = Math.max(0.1, tempFit * salFit * lightFactor);
      const depthOpacity = Math.max(
        0.25,
        1 - (adjustedDepth / 3200) * 0.65
      );
      const [wx, wy, wz] = latLngDepthToWorld(pt.lat, pt.lng, adjustedDepth);
      const finalAbundance = Math.min(1, pt.abundance * fitness);
      results.push({
        speciesId: sp.id,
        position: [wx, wy, wz],
        scale: 0.22 + finalAbundance * 0.78,
        opacity: depthOpacity * (0.38 + fitness * 0.62),
        color: sp.color,
        name: sp.name,
        latinName: sp.latinName,
        depth: adjustedDepth,
        abundance: finalAbundance,
        category: sp.category,
        preferredTemp: sp.preferredTemp,
      });
    }
  }
  return results;
}

export function getCategoryStats(species: Species[]) {
  const shallow = species.filter((s) => s.category === 'shallow').length;
  const mid = species.filter((s) => s.category === 'mid').length;
  const deep = species.filter((s) => s.category === 'deep').length;
  return { shallow, mid, deep, total: species.length };
}
