export interface PathPoint {
  id: string;
  x: number;
  y: number;
  timestamp: number;
  isEraser: boolean;
}

export interface Keyframe {
  id: string;
  x: number;
  y: number;
  index: number;
}

export interface ColorScheme {
  id: string;
  name: string;
  primary: string;
  secondary: string;
}

export interface AnimationState {
  isPlaying: boolean;
  speed: number;
  currentFrame: number;
  trailPoints: PathPoint[];
}

export type DrawTool = 'pen' | 'eraser';

export interface AppState {
  pathPoints: PathPoint[];
  drawTool: DrawTool;
  addPathPoint: (point: Omit<PathPoint, 'id' | 'timestamp'>) => void;
  clearCanvas: () => void;
  setDrawTool: (tool: DrawTool) => void;

  keyframes: Keyframe[];
  addKeyframe: (point: Omit<Keyframe, 'id' | 'index'>) => void;
  removeKeyframe: (id: string) => void;
  clearKeyframes: () => void;

  colorSchemes: ColorScheme[];
  currentScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  setCustomColors: (primary: string, secondary: string) => void;

  animation: AnimationState;
  setAnimationPlaying: (isPlaying: boolean) => void;
  setAnimationSpeed: (speed: number) => void;
  setCurrentFrame: (frame: number) => void;
  setTrailPoints: (points: PathPoint[]) => void;
}
