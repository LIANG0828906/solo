export type SoundCategory =
  | 'street_music'
  | 'nature'
  | 'traffic'
  | 'crowd'
  | 'mechanical'
  | 'other';

export const CATEGORY_LABELS: Record<SoundCategory, string> = {
  street_music: '街头音乐',
  nature: '自然声',
  traffic: '交通声',
  crowd: '人群',
  mechanical: '机械声',
  other: '其他',
};

export const CATEGORY_COLORS: Record<SoundCategory, string> = {
  street_music: '#ff6b6b',
  nature: '#51cf66',
  traffic: '#ffd43b',
  crowd: '#ff922b',
  mechanical: '#845ef7',
  other: '#00d2ff',
};

export const CATEGORY_EMOJIS: Record<SoundCategory, string> = {
  street_music: '🎵',
  nature: '🌿',
  traffic: '🚇',
  crowd: '👥',
  mechanical: '⚙️',
  other: '🔊',
};

export interface SoundClip {
  id: string;
  lat: number;
  lng: number;
  name: string;
  category: SoundCategory;
  description: string;
  rating: number;
  audioUrl: string;
  createdAt: string;
  userId: string;
  playCount: number;
}

export interface Comment {
  id: string;
  soundClipId: string;
  text: string;
  rating: number;
  userId: string;
  userName: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  clips: string[];
}

export interface UserRating {
  soundClipId: string;
  rating: number;
}
