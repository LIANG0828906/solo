import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { StarData, ConnectionData, ConstellationData } from '@/types';

const STAR_PRESETS: Omit<StarData, 'id' | 'position'>[] = [
  { name: '赤焰星', color: '#FF6B6B', radius: 25, brightness: 0.9 },
  { name: '幽蓝星', color: '#4ECDC4', radius: 20, brightness: 0.8 },
  { name: '金辉星', color: '#FFD93D', radius: 28, brightness: 1.0 },
  { name: '翠光星', color: '#6BCB77', radius: 22, brightness: 0.7 },
  { name: '紫霞星', color: '#C084FC', radius: 18, brightness: 0.6 },
  { name: '橙晖星', color: '#FB923C', radius: 24, brightness: 0.85 },
  { name: '粉晶星', color: '#F472B6', radius: 19, brightness: 0.65 },
  { name: '银白星', color: '#E2E8F0', radius: 26, brightness: 0.95 },
  { name: '碧渊星', color: '#22D3EE', radius: 21, brightness: 0.75 },
  { name: '玄冥星', color: '#818CF8', radius: 23, brightness: 0.8 },
  { name: '朱雀星', color: '#EF4444', radius: 27, brightness: 0.92 },
  { name: '玄武星', color: '#0EA5E9', radius: 20, brightness: 0.78 },
  { name: '白虎星', color: '#F5F5F4', radius: 30, brightness: 1.0 },
  { name: '青龙星', color: '#34D399', radius: 25, brightness: 0.88 },
  { name: '天狼星', color: '#93C5FD', radius: 29, brightness: 0.97 },
  { name: '参宿星', color: '#FCA5A5', radius: 22, brightness: 0.72 },
];

function mixColors(c1: string, c2: string): string {
  const hex = (s: string) => parseInt(s.slice(1), 16);
  const v1 = hex(c1);
  const v2 = hex(c2);
  const r = Math.round(((v1 >> 16) + (v2 >> 16)) / 2);
  const g = Math.round((((v1 >> 8) & 0xff) + ((v2 >> 8) & 0xff)) / 2);
  const b = Math.round(((v1 & 0xff) + (v2 & 0xff)) / 2);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

const STORAGE_KEY = 'constellation_weaver_constellations';

function loadConstellations(): ConstellationData[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveConstellations(data: ConstellationData[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

interface StarStore {
  libraryStars: StarData[];
  canvasStars: StarData[];
  selectedStarIds: string[];
  addStarToCanvas: (star: Omit<StarData, 'id'>) => string;
  removeStarFromCanvas: (id: string) => void;
  toggleStarSelection: (id: string) => void;
  clearSelection: () => void;
  updateStarBrightness: (id: string, brightness: number) => void;
  setCanvasStars: (stars: StarData[]) => void;
  setSelectedStarIds: (ids: string[]) => void;
}

export const useStarStore = create<StarStore>((set) => ({
  libraryStars: STAR_PRESETS.map((p, i) => ({
    ...p,
    id: `lib_${i}`,
    position: { x: 0, y: 0, z: 0 },
  })),
  canvasStars: [],
  selectedStarIds: [],
  addStarToCanvas: (star) => {
    const id = uuidv4();
    const newStar: StarData = { ...star, id };
    set((state) => ({ canvasStars: [...state.canvasStars, newStar] }));
    return id;
  },
  removeStarFromCanvas: (id) => {
    set((state) => ({
      canvasStars: state.canvasStars.filter((s) => s.id !== id),
      selectedStarIds: state.selectedStarIds.filter((sid) => sid !== id),
    }));
  },
  toggleStarSelection: (id) => {
    set((state) => {
      const isSelected = state.selectedStarIds.includes(id);
      return {
        selectedStarIds: isSelected
          ? state.selectedStarIds.filter((sid) => sid !== id)
          : [...state.selectedStarIds, id],
      };
    });
  },
  clearSelection: () => set({ selectedStarIds: [] }),
  updateStarBrightness: (id, brightness) => {
    set((state) => ({
      canvasStars: state.canvasStars.map((s) =>
        s.id === id ? { ...s, brightness } : s
      ),
    }));
  },
  setCanvasStars: (stars) => set({ canvasStars: stars }),
  setSelectedStarIds: (ids) => set({ selectedStarIds: ids }),
}));

interface ConstellationStore {
  constellations: ConstellationData[];
  activeConstellationId: string | null;
  connections: ConnectionData[];
  addConnection: (starIds: [string, string]) => void;
  removeConnection: (id: string) => void;
  saveConstellation: (name: string, thumbnail: string, stars: StarData[], connections: ConnectionData[]) => void;
  loadConstellation: (id: string) => ConstellationData | null;
  deleteConstellation: (id: string) => void;
  setActiveConstellationId: (id: string | null) => void;
  setConnections: (connections: ConnectionData[]) => void;
}

export const useConstellationStore = create<ConstellationStore>((set, get) => ({
  constellations: loadConstellations(),
  activeConstellationId: null,
  connections: [],
  addConnection: (starIds) => {
    const [s1, s2] = starIds;
    const state = get();
    const star1 = useStarStore.getState().canvasStars.find((s) => s.id === s1);
    const star2 = useStarStore.getState().canvasStars.find((s) => s.id === s2);
    if (!star1 || !star2) return;
    const color = mixColors(star1.color, star2.color);
    const id = uuidv4();
    const connection: ConnectionData = { id, starIds, color };
    set((state) => ({ connections: [...state.connections, connection] }));
  },
  removeConnection: (id) => {
    set((state) => ({
      connections: state.connections.filter((c) => c.id !== id),
    }));
  },
  saveConstellation: (name, thumbnail, stars, connections) => {
    const id = uuidv4();
    const constellation: ConstellationData = {
      id,
      name,
      stars: [...stars],
      connections: [...connections],
      thumbnail,
      createdAt: Date.now(),
    };
    set((state) => {
      const updated = [...state.constellations, constellation];
      saveConstellations(updated);
      return { constellations: updated, activeConstellationId: id };
    });
  },
  loadConstellation: (id) => {
    const state = get();
    const found = state.constellations.find((c) => c.id === id);
    if (!found) return null;
    set({ activeConstellationId: id });
    return found;
  },
  deleteConstellation: (id) => {
    set((state) => {
      const updated = state.constellations.filter((c) => c.id !== id);
      saveConstellations(updated);
      return {
        constellations: updated,
        activeConstellationId:
          state.activeConstellationId === id ? null : state.activeConstellationId,
      };
    });
  },
  setActiveConstellationId: (id) => set({ activeConstellationId: id }),
  setConnections: (connections) => set({ connections }),
}));
