export type LayerType = 'particles' | 'geometry' | 'gradient' | 'lines';

export type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn';

export interface BaseLayer {
  id: string;
  type: LayerType;
  name: string;
  visible: boolean;
  opacity: number;
  blendMode: BlendMode;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
}

export interface ParticleLayer extends BaseLayer {
  type: 'particles';
  particles: Particle[];
  speed: number;
  direction: number;
}

export interface Polygon {
  id: string;
  x: number;
  y: number;
  sides: number;
  radius: number;
  rotation: number;
  rotationSpeed: number;
  strokeColor: string;
  fillColor: string;
  fillOpacity: number;
}

export interface GeometryLayer extends BaseLayer {
  type: 'geometry';
  polygons: Polygon[];
}

export interface GradientStop {
  position: number;
  color: string;
}

export interface GradientLayer extends BaseLayer {
  type: 'gradient';
  gradientType: 'linear' | 'radial';
  stops: GradientStop[];
  angle: number;
}

export interface BezierLine {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  cp1x: number;
  cp1y: number;
  cp2x: number;
  cp2y: number;
  color: string;
  thickness: number;
  opacity: number;
}

export interface LinesLayer extends BaseLayer {
  type: 'lines';
  lines: BezierLine[];
  thickness: number;
  lineOpacity: number;
}

export type Layer = ParticleLayer | GeometryLayer | GradientLayer | LinesLayer;

export interface AnimationFrameEvent {
  deltaTime: number;
  timestamp: number;
  frame: number;
}

export interface GlobalState {
  layers: Layer[];
  selectedElementId: string | null;
  selectedLayerId: string | null;
  isPlaying: boolean;
  isLooping: boolean;
  currentTime: number;
  isRecording: boolean;
  animationFrame: number;
  expandedLayers: Record<string, boolean>;
}

export type Action =
  | { type: 'ADD_LAYER'; layer: Layer }
  | { type: 'REMOVE_LAYER'; layerId: string }
  | { type: 'REORDER_LAYERS'; fromIndex: number; toIndex: number }
  | { type: 'TOGGLE_LAYER_VISIBILITY'; layerId: string }
  | { type: 'UPDATE_LAYER_OPACITY'; layerId: string; opacity: number }
  | { type: 'UPDATE_LAYER_BLEND_MODE'; layerId: string; blendMode: BlendMode }
  | { type: 'UPDATE_PARTICLE_LAYER'; layerId: string; updates: Partial<Omit<ParticleLayer, 'id' | 'type'>> }
  | { type: 'UPDATE_GEOMETRY_LAYER'; layerId: string; updates: Partial<Omit<GeometryLayer, 'id' | 'type'>> }
  | { type: 'UPDATE_GRADIENT_LAYER'; layerId: string; updates: Partial<Omit<GradientLayer, 'id' | 'type'>> }
  | { type: 'UPDATE_LINES_LAYER'; layerId: string; updates: Partial<Omit<LinesLayer, 'id' | 'type'>> }
  | { type: 'UPDATE_PARTICLE'; layerId: string; particleId: string; updates: Partial<Particle> }
  | { type: 'UPDATE_POLYGON'; layerId: string; polygonId: string; updates: Partial<Polygon> }
  | { type: 'UPDATE_LINE'; layerId: string; lineId: string; updates: Partial<BezierLine> }
  | { type: 'SELECT_ELEMENT'; elementId: string | null; layerId: string | null }
  | { type: 'TOGGLE_PLAYING' }
  | { type: 'TOGGLE_LOOPING' }
  | { type: 'SET_CURRENT_TIME'; time: number }
  | { type: 'SET_RECORDING'; isRecording: boolean }
  | { type: 'INCREMENT_FRAME' }
  | { type: 'TOGGLE_LAYER_EXPANDED'; layerId: string }
  | { type: 'ADVANCE_ANIMATION'; deltaTime: number };
