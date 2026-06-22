import { v4 as uuidv4 } from 'uuid';
import type { ArtifactData, FragmentData, RegionType, SiteType } from '../types';

const COLORS: Record<RegionType, string[]> = {
  egypt: ['#D4A574', '#C2956A', '#B8865B', '#A67B4D', '#8B6A3D'],
  greek: ['#E8DCC4', '#D6C9A8', '#C9B896', '#B8A67E', '#A89668'],
  china: ['#8B2500', '#A3421C', '#B85228', '#D46A3A', '#E8854F'],
  maya: ['#4A6741', '#5C7A52', '#6E8B63', '#809C74', '#92AD85'],
  roman: ['#C9A86C', '#B8985C', '#A7884C', '#96783C', '#85682C'],
  mesopotamia: ['#8B7355', '#7A6448', '#69553B', '#58462E', '#473721'],
};

const generateIrregularPolygon = (seed: number, cx: number, cy: number, radius: number): number[][] => {
  const points: number[][] = [];
  const sides = 6 + (seed % 3);
  for (let i = 0; i < sides; i++) {
    const angle = (i / sides) * Math.PI * 2;
    const r = radius * (0.7 + ((seed * (i + 1) * 13) % 30) / 100);
    points.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r]);
  }
  return points;
};

interface Grid2x3 {
  id: string;
  index: number;
  gridPos: { row: number; col: number };
  edges: { north?: string; south?: string; east?: string; west?: string };
  colors: { row: number; col: number };
}

const createFragmentGrid = (
  artifactId: string,
  rows: number,
  cols: number,
  region: RegionType
): FragmentData[] => {
  const palette = COLORS[region];
  const tmpIds: string[][] = [];
  const frags: Grid2x3[] = [];

  for (let r = 0; r < rows; r++) {
    tmpIds[r] = [];
    for (let c = 0; c < cols; c++) {
      tmpIds[r][c] = uuidv4();
    }
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const edges: Grid2x3['edges'] = {};
      if (r > 0) edges.north = tmpIds[r - 1][c];
      if (r < rows - 1) edges.south = tmpIds[r + 1][c];
      if (c > 0) edges.west = tmpIds[r][c - 1];
      if (c < cols - 1) edges.east = tmpIds[r][c + 1];
      frags.push({
        id: tmpIds[r][c],
        index: r * cols + c,
        gridPos: { row: r, col: c },
        edges,
        colors: { row: r, col: c },
      });
    }
  }

  const totalFrags = frags.length;
  return frags.map((f, idx) => {
    const colorIdx = (f.colors.row + f.colors.col) % palette.length;
    const cx = 80 + f.gridPos.col * 110;
    const cy = 80 + f.gridPos.row * 110;
    return {
      id: f.id,
      artifactId,
      index: idx,
      shape: generateIrregularPolygon(idx * 7 + artifactId.length, cx, cy, 48 + (idx % 3) * 5),
      color: palette[colorIdx],
      edgeSignature: {
        ...(f.edges.north ? { north: { matchId: f.edges.north, angle: 0 } } : {}),
        ...(f.edges.south ? { south: { matchId: f.edges.south, angle: 180 } } : {}),
        ...(f.edges.east ? { east: { matchId: f.edges.east, angle: 90 } } : {}),
        ...(f.edges.west ? { west: { matchId: f.edges.west, angle: 270 } } : {}),
      },
      initialRotation: [0, 45, 90, 135, 180, 225, 270, 315][idx % 8],
      initialFlipped: idx % 3 === 0,
    } satisfies FragmentData;
    void totalFrags;
  });
};

const ARTIFACT_CONFIGS: Array<{
  name: string;
  region: RegionType;
  era: string;
  site: SiteType;
  backgroundType: string;
  rows: number;
  cols: number;
}> = [
  {
    name: '法老黄金面具',
    region: 'egypt',
    era: '公元前1323年',
    site: 'desert',
    backgroundType: 'egypt-sunset',
    rows: 3,
    cols: 2,
  },
  {
    name: '斯芬克斯石雕',
    region: 'egypt',
    era: '公元前2500年',
    site: 'desert',
    backgroundType: 'egypt-sunset',
    rows: 2,
    cols: 3,
  },
  {
    name: '雅典雅典娜女神像',
    region: 'greek',
    era: '公元前438年',
    site: 'jungle',
    backgroundType: 'greek-aegean',
    rows: 2,
    cols: 3,
  },
  {
    name: '奥林匹亚青铜头盔',
    region: 'greek',
    era: '公元前500年',
    site: 'jungle',
    backgroundType: 'greek-aegean',
    rows: 2,
    cols: 3,
  },
  {
    name: '商代青铜鼎',
    region: 'china',
    era: '公元前1200年',
    site: 'ocean',
    backgroundType: 'china-palace',
    rows: 2,
    cols: 3,
  },
  {
    name: '唐三彩骆驼俑',
    region: 'china',
    era: '公元700年',
    site: 'ocean',
    backgroundType: 'china-palace',
    rows: 2,
    cols: 3,
  },
  {
    name: '玛雅太阳石碑',
    region: 'maya',
    era: '公元300年',
    site: 'jungle',
    backgroundType: 'maya-jungle',
    rows: 2,
    cols: 3,
  },
  {
    name: '罗马角斗士短剑',
    region: 'roman',
    era: '公元100年',
    site: 'desert',
    backgroundType: 'roman-colosseum',
    rows: 2,
    cols: 3,
  },
  {
    name: '楔形文字泥板',
    region: 'mesopotamia',
    era: '公元前2000年',
    site: 'ocean',
    backgroundType: 'mesopotamia-ziggurat',
    rows: 2,
    cols: 3,
  },
];

const makeThumbnail = (region: RegionType, name: string): string => {
  const palette = COLORS[region];
  const grad = `linear-gradient(135deg, ${palette[0]} 0%, ${palette[2]} 50%, ${palette[4]} 100%)`;
  void grad;
  return encodeURIComponent(name.substring(0, 2));
};

export const generateAllArtifacts = (): ArtifactData[] => {
  return ARTIFACT_CONFIGS.map((cfg) => {
    const id = uuidv4();
    const fragments = createFragmentGrid(id, cfg.rows, cfg.cols, cfg.region);
    return {
      id,
      name: cfg.name,
      region: cfg.region,
      era: cfg.era,
      fragmentCount: fragments.length,
      fragments,
      thumbnail: makeThumbnail(cfg.region, cfg.name),
      backgroundType: cfg.backgroundType,
      site: cfg.site,
    };
  });
};

export const ALL_ARTIFACTS = generateAllArtifacts();

export const getArtifactsBySite = (site: SiteType): ArtifactData[] => {
  return ALL_ARTIFACTS.filter((a) => a.site === site);
};

export const getRandomArtifactForSite = (site: SiteType): ArtifactData => {
  const list = getArtifactsBySite(site);
  return list[Math.floor(Math.random() * list.length)];
};

export const getArtifactById = (id: string): ArtifactData | undefined => {
  return ALL_ARTIFACTS.find((a) => a.id === id);
};

export const getFragmentById = (fragmentId: string): FragmentData | undefined => {
  for (const a of ALL_ARTIFACTS) {
    const frag = a.fragments.find((f) => f.id === fragmentId);
    if (frag) return frag;
  }
  return undefined;
};
