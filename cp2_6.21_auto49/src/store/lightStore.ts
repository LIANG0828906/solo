import { create } from 'zustand';

export interface LightConfig {
  type: 'directional' | 'point';
  intensity: number;
  color: string;
  elevation: number;
  azimuth: number;
}

interface LightState {
  sun: LightConfig;
  moon: LightConfig;
}

interface LightStore extends LightState {
  updateLight: (id: 'sun' | 'moon', params: Partial<LightConfig>) => void;
  reset: () => void;
  undo: () => void;
  redo: () => void;
  _past: LightState[];
  _future: LightState[];
}

const initialSun: LightConfig = {
  type: 'directional',
  intensity: 1.5,
  color: '#ffaa00',
  elevation: 45,
  azimuth: 180,
};

const initialMoon: LightConfig = {
  type: 'point',
  intensity: 0.8,
  color: '#aaccff',
  elevation: 30,
  azimuth: 0,
};

const initialState: LightState = {
  sun: { ...initialSun },
  moon: { ...initialMoon },
};

const MAX_HISTORY = 10;

export const useLightStore = create<LightStore>((set, get) => ({
  ...initialState,
  _past: [],
  _future: [],

  updateLight: (id, params) => {
    const state = get();
    const snapshot: LightState = {
      sun: { ...state.sun },
      moon: { ...state.moon },
    };
    const newPast = [...state._past, snapshot].slice(-MAX_HISTORY);
    set({
      [id]: { ...state[id], ...params },
      _past: newPast,
      _future: [],
    });
  },

  reset: () => {
    const state = get();
    const snapshot: LightState = {
      sun: { ...state.sun },
      moon: { ...state.moon },
    };
    set({
      ...initialState,
      sun: { ...initialSun },
      moon: { ...initialMoon },
      _past: [...state._past, snapshot].slice(-MAX_HISTORY),
      _future: [],
    });
  },

  undo: () => {
    const state = get();
    if (state._past.length === 0) return;
    const previous = state._past[state._past.length - 1];
    const snapshot: LightState = {
      sun: { ...state.sun },
      moon: { ...state.moon },
    };
    set({
      sun: { ...previous.sun },
      moon: { ...previous.moon },
      _past: state._past.slice(0, -1),
      _future: [snapshot, ...state._future].slice(0, MAX_HISTORY),
    });
  },

  redo: () => {
    const state = get();
    if (state._future.length === 0) return;
    const next = state._future[0];
    const snapshot: LightState = {
      sun: { ...state.sun },
      moon: { ...state.moon },
    };
    set({
      sun: { ...next.sun },
      moon: { ...next.moon },
      _past: [...state._past, snapshot].slice(-MAX_HISTORY),
      _future: state._future.slice(1),
    });
  },
}));
