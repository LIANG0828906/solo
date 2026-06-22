import { create } from 'zustand';

export interface WallDefinition {
  id: string;
  start: [number, number];
  end: [number, number];
  height: number;
  reflectance: number;
}

export interface FurnitureDefinition {
  id: string;
  type: string;
  position: [number, number, number];
  size: [number, number, number];
  reflectance: number;
}

export interface RoomGeometry {
  width: number;
  depth: number;
  height: number;
  walls: WallDefinition[];
  furniture: FurnitureDefinition[];
}

export interface LightFixture {
  id: string;
  type: 'point' | 'area';
  position: [number, number, number];
  intensity: number;
  colorTemperature: number;
  power: number;
  enabled: boolean;
}

export interface SceneParams {
  location: 'beijing' | 'shanghai' | 'london' | 'newyork';
  date: string;
  time: number;
  weather: 'clear' | 'cloudy' | 'overcast';
  lights: LightFixture[];
}

export interface MonitorPoint {
  id: string;
  position: [number, number, number];
  surfaceId: string;
  illuminance: number;
  colorTemperature: number;
  nearestLightDistance: number;
  isPinned: boolean;
}

export interface Snapshot {
  id: string;
  name: string;
  date: string;
  params: SceneParams;
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  monitorPoints: MonitorPoint[];
  thumbnail: string;
}

export interface ChartDataPoint {
  time: number;
  [key: string]: number;
}

interface StoreState {
  roomGeometry: RoomGeometry | null;
  sceneParams: SceneParams;
  monitorPoints: MonitorPoint[];
  selectedPoint: MonitorPoint | null;
  snapshots: Snapshot[];
  chartData: ChartDataPoint[];
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  heatmapTexture: HTMLCanvasElement | null;
  isMobilePanelOpen: boolean;
}

interface StoreActions {
  setRoomGeometry: (geo: RoomGeometry | null) => void;
  setLocation: (loc: SceneParams['location']) => void;
  setDate: (d: string) => void;
  setTime: (t: number) => void;
  setWeather: (w: SceneParams['weather']) => void;
  addLight: (light: LightFixture) => void;
  removeLight: (id: string) => void;
  updateLight: (id: string, updates: Partial<LightFixture>) => void;
  setSelectedPoint: (point: MonitorPoint | null) => void;
  pinMonitorPoint: (id: string) => void;
  unpinMonitorPoint: (id: string) => void;
  updateMonitorPointIlluminance: (id: string, illuminance: number, colorTemp: number, nearestDist: number) => void;
  addChartDataPoint: (point: ChartDataPoint) => void;
  saveSnapshot: (name: string, thumbnail: string) => void;
  loadSnapshot: (id: string) => void;
  deleteSnapshot: (id: string) => void;
  exportSnapshot: (id: string) => string;
  importSnapshot: (json: string) => void;
  setCameraPosition: (pos: [number, number, number]) => void;
  setCameraTarget: (target: [number, number, number]) => void;
  setHeatmapTexture: (canvas: HTMLCanvasElement | null) => void;
  toggleMobilePanel: () => void;
}

function loadSnapshotsFromStorage(): Snapshot[] {
  try {
    const raw = localStorage.getItem('archlight-snapshots');
    if (raw) {
      return JSON.parse(raw) as Snapshot[];
    }
  } catch {}
  return [];
}

function persistSnapshots(snapshots: Snapshot[]) {
  try {
    localStorage.setItem('archlight-snapshots', JSON.stringify(snapshots));
  } catch {}
}

