import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { generateCoverColors, generatePatternType } from '../utils/colorPalette';

export type CoverPattern = 'circles' | 'triangles' | 'squares' | 'waves';

export interface Track {
  id: string;
  title: string;
  artist: string;
  genre: string;
  duration: number;
  coverColors: string[];
  coverPattern: CoverPattern;
}

export interface RadioStation {
  id: string;
  name: string;
  queue: Track[];
  createdAt: number;
}

export interface PlayState {
  currentTrack: Track | null;
  isPlaying: boolean;
  progress: number;
  volume: number;
}

interface StoreState {
  trackLibrary: Track[];
  collections: Track[];
  stations: RadioStation[];
  currentStation: RadioStation | null;
  playState: PlayState;
  searchText: string;
  searchResults: Track[];
  notification: { message: string; visible: boolean } | null;
  draggedTrack: Track | null;
  flashTrackId: string | null;
  setSearchText: (text: string) => void;
  searchTracks: () => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (trackId: string) => void;
  addToCollection: (track: Track) => void;
  removeFromCollection: (trackId: string) => void;
  createStation: (name: string) => void;
  setCurrentTrack: (track: Track) => void;
  togglePlay: () => void;
  setProgress: (progress: number) => void;
  addTracksByGenre: (genre: string, count: number) => void;
  showNotification: (message: string) => void;
  hideNotification: () => void;
  setDraggedTrack: (track: Track | null) => void;
  setFlashTrackId: (id: string | null) => void;
  playNext: () => void;
}

const genreMap: Record<string, string> = {
  'folk': '民谣',
  'electronic': '电子',
  'jazz': '爵士',
  'classical': '古典',
  'rock': '摇滚',
  'pop': '流行'
};

