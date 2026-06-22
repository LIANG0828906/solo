export interface AnchorPoint {
  id: string;
  x: number;
  y: number;
  color: string;
  type: 'start' | 'end';
}

export type GradientType = 'linear' | 'radial' | 'conic';

export type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'soft-light';

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  gradientType: GradientType;
  anchors: AnchorPoint[];
  blendMode: BlendMode;
  order: number;
}

export interface CanvasState {
  zoom: number;
  panX: number;
  panY: number;
}
