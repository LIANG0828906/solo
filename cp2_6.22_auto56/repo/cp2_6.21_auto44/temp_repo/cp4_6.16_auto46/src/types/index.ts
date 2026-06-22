export type ThemeType = 'night' | 'retro' | 'minimal' | 'cyber';

export interface ThemeColors {
  primary: string;
  gradientStart: string;
  gradientEnd: string;
  accent: string;
}

export interface SocialLink {
  platform: 'spotify' | 'instagram' | 'youtube' | 'twitter' | 'soundcloud';
  url: string;
}

export interface Artist {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  theme: ThemeType;
  socialLinks: SocialLink[];
  createdAt: number;
  updatedAt: number;
}

export type TrackStatus = 'draft' | 'published';

export interface MusicTrack {
  id: string;
  artistId: string;
  title: string;
  coverImage: string;
  audioFile: string;
  lyrics: string;
  status: TrackStatus;
  createdAt: number;
  updatedAt: number;
}

export interface TourDate {
  id: string;
  artistId: string;
  date: string;
  time: string;
  venue: string;
  city: string;
  ticketLink: string;
  createdAt: number;
  updatedAt: number;
}

export interface AppState {
  artist: Artist | null;
  tracks: MusicTrack[];
  currentTrackIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  tourDates: TourDate[];
  setArtist: (artist: Artist) => void;
  updateArtist: (updates: Partial<Artist>) => void;
  addTrack: (track: MusicTrack) => void;
  updateTrack: (id: string, updates: Partial<MusicTrack>) => void;
  deleteTrack: (id: string) => void;
  setTracks: (tracks: MusicTrack[]) => void;
  playTrack: (index: number) => void;
  pauseTrack: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  setCurrentTime: (time: number) => void;
  setVolume: (volume: number) => void;
  addTourDate: (date: TourDate) => void;
  updateTourDate: (id: string, updates: Partial<TourDate>) => void;
  deleteTourDate: (id: string) => void;
  setTourDates: (dates: TourDate[]) => void;
  loadFromDB: () => Promise<void>;
  saveToDB: () => Promise<void>;
}
