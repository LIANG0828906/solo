export interface Material {
  id: string;
  name: string;
  file: File;
  url: string;
  duration: number;
  thumbnail: string;
  width: number;
  height: number;
}

export interface Clip {
  id: string;
  materialId: string;
  startTime: number;
  endTime: number;
  inPoint: number;
  outPoint: number;
  volume: number;
  playbackRate: number;
}

export type TransitionType = 'fade' | 'slide' | 'zoom';

export interface Transition {
  id: string;
  type: TransitionType;
  duration: number;
  fromClipId: string;
  toClipId: string;
}

export interface TimelineState {
  clips: Clip[];
  transitions: Transition[];
  currentTime: number;
  zoom: number;
  isPlaying: boolean;
  selectedClipId: string | null;
}

export interface AppState {
  materials: Material[];
  timeline: TimelineState;
  filter: {
    keyword: string;
    sortBy: 'name' | 'duration';
  };
}

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  thumbnail: string;
}
