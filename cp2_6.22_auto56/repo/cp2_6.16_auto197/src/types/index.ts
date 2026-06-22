export interface SpriteFrame {
  id: string;
  name: string;
  imageData: ImageData;
  width: number;
  height: number;
  duration: number;
}

export interface Selection {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SpriteSheet {
  image: HTMLImageElement | null;
  width: number;
  height: number;
  selection: Selection | null;
}

export interface TimelineState {
  frameIds: string[];
  currentFrameIndex: number;
  isPlaying: boolean;
  fps: number;
  loop: boolean;
  loopCount: number;
}

export interface ExportState {
  isExporting: boolean;
  progress: number;
}

export interface SpriteStore {
  spriteSheet: SpriteSheet;
  frames: SpriteFrame[];
  selectedFrameIds: string[];
  timeline: TimelineState;
  exportState: ExportState;

  setSpriteSheet: (image: HTMLImageElement) => void;
  setSelection: (selection: Selection | null) => void;
  cutFrames: () => void;
  renameFrame: (id: string, name: string) => void;
  deleteFrames: (ids: string[]) => void;
  setFrameDuration: (id: string, duration: number) => void;
  setBulkDuration: (ids: string[], duration: number) => void;
  selectFrame: (id: string, multi?: boolean) => void;
  clearSelection: () => void;
  addToTimeline: (frameId: string, index?: number) => void;
  removeFromTimeline: (index: number) => void;
  reorderTimeline: (fromIndex: number, toIndex: number) => void;
  duplicateFrame: (index: number) => void;
  insertBlankFrame: (index: number) => void;
  setPlaying: (playing: boolean) => void;
  setFps: (fps: number) => void;
  setLoop: (loop: boolean) => void;
  setCurrentFrameIndex: (index: number) => void;
  exportSpriteSheet: () => Promise<void>;
}
