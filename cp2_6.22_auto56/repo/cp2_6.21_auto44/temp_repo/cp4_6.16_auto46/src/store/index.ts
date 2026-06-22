import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { AppState, Artist, MusicTrack, TourDate, ThemeType } from '@/types';
import { addItem, getAll, updateItem, deleteItem, openDB } from '@/utils/db';
import { applyTheme } from '@/utils/theme';

let audioElement: HTMLAudioElement | null = null;

function getAudioElement(): HTMLAudioElement {
  if (!audioElement) {
    audioElement = new Audio();
    audioElement.preload = 'auto';
  }
  return audioElement;
}

export const useStore = create<AppState>((set, get) => ({
  artist: null,
  tracks: [],
  currentTrackIndex: -1,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.7,
  tourDates: [],

  setArtist: (artist: Artist) => {
    set({ artist });
    applyTheme(artist.theme);
    addItem('artist', artist);
  },

  updateArtist: (updates: Partial<Artist>) => {
    const { artist } = get();
    if (artist) {
      const updated = { ...artist, ...updates, updatedAt: Date.now() } as Artist;
      set({ artist: updated });
      if (updates.theme) {
        applyTheme(updates.theme as ThemeType);
      }
      updateItem('artist', artist.id, updates);
    }
  },

  addTrack: (track: MusicTrack) => {
    set((state) => ({ tracks: [...state.tracks, track] }));
    addItem('musicTracks', track);
  },

  updateTrack: (id: string, updates: Partial<MusicTrack>) => {
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t
      ),
    }));
    updateItem('musicTracks', id, updates);
  },

  deleteTrack: (id: string) => {
    set((state) => ({
      tracks: state.tracks.filter((t) => t.id !== id),
    }));
    deleteItem('musicTracks', id);
  },

  setTracks: (tracks: MusicTrack[]) => {
    set({ tracks });
  },

  playTrack: (index: number) => {
    const { tracks } = get();
    const track = tracks[index];
    if (!track) return;

    const audio = getAudioElement();
    
    set({ currentTrackIndex: index, isPlaying: true });

    if (audio.src !== track.audioFile) {
      audio.src = track.audioFile;
    }

    audio.volume = get().volume;
    audio.play().catch(console.error);

    audio.ontimeupdate = () => {
      set({ currentTime: audio.currentTime });
    };

    audio.onloadedmetadata = () => {
      set({ duration: audio.duration });
    };

    audio.onended = () => {
      get().nextTrack();
    };
  },

  pauseTrack: () => {
    const audio = getAudioElement();
    audio.pause();
    set({ isPlaying: false });
  },

  nextTrack: () => {
    const { currentTrackIndex, tracks } = get();
    const publishedTracks = tracks.filter((t) => t.status === 'published');
    const currentPublishedIndex = publishedTracks.findIndex(
      (t) => t.id === tracks[currentTrackIndex]?.id
    );
    const nextIndex = (currentPublishedIndex + 1) % publishedTracks.length;
    const originalIndex = tracks.findIndex((t) => t.id === publishedTracks[nextIndex]?.id);
    
    if (originalIndex !== -1) {
      get().playTrack(originalIndex);
    }
  },

  prevTrack: () => {
    const { currentTrackIndex, tracks } = get();
    const publishedTracks = tracks.filter((t) => t.status === 'published');
    const currentPublishedIndex = publishedTracks.findIndex(
      (t) => t.id === tracks[currentTrackIndex]?.id
    );
    const prevIndex = (currentPublishedIndex - 1 + publishedTracks.length) % publishedTracks.length;
    const originalIndex = tracks.findIndex((t) => t.id === publishedTracks[prevIndex]?.id);
    
    if (originalIndex !== -1) {
      get().playTrack(originalIndex);
    }
  },

  setCurrentTime: (time: number) => {
    const audio = getAudioElement();
    audio.currentTime = time;
    set({ currentTime: time });
  },

  setVolume: (volume: number) => {
    const audio = getAudioElement();
    audio.volume = volume;
    set({ volume });
  },

  addTourDate: (date: TourDate) => {
    set((state) => ({ tourDates: [...state.tourDates, date] }));
    addItem('tourDates', date);
  },

  updateTourDate: (id: string, updates: Partial<TourDate>) => {
    set((state) => ({
      tourDates: state.tourDates.map((d) =>
        d.id === id ? { ...d, ...updates, updatedAt: Date.now() } : d
      ),
    }));
    updateItem('tourDates', id, updates);
  },

  deleteTourDate: (id: string) => {
    set((state) => ({
      tourDates: state.tourDates.filter((d) => d.id !== id),
    }));
    deleteItem('tourDates', id);
  },

  setTourDates: (dates: TourDate[]) => {
    set({ tourDates: dates });
  },

  loadFromDB: async () => {
    console.time('loadFromDB');
    
    const [artists, tracks, tourDates] = await Promise.all([
      getAll('artist'),
      getAll('musicTracks'),
      getAll('tourDates'),
    ]);

    if (artists.length > 0) {
      const artist = artists[0] as Artist;
      set({ artist });
      applyTheme(artist.theme);
    } else {
      const defaultArtist: Artist = {
        id: uuidv4(),
        name: '你的艺名',
        avatar: '',
        bio: '## 关于我\n\n在这里写下你的音乐人简介...\n\n### 音乐风格\n\n- 独立摇滚\n- 电子音乐\n- 流行',
        theme: 'night',
        socialLinks: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      set({ artist: defaultArtist });
      applyTheme('night');
      addItem('artist', defaultArtist);
    }

    set({ tracks: tracks as MusicTrack[] });
    set({ tourDates: tourDates as TourDate[] });

    console.timeEnd('loadFromDB');
  },

  saveToDB: async () => {
    const { artist, tracks, tourDates } = get();
    
    if (artist) {
      await addItem('artist', artist);
    }
    
    for (const track of tracks) {
      await addItem('musicTracks', track);
    }
    
    for (const date of tourDates) {
      await addItem('tourDates', date);
    }
  },
}));
