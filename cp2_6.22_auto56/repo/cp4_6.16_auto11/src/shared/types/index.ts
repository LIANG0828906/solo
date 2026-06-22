export interface Photo {
  id: string;
  url: string;
  thumbnailUrl: string;
  name: string;
  originalSize: number;
  compressedSize: number;
  uploadedAt: string;
}

export interface MapMarker {
  id: string;
  pageId: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  photoId?: string;
  createdAt: string;
}

export interface MoodTagDef {
  id: string;
  label: string;
  emoji: string;
}

export const MOOD_TAGS: MoodTagDef[] = [
  { id: 'happy', label: '开心', emoji: '😊' },
  { id: 'excited', label: '兴奋', emoji: '🤩' },
  { id: 'calm', label: '放松', emoji: '😌' },
  { id: 'tired', label: '疲惫', emoji: '😴' },
  { id: 'surprised', label: '惊喜', emoji: '😲' },
  { id: 'sad', label: '伤感', emoji: '😢' },
  { id: 'grateful', label: '感恩', emoji: '🙏' },
  { id: 'nostalgic', label: '宁静', emoji: '🧘' },
];

export interface TripPage {
  id: string;
  tripId: string;
  title: string;
  date: string;
  diaryContent: string;
  moodTags: MoodTagDef[];
  photos: Photo[];
  markers: MapMarker[];
  pageNumber: number;
}

export interface Trip {
  id: string;
  name: string;
  description: string;
  coverImage?: string;
  startDate: string;
  endDate?: string;
  pages: TripPage[];
  createdAt: string;
  updatedAt: string;
}

export interface SearchLocationResult {
  id: string;
  name: string;
  displayName: string;
  lat: number;
  lng: number;
}

export interface ThemeState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}
