export type MirrorMode = 'none' | 'horizontal' | 'vertical' | 'quad';

export interface KaleidoParams {
  ringCount: number;
  rotationSpeedBase: number;
  mirrorMode: MirrorMode;
  dividerOpacity: number;
}

export interface RingData {
  index: number;
  innerRadius: number;
  outerRadius: number;
  rotation: number;
  rotationSpeed: number;
  expandOffset: number;
  direction: 1 | -1;
}

export interface UICallbacks {
  onImageUpload: (file: File) => void;
  onParamsChange: (patch: Partial<KaleidoParams>) => void;
  onExportRequest: () => void;
  onExportConfirm: (resolution: number) => void;
  onExportCancel: () => void;
  onReset: () => void;
}