const mockTracksData: Array<{ title: string; artist: string; genre: string }> = [
  { title: '午夜呓语', artist: '林墨然', genre: 'folk' },
  { title: '城市漫游者', artist: '陈北风', genre: 'folk' },
  { title: '山间细雨', artist: '苏清瑶', genre: 'folk' },
  { title: '老街的回忆', artist: '王子谦', genre: 'folk' },
  { title: '春天的列车', artist: '李宛瑜', genre: 'folk' },
  { title: '霓虹梦境', artist: 'SynthWave', genre: 'electronic' },
  { title: '二进制心跳', artist: 'CyberPunk', genre: 'electronic' },
  { title: '量子跃迁', artist: 'Electron-X', genre: 'electronic' },
  { title: '未来回响', artist: 'Neon Lights', genre: 'electronic' },
  { title: '数据瀑布', artist: 'Bit Storm', genre: 'electronic' },
  { title: '蓝调时刻', artist: '爵士三重奏', genre: 'jazz' },
  { title: '月光小酒馆', artist: 'The Smooth Notes', genre: 'jazz' },
  { title: '咖啡与烟', artist: 'Midnight Quartet', genre: 'jazz' },
  { title: '纽约的秋天', artist: 'Jazz Express', genre: 'jazz' },
  { title: '慵懒周日', artist: 'Coffee & Jazz', genre: 'jazz' },
  { title: '命运交响曲', artist: '贝多芬', genre: 'classical' },
  { title: '月光奏鸣曲', artist: '贝多芬', genre: 'classical' },
  { title: '天鹅湖', artist: '柴可夫斯基', genre: 'classical' },
  { title: '四季·春', artist: '维瓦尔第', genre: 'classical' },
  { title: '蓝色多瑙河', artist: '施特劳斯', genre: 'classical' },
  { title: '摇滚不死', artist: '铁凤凰', genre: 'rock' },
  { title: '燃烧的青春', artist: 'Electric Soul', genre: 'rock' },
  { title: '公路之歌', artist: 'The Roadsters', genre: 'rock' },
  { title: '黎明之前', artist: 'Dark Horse', genre: 'rock' },
  { title: '自由宣言', artist: 'Rebel Heart', genre: 'rock' },
  { title: '爱的告白', artist: '周杰伦', genre: 'pop' },
  { title: '夏日微风', artist: 'Taylor Swift', genre: 'pop' },
  { title: '星光璀璨', artist: 'BTS', genre: 'pop' },
  { title: '舞动青春', artist: 'Dua Lipa', genre: 'pop' },
  { title: '梦想起航', artist: '林俊杰', genre: 'pop' },
  { title: '海上钢琴师', artist: 'Ennio Morricone', genre: 'classical' },
  { title: '雨中漫步', artist: 'The Beatles', genre: 'rock' },
  { title: '紫色天空', artist: 'Prince', genre: 'pop' },
  { title: '爵士春秋', artist: 'Miles Davis', genre: 'jazz' },
  { title: '电子花园', artist: 'Daft Punk', genre: 'electronic' },
  { title: '橄榄树', artist: '齐豫', genre: 'folk' },
  { title: '夜空中最亮的星', artist: '逃跑计划', genre: 'rock' },
  { title: '稻香', artist: '周杰伦', genre: 'pop' },
  { title: 'River Flows in You', artist: 'Yiruma', genre: 'classical' },
  { title: 'Take Five', artist: 'Dave Brubeck', genre: 'jazz' },
  { title: 'Levels', artist: 'Avicii', genre: 'electronic' },
  { title: 'Blowin\' in the Wind', artist: 'Bob Dylan', genre: 'folk' },
  { title: 'Bohemian Rhapsody', artist: 'Queen', genre: 'rock' },
  { title: 'Shape of You', artist: 'Ed Sheeran', genre: 'pop' },
  { title: 'Clair de Lune', artist: 'Debussy', genre: 'classical' },
  { title: 'So What', artist: 'Miles Davis', genre: 'jazz' },
  { title: 'Strobe', artist: 'Deadmau5', genre: 'electronic' },
  { title: 'Hallelujah', artist: 'Leonard Cohen', genre: 'folk' },
  { title: 'Stairway to Heaven', artist: 'Led Zeppelin', genre: 'rock' },
  { title: 'Thriller', artist: 'Michael Jackson', genre: 'pop' },
];

function createMockTrack(data: { title: string; artist: string; genre: string }): Track {
  return {
    id: uuidv4(),
    title: data.title,
    artist: data.artist,
    genre: data.genre,
    duration: 180 + Math.floor(Math.random() * 180),
    coverColors: generateCoverColors(data.title),
    coverPattern: generatePatternType(data.title),
  };
}

const mockTracks: Track[] = mockTracksData.map(createMockTrack);
const initialCollections: Track[] = mockTracks.slice(0, 12);
const initialQueue: Track[] = mockTracks.slice(12, 15);

const initialStation: RadioStation = {
  id: uuidv4(),
  name: '我的电台',
  queue: initialQueue,
  createdAt: Date.now(),
};

