export type MountStyle = 'scroll' | 'frame' | 'fan';

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ScrollParams {
  axisColor: string;
  fabricTexture: number;
}

export interface FrameParams {
  frameColor: string;
  frameWidth: number;
  matColor: string;
}

export interface FanParams {
  ribMaterial: 'bamboo' | 'wood' | 'copper';
  fanBgColor: string;
}

export interface MountParams {
  scroll: ScrollParams;
  frame: FrameParams;
  fan: FanParams;
}

export interface AppState {
  imageUrl: string | null;
  originalImage: HTMLImageElement | null;
  cropArea: CropArea | null;
  currentStyle: MountStyle;
  params: MountParams;
  compareModes: MountStyle[];
  isCompareMode: boolean;
}

export type SetImageCallback = (url: string, img: HTMLImageElement) => void;
export type SetCropCallback = (area: CropArea) => void;
export type SetStyleCallback = (style: MountStyle) => void;
export type SetParamsCallback = <K extends keyof MountParams>(
  style: K,
  key: keyof MountParams[K],
  value: MountParams[K][keyof MountParams[K]]
) => void;
export type ToggleCompareStyleCallback = (style: MountStyle) => void;
export type SetCompareModeCallback = (enabled: boolean) => void;

export const defaultMountParams: MountParams = {
  scroll: {
    axisColor: '#4a3520',
    fabricTexture: 0,
  },
  frame: {
    frameColor: '#8b6914',
    frameWidth: 8,
    matColor: '#ffffff',
  },
  fan: {
    ribMaterial: 'bamboo',
    fanBgColor: '#fff8e7',
  },
};

export const styleLabels: Record<MountStyle, string> = {
  scroll: '卷轴装裱',
  frame: '镜框装裱',
  fan: '扇面装裱',
};

export const fabricTextureCount = 6;
