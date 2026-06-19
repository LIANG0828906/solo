import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type SoundSourceType = 'rain' | 'wind' | 'traffic' | 'birds' | 'hum';

export interface SoundTrack {
  id: string;
  type: SoundSourceType;
  name: string;
  volume: number;
  previousVolume: number;
  muted: boolean;
  color: string;
  hue: number;
}

export type WeatherType = 'sunny' | 'cloudy' | 'rainy' | 'windy' | 'foggy';

export interface WeatherData {
  city: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  weatherType: WeatherType;
}

export interface Preset {
  id: string;
  name: string;
  city: string;
  tracks: SoundTrack[];
  createdAt: number;
}

const initialTracks: SoundTrack[] = [
  { id: uuidv4(), type: 'rain', name: '雨声', volume: 30, previousVolume: 30, muted: false, color: '#3B82F6', hue: 210 },
  { id: uuidv4(), type: 'wind', name: '风声', volume: 25, previousVolume: 25, muted: false, color: '#06B6D4', hue: 190 },
  { id: uuidv4(), type: 'traffic', name: '车流', volume: 20, previousVolume: 20, muted: false, color: '#F97316', hue: 25 },
  { id: uuidv4(), type: 'birds', name: '鸟鸣', volume: 15, previousVolume: 15, muted: false, color: '#22C55E', hue: 140 },
  { id: uuidv4(), type: 'hum', name: '城市嗡鸣', volume: 10, previousVolume: 10, muted: false, color: '#A855F7', hue: 270 },
];

export interface AppState {
  tracks: SoundTrack[];
  currentCity: string;
  weatherData: WeatherData | null;
  isPlaying: boolean;
  presets: Preset[];
  selectedPresetId: string | null;
  isFlipping: boolean;
  spectrumPeak: number;

  setTracks: (tracks: SoundTrack[]) => void;
  setTrackVolume: (id: string, volume: number) => void;
  toggleMute: (id: string) => void;
  reorderTracks: (fromIndex: number, toIndex: number) => void;
  resetTracks: () => void;
  setCurrentCity: (city: string) => void;
  setWeatherData: (data: WeatherData | null) => void;
  togglePlay: () => void;
  setPlaying: (playing: boolean) => void;
  savePreset: (name: string) => void;
  loadPreset: (id: string) => Preset | undefined;
  deletePreset: (id: string) => void;
  setIsFlipping: (flipping: boolean) => void;
  setSpectrumPeak: (peak: number) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  tracks: initialTracks,
  currentCity: '北京',
  weatherData: null,
  isPlaying: false,
  presets: [],
  selectedPresetId: null,
  isFlipping: false,
  spectrumPeak: 0,

  setTracks: (tracks: SoundTrack[]) => set({ tracks }),

  setTrackVolume: (id: string, volume: number) =>
    set((state) => ({
      tracks: state.tracks.map((track) =>
        track.id === id ? { ...track, volume, previousVolume: volume, muted: false } : track
      ),
    })),

  toggleMute: (id: string) =>
    set((state) => ({
      tracks: state.tracks.map((track) => {
        if (track.id !== id) return track;
        if (track.muted) {
          return { ...track, muted: false, volume: track.previousVolume };
        } else {
          return { ...track, muted: true, previousVolume: track.volume, volume: 0 };
        }
      }),
    })),

  resetTracks: () =>
    set(() => ({
      tracks: initialTracks.map((t) => ({ ...t, id: uuidv4(), volume: 50, previousVolume: 50, muted: false })),
    })),

  reorderTracks: (fromIndex: number, toIndex: number) =>
    set((state) => {
      const newTracks = [...state.tracks];
      const [removed] = newTracks.splice(fromIndex, 1);
      newTracks.splice(toIndex, 0, removed);
      return { tracks: newTracks };
    }),

  setCurrentCity: (city: string) => set({ currentCity: city }),

  setWeatherData: (data: WeatherData | null) => set({ weatherData: data }),

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

  setPlaying: (playing: boolean) => set({ isPlaying: playing }),

  savePreset: (name: string) =>
    set((state) => {
      const newPreset: Preset = {
        id: uuidv4(),
        name,
        city: state.currentCity,
        tracks: state.tracks.map((track) => ({ ...track })),
        createdAt: Date.now(),
      };
      let newPresets = [...state.presets, newPreset];
      if (newPresets.length > 6) {
        newPresets = newPresets.slice(-6);
      }
      return { presets: newPresets, selectedPresetId: newPreset.id };
    }),

  loadPreset: (id: string) => {
    const preset = get().presets.find((p) => p.id === id);
    if (preset) {
      set({
        tracks: preset.tracks.map((track) => ({ ...track })),
        currentCity: preset.city,
        selectedPresetId: id,
      });
    }
    return preset;
  },

  deletePreset: (id: string) =>
    set((state) => ({
      presets: state.presets.filter((p) => p.id !== id),
      selectedPresetId: state.selectedPresetId === id ? null : state.selectedPresetId,
    })),

  setIsFlipping: (flipping: boolean) => set({ isFlipping: flipping }),

  setSpectrumPeak: (peak: number) => set({ spectrumPeak: peak }),
}));
