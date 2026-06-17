export interface Particle {
  id: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  opacity: number;
  glowEnabled: boolean;
}

export interface Keyframe {
  id: string;
  frameIndex: number;
  particles: Particle[];
}

export type ToolType = 'create' | 'select' | 'move' | 'delete';

export interface EditorState {
  particles: Particle[];
  keyframes: Keyframe[];
  selectedParticleId: string | null;
  activeTool: ToolType;
  isPlaying: boolean;
  currentFrame: number;
  totalFrames: number;
  zoom: number;
  panOffset: { x: number; y: number };
  isPreviewMode: boolean;
  canvasWidth: number;
  canvasHeight: number;
}

export interface EditorActions {
  setActiveTool: (tool: ToolType) => void;
  addParticle: (x: number, y: number) => void;
  deleteParticle: (id: string) => void;
  updateParticle: (id: string, updates: Partial<Omit<Particle, 'id'>>) => void;
  selectParticle: (id: string | null) => void;
  moveParticle: (id: string, x: number, y: number) => void;
  addKeyframe: () => void;
  deleteKeyframe: (id: string) => void;
  setCurrentFrame: (frame: number) => void;
  togglePlay: () => void;
  setIsPlaying: (playing: boolean) => void;
  setZoom: (zoom: number) => void;
  setPanOffset: (offset: { x: number; y: number }) => void;
  setIsPreviewMode: (preview: boolean) => void;
  loadKeyframeToCanvas: (frameIndex: number) => void;
}
