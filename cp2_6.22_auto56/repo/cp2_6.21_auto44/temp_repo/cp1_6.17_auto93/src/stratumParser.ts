import { create } from 'zustand';
import * as THREE from 'three';

export interface StratumData {
  id: string;
  name: string;
  thickness: number;
  color: string;
  density: number;
  minerals: string;
  textureType: 'noise' | 'stripes' | 'mixed';
}

export interface ParsedStratum extends StratumData {
  index: number;
  depthStart: number;
  depthEnd: number;
  yPosition: number;
}

export interface AppState {
  strata: ParsedStratum[];
  selectedStratumId: string | null;
  cutDepth: number;
  stratumOpacities: Record<string, number>;
  hoveredStratumId: string | null;
  infoCard: {
    visible: boolean;
    stratumId: string | null;
    screenX: number;
    screenY: number;
  } | null;
  setSelectedStratum: (id: string | null) => void;
  setCutDepth: (depth: number) => void;
  setStratumOpacity: (id: string, opacity: number) => void;
  setHoveredStratum: (id: string | null) => void;
  showInfoCard: (stratumId: string, screenX: number, screenY: number) => void;
  hideInfoCard: () => void;
}

const PRESET_STRATA: StratumData[] = [
  {
    id: 'stratum-0',
    name: '表土层',
    thickness: 1.5,
    color: '#8B5E3C',
    density: 1.8,
    minerals: '腐殖质、黏土、砂粒',
    textureType: 'noise'
  },
  {
    id: 'stratum-1',
    name: '砂岩层',
    thickness: 2.0,
    color: '#D2B48C',
    density: 2.3,
    minerals: '石英、长石、云母',
    textureType: 'stripes'
  },
  {
    id: 'stratum-2',
    name: '石灰岩层',
    thickness: 2.5,
    color: '#C0C0C0',
    density: 2.7,
    minerals: '方解石、白云石、燧石',
    textureType: 'mixed'
  },
  {
    id: 'stratum-3',
    name: '页岩层',
    thickness: 1.8,
    color: '#696969',
    density: 2.6,
    minerals: '黏土矿物、石英、有机碳',
    textureType: 'stripes'
  },
  {
    id: 'stratum-4',
    name: '花岗岩层',
    thickness: 2.2,
    color: '#808080',
    density: 2.75,
    minerals: '石英、长石、黑云母',
    textureType: 'noise'
  },
  {
    id: 'stratum-5',
    name: '玄武岩层',
    thickness: 2.0,
    color: '#2F4F4F',
    density: 3.0,
    minerals: '辉石、橄榄石、斜长石',
    textureType: 'mixed'
  }
];

const TOTAL_HEIGHT = 12;

export function parseStrata(data: StratumData[]): ParsedStratum[] {
  const totalThickness = data.reduce((sum, s) => sum + s.thickness, 0);
  let cumulativeDepth = 0;

  return data.map((stratum, index) => {
    const scaledThickness = (stratum.thickness / totalThickness) * TOTAL_HEIGHT;
    const depthStart = cumulativeDepth;
    const depthEnd = cumulativeDepth + scaledThickness;
    const yPosition = TOTAL_HEIGHT / 2 - depthStart - scaledThickness / 2;
    cumulativeDepth = depthEnd;

    return {
      ...stratum,
      thickness: scaledThickness,
      index,
      depthStart,
      depthEnd,
      yPosition
    };
  });
}

export function getPresetStrata(): ParsedStratum[] {
  return parseStrata(PRESET_STRATA);
}

const initialStrata = getPresetStrata();
const initialOpacities: Record<string, number> = {};
initialStrata.forEach(s => {
  initialOpacities[s.id] = 85;
});

export const useAppStore = create<AppState>((set) => ({
  strata: initialStrata,
  selectedStratumId: null,
  cutDepth: 0,
  stratumOpacities: initialOpacities,
  hoveredStratumId: null,
  infoCard: null,
  setSelectedStratum: (id) => set({ selectedStratumId: id }),
  setCutDepth: (depth) => set({ cutDepth: Math.max(0, Math.min(100, depth)) }),
  setStratumOpacity: (id, opacity) =>
    set((state) => ({
      stratumOpacities: {
        ...state.stratumOpacities,
        [id]: Math.max(0, Math.min(100, opacity))
      }
    })),
  setHoveredStratum: (id) => set({ hoveredStratumId: id }),
  showInfoCard: (stratumId, screenX, screenY) =>
    set({
      infoCard: {
        visible: true,
        stratumId,
        screenX,
        screenY
      }
    }),
  hideInfoCard: () => set({ infoCard: null })
}));
