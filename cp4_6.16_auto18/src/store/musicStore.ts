import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { storage } from '../utils/localStorage';
import { format, isSameMonth } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export interface Album {
  id: string;
  name: string;
  artist: string;
  year: number;
  coverUrl: string;
  genre: string;
  createdAt: string;
  likes: number;
}

export const GENRES = ['流行', '摇滚', '电子', '爵士', '古典', '嘻哈', '民谣', 'R&B', '金属', '朋克'];

const VIRTUAL_ALBUMS: Omit<Album, 'id' | 'createdAt' | 'likes'>[] = [
  { name: '夜空中最亮的星', artist: '逃跑计划', year: 2011, coverUrl: '', genre: '摇滚' },
  { name: '七里香', artist: '周杰伦', year: 2004, coverUrl: '', genre: '流行' },
  { name: 'Blue', artist: 'Joni Mitchell', year: 1971, coverUrl: '', genre: '民谣' },
  { name: 'Random Access Memories', artist: 'Daft Punk', year: 2013, coverUrl: '', genre: '电子' },
  { name: 'Kind of Blue', artist: 'Miles Davis', year: 1959, coverUrl: '', genre: '爵士' },
  { name: 'The Dark Side of the Moon', artist: 'Pink Floyd', year: 1973, coverUrl: '', genre: '摇滚' },
  { name: '25', artist: 'Adele', year: 2015, coverUrl: '', genre: '流行' },
  { name: 'Thriller', artist: 'Michael Jackson', year: 1982, coverUrl: '', genre: '流行' },
  { name: 'Nevermind', artist: 'Nirvana', year: 1991, coverUrl: '', genre: '摇滚' },
  { name: 'Abbey Road', artist: 'The Beatles', year: 1969, coverUrl: '', genre: '摇滚' },
  { name: 'Lemonade', artist: 'Beyoncé', year: 2016, coverUrl: '', genre: 'R&B' },
  { name: 'good kid, m.A.A.d city', artist: 'Kendrick Lamar', year: 2012, coverUrl: '', genre: '嘻哈' }
];

interface MusicState {
  albums: Album[];
  likes: Record<string, number>;
  isInitialized: boolean;
  currentPlaying: string | null;
  searchQuery: string;
  filterGenre: string;
  filterArtist: string;
  filterYear: string;
  sortBy: 'date' | 'name';
  sortOrder: 'asc' | 'desc';

  init: () => Promise<void>;
  addAlbum: (album: Omit<Album, 'id' | 'createdAt' | 'likes'>) => Promise<void>;
  removeAlbum: (id: string) => Promise<void>;
  updateAlbum: (id: string, updates: Partial<Album>) => Promise<void>;
  likeAlbum: (id: string) => Promise<void>;
  setCurrentPlaying: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setFilterGenre: (genre: string) => void;
  setFilterArtist: (artist: string) => void;
  setFilterYear: (year: string) => void;
  setSortBy: (sortBy: 'date' | 'name') => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  getDiscoveryAlbum: () => Album;
  getMonthlyReport: () => {
    totalCollected: number;
    topAlbums: Album[];
    favoriteGenre: string;
    genreDistribution: Record<string, number>;
    totalArtists: number;
    month: string;
    slogan: string;
  };
  getFilteredAlbums: () => Album[];
  getStats: () => {
    totalAlbums: number;
    totalArtists: number;
    genreDistribution: Record<string, number>;
  };
}

