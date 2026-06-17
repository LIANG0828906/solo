import { create } from 'zustand';
import { genres as defaultGenres, Genre } from '@/data/genres';
import { audioEngine } from '@/engine/audioEngine';

export interface Track {
  id: string;
  genreId: string | null;
  volume: number;
  isPlaying: boolean;
}

interface MixerState {
  genres: Genre[];
  tracks: Track[];
  isEngineInitialized: boolean;
  showRhythmEditor: boolean;
  editingGenreId: string | null;
  isExporting: boolean;

  initEngine: () => void;
  assignGenreToTrack: (trackId: string, genreId: string) => void;
  removeGenreFromTrack: (trackId: string) => void;
  setTrackVolume: (trackId: string, volume: number) => void;
  toggleTrack: (trackId: string) => void;
  setGenreVolume: (genreId: string, volume: number) => void;
  setRhythmPattern: (genreId: string, pattern: boolean[][]) => void;
  openRhythmEditor: (genreId: string) => void;
  closeRhythmEditor: () => void;
  exportWav: () => Promise<void>;
}

const createTracks = (): Track[] => {
  return Array.from({ length: 4 }, (_, i) => ({
    id: `track-${i}`,
    genreId: null,
    volume: 75,
    isPlaying: false,
  }));
};

export const useMixerStore = create<MixerState>((set, get) => ({
  genres: defaultGenres.map((g) => ({ ...g, rhythmPattern: g.rhythmPattern.map((row) => [...row]) })),
  tracks: createTracks(),
  isEngineInitialized: false,
  showRhythmEditor: false,
  editingGenreId: null,
  isExporting: false,

  initEngine: () => {
    const { isEngineInitialized } = get();
    if (isEngineInitialized) return;
    audioEngine.init();
    set({ isEngineInitialized: true });
  },

  assignGenreToTrack: (trackId: string, genreId: string) => {
    const { tracks, genres } = get();
    const trackIndex = tracks.findIndex((t) => t.id === trackId);
    if (trackIndex === -1) return;

    const genre = genres.find((g) => g.id === genreId);
    if (!genre) return;

    const existingTrack = tracks.find((t) => t.genreId === genreId && t.id !== trackId);
    if (existingTrack) return;

    const newTracks = [...tracks];
    const wasPlaying = newTracks[trackIndex].isPlaying;

    if (wasPlaying && newTracks[trackIndex].genreId) {
      audioEngine.stopTrack(trackId);
    }

    newTracks[trackIndex] = {
      ...newTracks[trackIndex],
      genreId,
      volume: genre.volume,
      isPlaying: false,
    };
    set({ tracks: newTracks });
  },

  removeGenreFromTrack: (trackId: string) => {
    const { tracks } = get();
    const trackIndex = tracks.findIndex((t) => t.id === trackId);
    if (trackIndex === -1) return;

    if (tracks[trackIndex].isPlaying) {
      audioEngine.stopTrack(trackId);
    }

    const newTracks = [...tracks];
    newTracks[trackIndex] = {
      ...newTracks[trackIndex],
      genreId: null,
      isPlaying: false,
    };
    set({ tracks: newTracks });
  },

  setTrackVolume: (trackId: string, volume: number) => {
    const { tracks } = get();
    const newTracks = tracks.map((t) =>
      t.id === trackId ? { ...t, volume } : t
    );
    const track = newTracks.find((t) => t.id === trackId);
    if (track?.isPlaying) {
      audioEngine.setTrackVolume(trackId, volume);
    }
    set({ tracks: newTracks });
  },

  toggleTrack: (trackId: string) => {
    const { tracks, genres, isEngineInitialized } = get();
    if (!isEngineInitialized) {
      audioEngine.init();
      set({ isEngineInitialized: true });
    }

    const track = tracks.find((t) => t.id === trackId);
    if (!track || !track.genreId) return;

    const genre = genres.find((g) => g.id === track.genreId);
    if (!genre) return;

    if (track.isPlaying) {
      audioEngine.stopTrack(trackId);
      const newTracks = tracks.map((t) =>
        t.id === trackId ? { ...t, isPlaying: false } : t
      );
      set({ tracks: newTracks });
    } else {
      audioEngine.playTrack(trackId, { ...genre, volume: track.volume });
      const newTracks = tracks.map((t) =>
        t.id === trackId ? { ...t, isPlaying: true } : t
      );
      set({ tracks: newTracks });
    }
  },

  setGenreVolume: (genreId: string, volume: number) => {
    set({
      genres: get().genres.map((g) =>
        g.id === genreId ? { ...g, volume } : g
      ),
    });
  },

  setRhythmPattern: (genreId: string, pattern: boolean[][]) => {
    const { genres, tracks } = get();
    const newGenres = genres.map((g) =>
      g.id === genreId ? { ...g, rhythmPattern: pattern.map((row) => [...row]) } : g
    );

    const playingTracks = tracks.filter((t) => t.genreId === genreId && t.isPlaying);
    playingTracks.forEach((t) => {
      audioEngine.stopTrack(t.id);
      const genre = newGenres.find((g) => g.id === genreId);
      if (genre) {
        audioEngine.playTrack(t.id, { ...genre, volume: t.volume });
      }
    });

    set({ genres: newGenres });
  },

  openRhythmEditor: (genreId: string) => {
    set({ showRhythmEditor: true, editingGenreId: genreId });
  },

  closeRhythmEditor: () => {
    set({ showRhythmEditor: false, editingGenreId: null });
  },

  exportWav: async () => {
    const { tracks, genres, isEngineInitialized } = get();
    if (!isEngineInitialized) {
      audioEngine.init();
      set({ isEngineInitialized: true });
    }

    set({ isExporting: true });

    const assignments = tracks
      .filter((t) => t.genreId)
      .map((t) => {
        const genre = genres.find((g) => g.id === t.genreId!)!;
        return { trackId: t.id, genre, volume: t.volume };
      });

    if (assignments.length === 0) {
      set({ isExporting: false });
      return;
    }

    try {
      await audioEngine.exportWav(genres, assignments);
    } finally {
      set({ isExporting: false });
    }
  },
}));
