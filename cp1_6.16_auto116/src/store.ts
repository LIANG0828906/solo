import { create } from 'zustand';

export interface Trail {
  id: string;
  name: string;
  createdAt: number;
  constellationIds: string[];
  colorStart: string;
  colorEnd: string;
  thumbnail: string;
}

interface AppState {
  selectedConstellation: string | null;
  connectedConstellations: string[];
  savedTrails: Trail[];
  currentColorStart: string;
  currentColorEnd: string;
  starBrightness: number;
  nebulaDensity: number;
  isPlaying: boolean;
  currentTrailId: string | null;

  selectConstellation: (id: string | null) => void;
  connectConstellation: (id: string) => void;
  disconnectConstellation: (id: string) => void;
  clearConnections: () => void;
  addTrail: (trail: Trail) => void;
  removeTrail: (id: string) => void;
  renameTrail: (id: string, name: string) => void;
  setColorStart: (color: string) => void;
  setColorEnd: (color: string) => void;
  setStarBrightness: (value: number) => void;
  setNebulaDensity: (value: number) => void;
  setPlaying: (playing: boolean) => void;
  setCurrentTrailId: (id: string | null) => void;
}

export const useStore = create<AppState>((set, get) => ({
  selectedConstellation: null,
  connectedConstellations: [],
  savedTrails: [],
  currentColorStart: '#40E0D0',
  currentColorEnd: '#DA70D6',
  starBrightness: 1.0,
  nebulaDensity: 0.3,
  isPlaying: false,
  currentTrailId: null,

  selectConstellation: (id) => set({ selectedConstellation: id }),

  connectConstellation: (id) => {
    const { connectedConstellations } = get();
    if (!connectedConstellations.includes(id)) {
      set({ connectedConstellations: [...connectedConstellations, id] });
    }
  },

  disconnectConstellation: (id) => {
    const { connectedConstellations } = get();
    set({ connectedConstellations: connectedConstellations.filter((c) => c !== id) });
  },

  clearConnections: () => set({ connectedConstellations: [] }),

  addTrail: (trail) => {
    const { savedTrails } = get();
    const updated = [trail, ...savedTrails];
    set({ savedTrails: updated });
    localStorage.setItem('star-trails', JSON.stringify(updated));
  },

  removeTrail: (id) => {
    const { savedTrails } = get();
    const updated = savedTrails.filter((t) => t.id !== id);
    set({ savedTrails: updated });
    localStorage.setItem('star-trails', JSON.stringify(updated));
  },

  renameTrail: (id, name) => {
    const { savedTrails } = get();
    const updated = savedTrails.map((t) => (t.id === id ? { ...t, name } : t));
    set({ savedTrails: updated });
    localStorage.setItem('star-trails', JSON.stringify(updated));
  },

  setColorStart: (color) => set({ currentColorStart: color }),
  setColorEnd: (color) => set({ currentColorEnd: color }),
  setStarBrightness: (value) => set({ starBrightness: value }),
  setNebulaDensity: (value) => set({ nebulaDensity: value }),
  setPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTrailId: (id) => set({ currentTrailId: id }),
}));

const stored = localStorage.getItem('star-trails');
if (stored) {
  try {
    const trails = JSON.parse(stored) as Trail[];
    useStore.setState({ savedTrails: trails });
  } catch {
    // ignore
  }
}