export const useStore = create<StoreState>((set, get) => ({
  trackLibrary: mockTracks,
  collections: initialCollections,
  stations: [initialStation],
  currentStation: initialStation,
  playState: {
    currentTrack: initialQueue[0] || null,
    isPlaying: false,
    progress: 0,
    volume: 0.7,
  },
  searchText: '',
  searchResults: [],
  notification: null,
  draggedTrack: null,
  flashTrackId: null,

  setSearchText: (text: string) => {
    set({ searchText: text });
    if (text.trim()) {
      get().searchTracks();
    } else {
      set({ searchResults: [] });
    }
  },

  searchTracks: () => {
    const { trackLibrary, searchText } = get();
    const text = searchText.toLowerCase();
    const results = trackLibrary.filter(
      (track) =>
        track.title.toLowerCase().includes(text) ||
        track.artist.toLowerCase().includes(text)
    ).slice(0, 8);
    set({ searchResults: results });
  },

  addToQueue: (track: Track) => {
    const { currentStation } = get();
    if (!currentStation) return;

    const updatedStation = {
      ...currentStation,
      queue: [...currentStation.queue, track],
    };

    set((state) => ({
      stations: state.stations.map((s) =>
        s.id === updatedStation.id ? updatedStation : s
      ),
      currentStation: updatedStation,
    }));

    if (!get().playState.currentTrack) {
      get().setCurrentTrack(track);
    }
  },

  removeFromQueue: (trackId: string) => {
    const { currentStation } = get();
    if (!currentStation) return;

    const updatedQueue = currentStation.queue.filter((t) => t.id !== trackId);
    const updatedStation = {
      ...currentStation,
      queue: updatedQueue,
    };

    set((state) => ({
      stations: state.stations.map((s) =>
        s.id === updatedStation.id ? updatedStation : s
      ),
      currentStation: updatedStation,
    }));

    const { playState } = get();
    if (playState.currentTrack?.id === trackId) {
      if (updatedQueue.length > 0) {
        get().setCurrentTrack(updatedQueue[0]);
      } else {
        set({
          playState: {
            ...playState,
            currentTrack: null,
            isPlaying: false,
            progress: 0,
          },
        });
      }
    }
  },

  addToCollection: (track: Track) => {
    const { collections } = get();
    if (collections.find((t) => t.id === track.id)) return;
    set({ collections: [...collections, track] });
  },

  removeFromCollection: (trackId: string) => {
    set((state) => ({
      collections: state.collections.filter((t) => t.id !== trackId),
    }));
  },

  createStation: (name: string) => {
    const newStation: RadioStation = {
      id: uuidv4(),
      name,
      queue: [],
      createdAt: Date.now(),
    };
    set((state) => ({
      stations: [...state.stations, newStation],
      currentStation: newStation,
    }));
  },

  setCurrentTrack: (track: Track) => {
    set((state) => ({
      playState: {
        ...state.playState,
        currentTrack: track,
        progress: 0,
      },
    }));
    get().addToCollection(track);
  },

  togglePlay: () => {
    const { playState } = get();
    if (!playState.currentTrack) return;
    set((state) => ({
      playState: {
        ...state.playState,
        isPlaying: !state.playState.isPlaying,
      },
    }));
  },

  setProgress: (progress: number) => {
    set((state) => ({
      playState: {
        ...state.playState,
        progress: Math.max(0, Math.min(1, progress)),
      },
    }));
  },

  addTracksByGenre: (genre: string, count: number) => {
    const { trackLibrary, addToQueue } = get();
    const genreTracks = trackLibrary
      .filter((t) => t.genre === genre)
      .slice(0, count);

    genreTracks.forEach((track, index) => {
      setTimeout(() => addToQueue(track), index * 100);
    });

    const genreName = genreMap[genre] || genre;
    get().showNotification(`已添加${count}首${genreName}曲目`);
  },

  showNotification: (message: string) => {
    set({ notification: { message, visible: true } });
    setTimeout(() => {
      get().hideNotification();
    }, 1500);
  },

  hideNotification: () => {
    set({ notification: null });
  },

  setDraggedTrack: (track: Track | null) => {
    set({ draggedTrack: track });
  },

  setFlashTrackId: (id: string | null) => {
    set({ flashTrackId: id });
    if (id) {
      setTimeout(() => set({ flashTrackId: null }), 500);
    }
  },

  playNext: () => {
    const { currentStation, playState, setCurrentTrack } = get();
    if (!currentStation || currentStation.queue.length === 0) return;

    const currentIndex = currentStation.queue.findIndex(
      (t) => t.id === playState.currentTrack?.id
    );
    const nextIndex = (currentIndex + 1) % currentStation.queue.length;
    setCurrentTrack(currentStation.queue[nextIndex]);
  },
}));

export { genreMap };
