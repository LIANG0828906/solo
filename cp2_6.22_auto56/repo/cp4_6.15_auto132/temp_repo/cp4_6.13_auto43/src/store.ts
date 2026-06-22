import { create } from 'zustand';
import {
  AppState,
  FractalParams,
  FractalType,
  ViewState,
  ColorMap,
  DEFAULT_PARAMS,
  DEFAULT_VIEW,
  COLOR_MAPS
} from './types';

interface AppStore extends AppState {
  updateParams: (params: Partial<FractalParams>) => void;
  setFractalType: (type: FractalType) => void;
  setColorMap: (colorMap: ColorMap) => void;
  updateViewState: (state: Partial<ViewState>) => void;
  resetView: () => void;
  resetParams: () => void;
  setIsRendering: (rendering: boolean) => void;
  setFps: (fps: number) => void;
}

export const useStore = create<AppStore>((set) => ({
  currentParams: { ...DEFAULT_PARAMS },
  fractalType: FractalType.MANDELBULB,
  colorMap: COLOR_MAPS[0],
  isRendering: false,
  viewState: { ...DEFAULT_VIEW },
  fps: 60,

  updateParams: (params) =>
    set((state) => ({
      currentParams: { ...state.currentParams, ...params },
      isRendering: true
    })),

  setFractalType: (type) =>
    set(() => ({
      fractalType: type,
      isRendering: true
    })),

  setColorMap: (colorMap) =>
    set(() => ({
      colorMap
    })),

  updateViewState: (newViewState) =>
    set((state) => ({
      viewState: { ...state.viewState, ...newViewState }
    })),

  resetView: () =>
    set(() => ({
      viewState: { ...DEFAULT_VIEW }
    })),

  resetParams: () =>
    set(() => ({
      currentParams: { ...DEFAULT_PARAMS },
      fractalType: FractalType.MANDELBULB,
      colorMap: COLOR_MAPS[0],
      isRendering: true
    })),

  setIsRendering: (rendering) =>
    set(() => ({
      isRendering: rendering
    })),

  setFps: (fps) =>
    set(() => ({
      fps
    }))
}));