export const useMusicStore = create<MusicState>((set, get) => ({
  albums: [],
  likes: {},
  isInitialized: false,
  currentPlaying: null,
  searchQuery: '',
  filterGenre: '',
  filterArtist: '',
  filterYear: '',
  sortBy: 'date',
  sortOrder: 'desc',

  init: async () => {
    const [albums, likes] = await Promise.all([
      storage.getAlbums(),
      storage.getLikes()
    ]);
    set({ albums, likes, isInitialized: true });
  },

  addAlbum: async (albumData) => {
    const newAlbum: Album = {
      ...albumData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      likes: 0
    };
    const albums = [...get().albums, newAlbum];
    set({ albums });
    await storage.saveAlbums(albums);
  },

  removeAlbum: async (id) => {
    const albums = get().albums.filter(a => a.id !== id);
    const likes = { ...get().likes };
    delete likes[id];
    set({ albums, likes });
    await Promise.all([
      storage.saveAlbums(albums),
      storage.saveLikes(likes)
    ]);
  },

  updateAlbum: async (id, updates) => {
    const albums = get().albums.map(a =>
      a.id === id ? { ...a, ...updates } : a
    );
    set({ albums });
    await storage.saveAlbums(albums);
  },

  likeAlbum: async (id) => {
    const likes = { ...get().likes };
    likes[id] = (likes[id] || 0) + 1;
    const albums = get().albums.map(a =>
      a.id === id ? { ...a, likes: a.likes + 1 } : a
    );
    set({ likes, albums });
    await Promise.all([
      storage.saveLikes(likes),
      storage.saveAlbums(albums)
    ]);
  },

  setCurrentPlaying: (id) => set({ currentPlaying: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilterGenre: (genre) => set({ filterGenre: genre }),
  setFilterArtist: (artist) => set({ filterArtist: artist }),
  setFilterYear: (year) => set({ filterYear: year }),
  setSortBy: (sortBy) => set({ sortBy }),
  setSortOrder: (sortOrder) => set({ sortOrder }),

  getDiscoveryAlbum: () => {
    const { albums } = get();
    let pool: Album[] = [...albums];
    
    if (albums.length < 10) {
      const virtualCount = 10 - albums.length;
      const shuffled = [...VIRTUAL_ALBUMS].sort(() => Math.random() - 0.5);
      for (let i = 0; i < virtualCount && i < shuffled.length; i++) {
        pool.push({
          ...shuffled[i],
          id: uuidv4(),
          createdAt: new Date().toISOString(),
          likes: 0
        });
      }
    }
    
    return pool[Math.floor(Math.random() * pool.length)];
  },

  getMonthlyReport: () => {
    const { albums, likes } = get();
    const now = new Date();
    const monthStr = format(now, 'yyyy年MM月', { locale: zhCN });

    const monthAlbums = albums.filter(a => isSameMonth(new Date(a.createdAt), now));
    const totalCollected = monthAlbums.length;
    const totalArtists = new Set(monthAlbums.map(a => a.artist)).size;

    const genreDistribution: Record<string, number> = {};
    monthAlbums.forEach(a => {
      genreDistribution[a.genre] = (genreDistribution[a.genre] || 0) + 1;
    });

    let favoriteGenre = '';
    let maxCount = 0;
    Object.entries(genreDistribution).forEach(([genre, count]) => {
      if (count > maxCount) {
        maxCount = count;
        favoriteGenre = genre;
      }
    });

    const albumsWithLikes = monthAlbums.map(a => ({
      ...a,
      likes: likes[a.id] || a.likes
    }));

    const topAlbums = albumsWithLikes
      .sort((a, b) => b.likes - a.likes)
      .slice(0, 3);

    const slogans = [
      '音乐是流动的建筑，建筑是凝固的音乐。',
      '每一首歌都是一段旅程，每一张专辑都是一个世界。',
      '在音符里寻找共鸣，在旋律中遇见自己。',
      '音乐是唯一不会背叛你的朋友。',
      '让耳朵去旅行，让心灵去流浪。'
    ];
    const slogan = slogans[Math.floor(Math.random() * slogans.length)];

    return {
      totalCollected,
      topAlbums,
      favoriteGenre,
      genreDistribution,
      totalArtists,
      month: monthStr,
      slogan
    };
  },

  getFilteredAlbums: () => {
    const { albums, searchQuery, filterGenre, filterArtist, filterYear, sortBy, sortOrder } = get();
    
    let filtered = [...albums];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a =>
        a.name.toLowerCase().includes(query) ||
        a.artist.toLowerCase().includes(query)
      );
    }

    if (filterGenre) {
      filtered = filtered.filter(a => a.genre === filterGenre);
    }

    if (filterArtist) {
      filtered = filtered.filter(a => a.artist === filterArtist);
    }

    if (filterYear) {
      filtered = filtered.filter(a => a.year.toString() === filterYear);
    }

    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return sortOrder === 'desc'
          ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else {
        return sortOrder === 'desc'
          ? b.name.localeCompare(a.name, 'zh-CN')
          : a.name.localeCompare(b.name, 'zh-CN');
      }
    });

    return filtered;
  },

  getStats: () => {
    const { albums } = get();
    const totalAlbums = albums.length;
    const totalArtists = new Set(albums.map(a => a.artist)).size;

    const genreDistribution: Record<string, number> = {};
    albums.forEach(a => {
      genreDistribution[a.genre] = (genreDistribution[a.genre] || 0) + 1;
    });

    return { totalAlbums, totalArtists, genreDistribution };
  }
}));
