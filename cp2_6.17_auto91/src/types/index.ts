export interface VideoMetadata {
  id: string;
  duration: number;
  width: number;
  height: number;
  fps: number;
  totalFrames: number;
}

export interface Clip {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  orderIndex: number;
}

export interface VideoState {
  sourceUrl: string | null;
  metadata: VideoMetadata | null;
  isLoading: boolean;
  loadError: string | null;
  currentFrame: ImageData | null;
  currentTime: number;
  currentFrameIndex: number;
}

export interface EditorState {
  clips: Clip[];
  selectedClipId: string | null;
  timelineScale: number;
  isPlaying: boolean;
  isLooping: boolean;
  playheadTime: number;
  currentClipIndex: number;
}

export interface VideoActions {
  loadVideo: (url: string) => Promise<void>;
  seekToFrame: (frameIndex: number) => Promise<void>;
  seekToTime: (time: number) => Promise<void>;
  getFrameAtTime: (time: number) => Promise<ImageData | null>;
}

export interface EditorActions {
  addClip: (time: number) => void;
  removeClip: (clipId: string) => void;
  reorderClip: (clipId: string, newIndex: number) => void;
  updateClipTime: (clipId: string, startTime: number, endTime: number) => void;
  updateClipText: (clipId: string, text: string) => void;
  selectClip: (clipId: string | null) => void;
  setTimelineScale: (scale: number) => void;
  togglePlay: () => void;
  stop: () => void;
  toggleLoop: () => void;
  setPlayheadTime: (time: number) => void;
}

export type VideoStore = VideoState & VideoActions;
export type EditorStore = EditorState & EditorActions;
