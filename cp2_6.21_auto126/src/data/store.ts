import { create } from 'zustand';
import { InstrumentType, TrackState } from '../engine/audioEngine';
import { audioEngine } from '../engine/audioEngine';
import { beatScheduler } from '../engine/beatScheduler';
import { presets, Preset } from './presets';
import { generateShareLink, parseShareLink } from './encoder';

interface StoreState {
  isPlaying: boolean;
  isRecording: boolean;
  bpm: number;
  masterVolume: number;
  currentBeat: number;
  currentBar: number;
  tracks: Record<InstrumentType, TrackState>;
  waveformData: Float32Array;
  isLoadingPreset: boolean;
  shareLink: string | null;

  togglePlay: () => void;
  setBPM: (bpm: number) => void;
  setMasterVolume: (volume: number) => void;
  setTrackVolume: (type: InstrumentType, volume: number) => void;
  setBeat: (type: InstrumentType, bar: number, beat: number, active: boolean) => void;
  toggleBeat: (type: InstrumentType, bar: number, beat: number) => void;
  loadPreset: (name: string) => void;
  startRecording: () => void;
  stopRecording: () => void;
  updateWaveform: () => void;
  updateCurrentPosition: (beat: number, bar: number) => void;
  loadFromShareLink: () => boolean;
}

const createEmptyBeats = (): boolean[][] => {
  return Array(8).fill(null).map(() => Array(8).fill(false));
};

const initialTracks: Record<InstrumentType, TrackState> = {
  drums: { volume: 0.7, beats: createEmptyBeats() },
  bass: { volume: 0.6, beats: createEmptyBeats() },
  synth: { volume: 0.5, beats: createEmptyBeats() },
  effects: { volume: 0.4, beats: createEmptyBeats() },
};

export const useStore = create<StoreState>((set, get) => ({
  isPlaying: false,
  isRecording: false,
  bpm: 120,
  masterVolume: 0.8,
  currentBeat: -1,
  currentBar: -1,
  tracks: initialTracks,
  waveformData: new Float32Array(2048),
  isLoadingPreset: false,
  shareLink: null,

  togglePlay: () => {
    const { isPlaying } = get();
    if (isPlaying) {
      beatScheduler.stop();
      set({ isPlaying: false, currentBeat: -1, currentBar: -1 });
    } else {
      beatScheduler.setOnBeatCallback((beat, bar) => {
        get().updateCurrentPosition(beat, bar);
      });
      beatScheduler.start();
      set({ isPlaying: true });
    }
  },

  setBPM: (bpm: number) => {
    const clamped = Math.max(60, Math.min(200, bpm));
    beatScheduler.setBPM(clamped);
    set({ bpm: clamped });
  },

  setMasterVolume: (volume: number) => {
    const clamped = Math.max(0, Math.min(1, volume));
    audioEngine.setMasterVolume(clamped);
    set({ masterVolume: clamped });
  },

  setTrackVolume: (type: InstrumentType, volume: number) => {
    const clamped = Math.max(0, Math.min(1, volume));
    audioEngine.setTrackVolume(type, clamped);
    set(state => ({
      tracks: {
        ...state.tracks,
        [type]: {
          ...state.tracks[type],
          volume: clamped,
        },
      },
    }));
  },

  setBeat: (type: InstrumentType, bar: number, beat: number, active: boolean) => {
    audioEngine.setBeat(type, bar, beat, active);
    set(state => {
      const newBeats = state.tracks[type].beats.map(row => [...row]);
      newBeats[bar][beat] = active;
      return {
        tracks: {
          ...state.tracks,
          [type]: {
            ...state.tracks[type],
            beats: newBeats,
          },
        },
      };
    });
  },

  toggleBeat: (type: InstrumentType, bar: number, beat: number) => {
    const currentValue = get().tracks[type].beats[bar][beat];
    get().setBeat(type, bar, beat, !currentValue);
  },

  loadPreset: (name: string) => {
    const preset = presets[name];
    if (!preset) return;

    set({ isLoadingPreset: true });

    setTimeout(() => {
      const state = get();
      
      audioEngine.setBPM(preset.bpm);
      audioEngine.setMasterVolume(preset.masterVolume);
      beatScheduler.setBPM(preset.bpm);

      (['drums', 'bass', 'synth', 'effects'] as InstrumentType[]).forEach(type => {
        audioEngine.setBeats(type, preset.tracks[type].beats);
        audioEngine.setTrackVolume(type, preset.tracks[type].volume);
      });

      set({
        bpm: preset.bpm,
        masterVolume: preset.masterVolume,
        tracks: {
          drums: { ...preset.tracks.drums, beats: preset.tracks.drums.beats.map(row => [...row]) },
          bass: { ...preset.tracks.bass, beats: preset.tracks.bass.beats.map(row => [...row]) },
          synth: { ...preset.tracks.synth, beats: preset.tracks.synth.beats.map(row => [...row]) },
          effects: { ...preset.tracks.effects, beats: preset.tracks.effects.beats.map(row => [...row]) },
        },
        isLoadingPreset: false,
      });
    }, 50);
  },

  startRecording: () => {
    set({ isRecording: true });
  },

  stopRecording: async () => {
    const state = get();
    const shareLink = generateShareLink({
      bpm: state.bpm,
      masterVolume: state.masterVolume,
      tracks: state.tracks,
    });
    set({ isRecording: false, shareLink });
  },

  updateWaveform: () => {
    const data = audioEngine.getWaveform();
    set({ waveformData: new Float32Array(data) });
  },

  updateCurrentPosition: (beat: number, bar: number) => {
    set({ currentBeat: beat, currentBar: bar });
  },

  loadFromShareLink: (): boolean => {
    const sharedState = parseShareLink();
    if (!sharedState) return false;

    audioEngine.setBPM(sharedState.bpm);
    audioEngine.setMasterVolume(sharedState.masterVolume);
    beatScheduler.setBPM(sharedState.bpm);

    (['drums', 'bass', 'synth', 'effects'] as InstrumentType[]).forEach(type => {
      audioEngine.setBeats(type, sharedState.tracks[type].beats);
      audioEngine.setTrackVolume(type, sharedState.tracks[type].volume);
    });

    set({
      bpm: sharedState.bpm,
      masterVolume: sharedState.masterVolume,
      tracks: {
        drums: { ...sharedState.tracks.drums, beats: sharedState.tracks.drums.beats.map(row => [...row]) },
        bass: { ...sharedState.tracks.bass, beats: sharedState.tracks.bass.beats.map(row => [...row]) },
        synth: { ...sharedState.tracks.synth, beats: sharedState.tracks.synth.beats.map(row => [...row]) },
        effects: { ...sharedState.tracks.effects, beats: sharedState.tracks.effects.beats.map(row => [...row]) },
      },
    });

    return true;
  },
}));
