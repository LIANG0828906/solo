import { create } from 'zustand';

export type CognitiveStatus = 'focus' | 'relax' | 'sleep' | 'excited';

export interface IntensityMap {
  alpha: number;
  beta: number;
  theta: number;
  delta: number;
}

export interface HistoryFrame {
  index: number;
  timestamp: number;
  status: CognitiveStatus;
  color: string;
  intensity: number;
}

export const STATUS_COLORS: Record<CognitiveStatus, string> = {
  focus: '#00aaff',
  relax: '#00ff88',
  sleep: '#aa00ff',
  excited: '#ff4400',
};

export const STATUS_INTENSITY: Record<CognitiveStatus, number> = {
  focus: 0.75,
  relax: 0.45,
  sleep: 0.3,
  excited: 1.0,
};

export const STATUS_BANDS: Record<CognitiveStatus, IntensityMap> = {
  focus:   { alpha: 0.4, beta: 0.9, theta: 0.2, delta: 0.1 },
  relax:   { alpha: 0.9, beta: 0.3, theta: 0.5, delta: 0.2 },
  sleep:   { alpha: 0.2, beta: 0.1, theta: 0.7, delta: 0.95 },
  excited: { alpha: 0.5, beta: 1.0, theta: 0.3, delta: 0.15 },
};

const TRANSITION_DURATION = 1500;
const MAX_HISTORY = 120;
const RECORD_INTERVAL = 0.5;

export const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return [r, g, b];
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function lerpColor(hexA: string, hexB: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(hexA);
  const [r2, g2, b2] = hexToRgb(hexB);
  return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

function lerpIntensityMap(a: IntensityMap, b: IntensityMap, t: number): IntensityMap {
  return {
    alpha: a.alpha + (b.alpha - a.alpha) * t,
    beta: a.beta + (b.beta - a.beta) * t,
    theta: a.theta + (b.theta - a.theta) * t,
    delta: a.delta + (b.delta - a.delta) * t,
  };
}

export interface StatusState {
  currentStatus: CognitiveStatus;
  previousStatus: CognitiveStatus;
  intensityMap: IntensityMap;
  baseIntensityMap: IntensityMap;
  intensity: number;
  baseIntensity: number;
  targetIntensity: number;
  currentColor: string;
  baseColor: string;
  targetColor: string;
  transitionStart: number;
  transitionDuration: number;
  isTransitioning: boolean;
  timelineProgress: number;
  isSeeking: boolean;
  history: HistoryFrame[];
  screenshotQueue: string[];
  lastRecordTime: number;

  setStatus: (s: CognitiveStatus) => void;
  updateTimeline: (seconds: number) => void;
  resetTimeline: () => void;
  seekFrame: (index: number) => void;
  recordFrame: (elapsedSeconds: number) => void;
  pushScreenshot: (dataUrl: string) => void;
  tickTransition: (now: number) => void;
}

const defaultStatus: CognitiveStatus = 'focus';
const defaultColor = STATUS_COLORS[defaultStatus];
const defaultIntensity = STATUS_INTENSITY[defaultStatus];
const defaultBands = STATUS_BANDS[defaultStatus];

export const useStatusStore = create<StatusState>((set, get) => ({
  currentStatus: defaultStatus,
  previousStatus: defaultStatus,
  intensityMap: { ...defaultBands },
  baseIntensityMap: { ...defaultBands },
  intensity: defaultIntensity,
  baseIntensity: defaultIntensity,
  targetIntensity: defaultIntensity,
  currentColor: defaultColor,
  baseColor: defaultColor,
  targetColor: defaultColor,
  transitionStart: 0,
  transitionDuration: TRANSITION_DURATION,
  isTransitioning: false,
  timelineProgress: 0,
  isSeeking: false,
  history: [],
  screenshotQueue: [],
  lastRecordTime: 0,

  setStatus: (s: CognitiveStatus) => {
    const state = get();
    if (state.currentStatus === s && !state.isTransitioning) return;
    const targetColor = STATUS_COLORS[s];
    const targetIntensity = STATUS_INTENSITY[s];
    const targetBands = STATUS_BANDS[s];
    set({
      previousStatus: state.currentStatus,
      currentStatus: s,
      baseColor: state.currentColor,
      baseIntensity: state.intensity,
      baseIntensityMap: { ...state.intensityMap },
      targetColor,
      targetIntensity,
      isTransitioning: true,
      transitionStart: performance.now(),
      transitionDuration: TRANSITION_DURATION,
    });
    void targetBands;
  },

  updateTimeline: (seconds: number) => {
    const clamped = Math.max(0, Math.min(60, seconds));
    set({ timelineProgress: clamped, isSeeking: false });
  },

  resetTimeline: () => {
    set({ timelineProgress: 0, isSeeking: false, history: [], lastRecordTime: 0 });
  },

  seekFrame: (index: number) => {
    const { history } = get();
    if (index < 0 || index >= history.length) return;
    const frame = history[index];
    set({
      isSeeking: true,
      timelineProgress: frame.timestamp,
      currentStatus: frame.status,
      previousStatus: frame.status,
      currentColor: frame.color,
      baseColor: frame.color,
      targetColor: frame.color,
      intensity: frame.intensity,
      baseIntensity: frame.intensity,
      targetIntensity: frame.intensity,
      intensityMap: { ...STATUS_BANDS[frame.status] },
      baseIntensityMap: { ...STATUS_BANDS[frame.status] },
      isTransitioning: false,
    });
  },

  recordFrame: (elapsedSeconds: number) => {
    const state = get();
    if (elapsedSeconds - state.lastRecordTime < RECORD_INTERVAL) return;
    const frame: HistoryFrame = {
      index: state.history.length,
      timestamp: elapsedSeconds,
      status: state.currentStatus,
      color: state.currentColor,
      intensity: state.intensity,
    };
    const nextHistory = [...state.history, frame];
    if (nextHistory.length > MAX_HISTORY) {
      nextHistory.shift();
      for (let i = 0; i < nextHistory.length; i++) nextHistory[i].index = i;
    }
    set({ history: nextHistory, lastRecordTime: elapsedSeconds });
  },

  pushScreenshot: (dataUrl: string) => {
    set((state) => ({ screenshotQueue: [...state.screenshotQueue, dataUrl] }));
  },

  tickTransition: (now: number) => {
    const state = get();
    if (!state.isTransitioning) return;
    const rawT = (now - state.transitionStart) / state.transitionDuration;
    if (rawT >= 1) {
      const targetBands = STATUS_BANDS[state.currentStatus];
      set({
        isTransitioning: false,
        currentColor: state.targetColor,
        intensity: state.targetIntensity,
        intensityMap: { ...targetBands },
      });
      return;
    }
    const t = easeInOutCubic(rawT);
    const newColor = lerpColor(state.baseColor, state.targetColor, t);
    const newIntensity = state.baseIntensity + (state.targetIntensity - state.baseIntensity) * t;
    const newBands = lerpIntensityMap(state.baseIntensityMap, STATUS_BANDS[state.currentStatus], t);
    set({
      currentColor: newColor,
      intensity: newIntensity,
      intensityMap: newBands,
    });
  },
}));

export function hexToRgbVec(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex);
  return [r / 255, g / 255, b / 255];
}
