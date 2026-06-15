export type InstrumentType = 'piano' | 'epiano' | 'strings' | 'drums' | 'synth-lead' | 'synth-pad';

export interface TrackState {
  id: string;
  type: InstrumentType;
  name: string;
  icon: string;
  enabled: boolean;
  volume: number;
  pan: number;
  order: number;
}

export interface NoteEvent {
  trackId: string;
  note: number;
  velocity: number;
  timestamp: number;
}

export interface IAudioEngine {
  init(): Promise<void>;
  playNote(trackId: string, note: number, velocity?: number): void;
  stopNote(trackId: string, note: number): void;
  setVolume(trackId: string, value: number): void;
  setPan(trackId: string, value: number): void;
  setMasterVolume(value: number): void;
  getTimeDomainData(): Uint8Array;
  getFrequencyData(): Uint8Array;
  getDestination(): MediaStreamAudioDestinationNode;
  destroy(): void;
}

export interface IRecorderModule {
  start(): void;
  stop(): void;
  isRecording(): boolean;
  getRecordingTime(): number;
}