export const useStore = create<StoreState & StoreActions>()((set, get) => ({
  roomGeometry: null,
  sceneParams: {
    location: 'beijing',
    date: '2026-06-13',
    time: 12,
    weather: 'clear',
    lights: [],
  },
  monitorPoints: [],
  selectedPoint: null,
  snapshots: loadSnapshotsFromStorage(),
  chartData: [],
  cameraPosition: [8, 8, 8],
  cameraTarget: [0, 0, 0],
  heatmapTexture: null,
  isMobilePanelOpen: false,

  setRoomGeometry: (geo) => set({ roomGeometry: geo }),

  setLocation: (loc) =>
    set((s) => ({ sceneParams: { ...s.sceneParams, location: loc } })),

  setDate: (d) =>
    set((s) => ({ sceneParams: { ...s.sceneParams, date: d } })),

  setTime: (t) =>
    set((s) => ({ sceneParams: { ...s.sceneParams, time: t } })),

  setWeather: (w) =>
    set((s) => ({ sceneParams: { ...s.sceneParams, weather: w } })),

  addLight: (light) =>
    set((s) => ({
      sceneParams: { ...s.sceneParams, lights: [...s.sceneParams.lights, light] },
    })),

  removeLight: (id) =>
    set((s) => ({
      sceneParams: {
        ...s.sceneParams,
        lights: s.sceneParams.lights.filter((l) => l.id !== id),
      },
    })),

  updateLight: (id, updates) =>
    set((s) => ({
      sceneParams: {
        ...s.sceneParams,
        lights: s.sceneParams.lights.map((l) =>
          l.id === id ? { ...l, ...updates } : l
        ),
      },
    })),

  setSelectedPoint: (point) => set({ selectedPoint: point }),

  pinMonitorPoint: (id) =>
    set((s) => ({
      monitorPoints: s.monitorPoints.map((p) =>
        p.id === id ? { ...p, isPinned: true } : p
      ),
    })),

  unpinMonitorPoint: (id) =>
    set((s) => ({
      monitorPoints: s.monitorPoints.map((p) =>
        p.id === id ? { ...p, isPinned: false } : p
      ),
    })),

  updateMonitorPointIlluminance: (id, illuminance, colorTemp, nearestDist) =>
    set((s) => ({
      monitorPoints: s.monitorPoints.map((p) =>
        p.id === id
          ? { ...p, illuminance, colorTemperature: colorTemp, nearestLightDistance: nearestDist }
          : p
      ),
    })),

  addChartDataPoint: (point) =>
    set((s) => ({ chartData: [...s.chartData, point] })),

  saveSnapshot: (name, thumbnail) => {
    const s = get();
    const snapshot: Snapshot = {
      id: crypto.randomUUID(),
      name,
      date: new Date().toISOString(),
      params: { ...s.sceneParams, lights: [...s.sceneParams.lights] },
      cameraPosition: [...s.cameraPosition] as [number, number, number],
      cameraTarget: [...s.cameraTarget] as [number, number, number],
      monitorPoints: s.monitorPoints.filter((p) => p.isPinned).map((p) => ({ ...p })),
      thumbnail,
    };
    const next = [...s.snapshots, snapshot];
    persistSnapshots(next);
    set({ snapshots: next });
  },

  loadSnapshot: (id) => {
    const snapshot = get().snapshots.find((sn) => sn.id === id);
    if (!snapshot) return;
    set({
      sceneParams: { ...snapshot.params, lights: [...snapshot.params.lights] },
      cameraPosition: [...snapshot.cameraPosition] as [number, number, number],
      cameraTarget: [...snapshot.cameraTarget] as [number, number, number],
      monitorPoints: snapshot.monitorPoints.map((p) => ({ ...p })),
    });
  },

  deleteSnapshot: (id) => {
    const next = get().snapshots.filter((sn) => sn.id !== id);
    persistSnapshots(next);
    set({ snapshots: next });
  },

  exportSnapshot: (id) => {
    const snapshot = get().snapshots.find((sn) => sn.id === id);
    return snapshot ? JSON.stringify(snapshot) : '';
  },

  importSnapshot: (json) => {
    try {
      const snapshot = JSON.parse(json) as Snapshot;
      if (!snapshot.id || !snapshot.params) return;
      const s = get();
      const exists = s.snapshots.some((sn) => sn.id === snapshot.id);
      const next = exists ? s.snapshots : [...s.snapshots, snapshot];
      persistSnapshots(next);
      set({ snapshots: next });
    } catch {}
  },

  setCameraPosition: (pos) => set({ cameraPosition: pos }),

  setCameraTarget: (target) => set({ cameraTarget: target }),

  setHeatmapTexture: (canvas) => set({ heatmapTexture: canvas }),

  toggleMobilePanel: () => set((s) => ({ isMobilePanelOpen: !s.isMobilePanelOpen })),
}));
