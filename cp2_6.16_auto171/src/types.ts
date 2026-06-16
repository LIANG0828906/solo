export enum ShapeTypes {
  CIRCLE = 'circle',
  RECTANGLE = 'rectangle',
  TRIANGLE = 'triangle',
  STAR = 'star'
}

export enum AnimationTypes {
  MOVE = 'move',
  ROTATE = 'rotate',
  SCALE = 'scale',
  COLOR = 'color',
  BLINK = 'blink'
}

export interface ShapeParams {
  radius?: number;
  width?: number;
  height?: number;
  sideLength?: number;
  points?: number;
  outerRadius?: number;
  innerRadius?: number;
  fill: string;
}

export interface AnimationParams {
  dx?: number;
  dy?: number;
  angle?: number;
  factor?: number;
  targetColor?: string;
  frequency?: number;
  duration: number;
  repeat: number;
}

export interface Block {
  id: string;
  type: 'shape' | 'animation';
  shapeType?: ShapeTypes;
  animationType?: AnimationTypes;
  name: string;
  icon: string;
  params: ShapeParams | AnimationParams;
  parentShapeId?: string;
}

export interface AnimationSequence {
  shapeId: string;
  animationIds: string[];
}

export interface PreviewState {
  isPlaying: boolean;
  currentTime: number;
  speed: number;
  fps: number;
}

export interface ComputedShapeState {
  id: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  fill: string;
  opacity: number;
}

export interface ShapePaletteItem {
  shapeType: ShapeTypes;
  name: string;
  icon: string;
  defaultParams: ShapeParams;
}

export interface AnimationPaletteItem {
  animationType: AnimationTypes;
  name: string;
  icon: string;
  defaultParams: AnimationParams;
}

export const SHAPE_PALETTE: ShapePaletteItem[] = [
  {
    shapeType: ShapeTypes.CIRCLE,
    name: '圆形',
    icon: '●',
    defaultParams: { radius: 40, fill: '#e94560' }
  },
  {
    shapeType: ShapeTypes.RECTANGLE,
    name: '矩形',
    icon: '■',
    defaultParams: { width: 80, height: 60, fill: '#4ecdc4' }
  },
  {
    shapeType: ShapeTypes.TRIANGLE,
    name: '三角形',
    icon: '▲',
    defaultParams: { sideLength: 80, fill: '#ffe66d' }
  },
  {
    shapeType: ShapeTypes.STAR,
    name: '星形',
    icon: '★',
    defaultParams: { points: 5, outerRadius: 45, innerRadius: 20, fill: '#a855f7' }
  }
];

export const ANIMATION_PALETTE: AnimationPaletteItem[] = [
  {
    animationType: AnimationTypes.MOVE,
    name: '移动',
    icon: '↔',
    defaultParams: { dx: 50, dy: 0, duration: 1000, repeat: 1 }
  },
  {
    animationType: AnimationTypes.ROTATE,
    name: '旋转',
    icon: '↻',
    defaultParams: { angle: 360, duration: 1000, repeat: 1 }
  },
  {
    animationType: AnimationTypes.SCALE,
    name: '缩放',
    icon: '⤡',
    defaultParams: { factor: 1.5, duration: 1000, repeat: 1 }
  },
  {
    animationType: AnimationTypes.COLOR,
    name: '变色',
    icon: '◐',
    defaultParams: { targetColor: '#4ecdc4', duration: 1000, repeat: 1 }
  },
  {
    animationType: AnimationTypes.BLINK,
    name: '闪烁',
    icon: '✦',
    defaultParams: { frequency: 2, duration: 2000, repeat: 1 }
  }
];

export const MAX_SHAPES = 5;
export const MAX_ANIMATIONS_PER_SHAPE = 10;
