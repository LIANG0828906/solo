export interface Frame {
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AnimationFrame {
  frameIndex: number;
  duration: number;
}

export type Direction = 'up' | 'down' | 'left' | 'right';
export type ActionType = 'idle' | 'walk' | 'jump' | 'attack';

export interface AnimationClip {
  id: string;
  name: string;
  direction: Direction;
  action: ActionType;
  frames: AnimationFrame[];
}

export interface SpriteMetadata {
  id: string;
  name: string;
  imageUrl: string;
  frameWidth: number;
  frameHeight: number;
  columns: number;
  rows: number;
  animations: AnimationClip[];
}

export interface SpriteData {
  metadata: SpriteMetadata;
  image: HTMLImageElement;
  frames: Frame[];
}

export interface AppState {
  sprites: Map<string, SpriteData>;
  currentSpriteId: string | null;
  currentAnimationId: string | null;
  currentFrameIndex: number;
  isPlaying: boolean;
  playSpeed: number;
  zoom: number;
  isLoading: boolean;
  expandedAnimations: Set<string>;
}

export interface AppActions {
  loadSprites: () => Promise<void>;
  setCurrentSprite: (id: string) => void;
  setCurrentAnimation: (id: string) => void;
  setCurrentFrameIndex: (index: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setPlaySpeed: (speed: number) => void;
  setZoom: (zoom: number) => void;
  toggleAnimationExpanded: (id: string) => void;
  updateAnimationFrameDuration: (animId: string, frameIdx: number, duration: number) => void;
  reorderAnimationFrames: (animId: string, fromIndex: number, toIndex: number) => void;
  resetAnimations: () => void;
  exportGif: () => void;
  nextFrame: () => void;
  prevFrame: () => void;
}

export type AppStore = AppState & AppActions;
