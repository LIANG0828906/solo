export type DominantBand = 'low' | 'mid' | 'high';

export type AnalysisStatus = 'pending' | 'analyzing' | 'done' | 'error';

export interface Track {
  id: string;
  name: string;
  size: number;
  duration: number;
  sampleRate: number;
  channels: number;
  channelData: Float32Array[];
  bpm: number | null;
  dominantBand: DominantBand | null;
  volume: number;
  analysisStatus: AnalysisStatus;
  analysisError?: string;
}

export interface MixStoreState {
  tracks: Track[];
  trackOrder: string[];
  crossfadeDuration: number;
  isPlaying: boolean;
  currentPlayTime: number;
  isExporting: boolean;
  exportProgress: number;
  playbackCtx: AudioContext | null;
  playbackSource: AudioBufferSourceNode | null;
  startTime: number;
  pauseOffset: number;
}

export interface MixStoreActions {
  addTrack: (file: File) => Promise<void>;
  removeTrack: (id: string) => void;
  reorderTracks: (newOrder: string[]) => void;
  setTrackVolume: (id: string, volume: number) => void;
  setCrossfadeDuration: (v: number) => void;
  playMix: () => Promise<void>;
  pauseMix: () => void;
  exportMix: () => Promise<void>;
  updatePlayTime: () => void;
  stopPlayback: () => void;
}

export type MixStore = MixStoreState & MixStoreActions;

export interface AnalysisResult {
  bpm: number;
  dominantBand: DominantBand;
}

export interface WorkerMessage {
  type: 'analyze';
  payload: {
    channelData: ArrayBuffer[];
    sampleRate: number;
    length: number;
  };
}

export interface WorkerResponse {
  type: 'done' | 'error';
  result?: AnalysisResult;
  error?: string;
}
