import { create } from 'zustand';
import { ColorMode, COLOR_SCHEMES, createRgbColorInterpolator, lerpColor, NebulaPreset } from '@/utils/colors';

type RgbColor = { r: number; g: number; b: number };

interface ColorTransitionState {
  isTransitioning: boolean;
  fromMode: ColorMode;
  toMode: ColorMode;
  progress: number;
  startTime: number;
}

interface NebulaState {
  density: number;
  turbulence: number;
  colorMode: ColorMode;
  colorTransition: ColorTransitionState | null;
  cameraPosition: [number, number, number];
  particleScale: number;
  currentFPS: number;
  uiVisible: boolean;

  setDensity: (v: number) => void;
  setTurbulence: (v: number) => void;
  setColorMode: (v: ColorMode) => void;
  updateColorTransition: (deltaTime: number) => void;
  getInterpolatedColor: (t: number) => RgbColor;
  applyPreset: (preset: NebulaPreset) => void;
  setCameraPosition: (v: [number, number, number]) => void;
  setParticleScale: (v: number) => void;
  setCurrentFPS: (v: number) => void;
  setUiVisible: (v: boolean) => void;
}

export const useNebulaStore = create<NebulaState>((set, get) => ({
  density: 0.6,
  turbulence: 40,
  colorMode: 'purple-green',
  colorTransition: null,
  cameraPosition: [0, 0, 8],
  particleScale: 1.0,
  currentFPS: 60,
  uiVisible: true,

  setDensity: (v: number) => set({ density: Math.max(0.1, Math.min(1.0, v)) }),
  setTurbulence: (v: number) => set({ turbulence: Math.max(0, Math.min(100, v)) }),

  setColorMode: (v: ColorMode) => {
    const { colorMode } = get();
    if (colorMode === v) return;

    set({
      colorTransition: {
        isTransitioning: true,
        fromMode: colorMode,
        toMode: v,
        progress: 0,
        startTime: performance.now(),
      },
    });
  },

  updateColorTransition: (deltaTime: number) => {
    const { colorTransition } = get();
    if (!colorTransition || !colorTransition.isTransitioning) return;

    const duration = 1000;
    const newProgress = Math.min(1, colorTransition.progress + (deltaTime * 1000) / duration);

    if (newProgress >= 1) {
      set({
        colorMode: colorTransition.toMode,
        colorTransition: null,
      });
    } else {
      set({
        colorTransition: {
          ...colorTransition,
          progress: newProgress,
        },
      });
    }
  },

  getInterpolatedColor: (t: number) => {
    const { colorMode, colorTransition } = get();
    const activeMode = colorTransition ? colorTransition.fromMode : colorMode;
    const targetMode = colorTransition ? colorTransition.toMode : colorMode;
    const blendProgress = colorTransition ? colorTransition.progress : 1;

    const fromStops = COLOR_SCHEMES[activeMode].stops;
    const toStops = COLOR_SCHEMES[targetMode].stops;

    const fromInterpolator = createRgbColorInterpolator(fromStops);
    const toInterpolator = createRgbColorInterpolator(toStops);

    const fromColor = fromInterpolator(t);
    const toColor = toInterpolator(t);

    return lerpColor(fromColor, toColor, blendProgress);
  },

  setCameraPosition: (v: [number, number, number]) => set({ cameraPosition: v }),
  setParticleScale: (v: number) => set({ particleScale: v }),
  setCurrentFPS: (v: number) => set({ currentFPS: v }),
  setUiVisible: (v: boolean) => set({ uiVisible: v }),

  applyPreset: (preset: NebulaPreset) => {
    const { colorMode } = get();
    set({
      density: preset.density,
      turbulence: preset.turbulence,
    });
    if (colorMode !== preset.colorMode) {
      set({
        colorTransition: {
          isTransitioning: true,
          fromMode: colorMode,
          toMode: preset.colorMode,
          progress: 0,
          startTime: performance.now(),
        },
      });
    }
  },
}));
