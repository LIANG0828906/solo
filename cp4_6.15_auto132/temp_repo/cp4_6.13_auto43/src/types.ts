export enum FractalType {
  MANDELBULB = 'mandelbulb',
  JULIA_SET = 'julia_set',
  QUATERNION = 'quaternion'
}

export interface FractalParams {
  iterations: number;
  escapeRadius: number;
  power: number;
  juliaConstant: [number, number, number];
  ambientOcclusion: number;
  internalColoring: boolean;
}

export interface ColorMap {
  name: string;
  colors: Array<{ position: number; rgb: [number, number, number] }>;
}

export interface ViewState {
  rotationX: number;
  rotationY: number;
  zoom: number;
  panX: number;
  panY: number;
}

export interface AppState {
  currentParams: FractalParams;
  fractalType: FractalType;
  colorMap: ColorMap;
  isRendering: boolean;
  viewState: ViewState;
  fps: number;
}

export const DEFAULT_PARAMS: FractalParams = {
  iterations: 64,
  escapeRadius: 4,
  power: 8,
  juliaConstant: [0.4, 0.3, -0.5],
  ambientOcclusion: 0.5,
  internalColoring: true
};

export const DEFAULT_VIEW: ViewState = {
  rotationX: 0.3,
  rotationY: 0.5,
  zoom: 2.5,
  panX: 0,
  panY: 0
};

export const COLOR_MAPS: ColorMap[] = [
  {
    name: 'Cosmic',
    colors: [
      { position: 0, rgb: [0.05, 0.02, 0.1] },
      { position: 0.3, rgb: [0.2, 0.1, 0.4] },
      { position: 0.6, rgb: [0.4, 0.2, 0.6] },
      { position: 1, rgb: [0.9, 0.7, 1.0] }
    ]
  },
  {
    name: 'Fire',
    colors: [
      { position: 0, rgb: [0.1, 0.02, 0] },
      { position: 0.3, rgb: [0.6, 0.2, 0] },
      { position: 0.6, rgb: [0.9, 0.5, 0.1] },
      { position: 1, rgb: [1.0, 0.9, 0.5] }
    ]
  },
  {
    name: 'Ocean',
    colors: [
      { position: 0, rgb: [0, 0.05, 0.1] },
      { position: 0.3, rgb: [0.1, 0.3, 0.5] },
      { position: 0.6, rgb: [0.2, 0.6, 0.8] },
      { position: 1, rgb: [0.8, 0.95, 1.0] }
    ]
  },
  {
    name: 'Matrix',
    colors: [
      { position: 0, rgb: [0, 0.05, 0] },
      { position: 0.3, rgb: [0.1, 0.3, 0.1] },
      { position: 0.6, rgb: [0.3, 0.7, 0.3] },
      { position: 1, rgb: [0.8, 1.0, 0.8] }
    ]
  },
  {
    name: 'Sunset',
    colors: [
      { position: 0, rgb: [0.1, 0.05, 0.15] },
      { position: 0.3, rgb: [0.5, 0.15, 0.3] },
      { position: 0.6, rgb: [0.9, 0.4, 0.2] },
      { position: 1, rgb: [1.0, 0.8, 0.4] }
    ]
  }
];
