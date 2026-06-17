export interface KeyframeTransform {
  translateX: number;
  translateY: number;
  rotate: number;
  scale: number;
}

export interface Keyframe {
  id: string;
  time: number;
  transform: KeyframeTransform;
  opacity: number;
  backgroundColor: string;
}

export interface EasingCurve {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface AnimationConfig {
  duration: number;
  easing: EasingCurve;
  iterations: number | 'infinite';
}

export interface AnimationState {
  keyframes: Keyframe[];
  selectedKeyframeId: string | null;
  isPlaying: boolean;
  currentTime: number;
  playbackSpeed: number;
  animationConfig: AnimationConfig;
  isExportModalOpen: boolean;

  addKeyframe: (time: number) => void;
  deleteKeyframe: (id: string) => void;
  updateKeyframe: (id: string, updates: Partial<Keyframe>) => void;
  selectKeyframe: (id: string | null) => void;
  setPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  setEasing: (curve: EasingCurve) => void;
  setExportModalOpen: (open: boolean) => void;
  resetAnimation: () => void;
  generateCSS: () => string;
}
