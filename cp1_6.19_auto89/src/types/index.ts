export type MoodType = 'happy' | 'touched' | 'surprised' | 'calm' | 'tired';

export interface MoodConfig {
  type: MoodType;
  label: string;
  color: string;
  dotColor: string;
}

export interface Photo {
  id: string;
  url: string;
}

export interface Location {
  id: string;
  lat: number;
  lng: number;
  title: string;
  photos: Photo[];
  note: string;
  mood: MoodType;
  createdAt: number;
}

export interface AppState {
  locations: Location[];
  selectedLocationId: string | null;
  expandedLocationId: string | null;
  isInputPanelOpen: boolean;
  inputPanelPosition: { lat: number; lng: number } | null;
  isShareCardOpen: boolean;
  isSidebarOpen: boolean;
}

export type AppAction =
  | { type: 'ADD_LOCATION'; payload: Location }
  | { type: 'DELETE_LOCATION'; payload: string }
  | { type: 'SELECT_LOCATION'; payload: string | null }
  | { type: 'EXPAND_LOCATION'; payload: string | null }
  | { type: 'OPEN_INPUT_PANEL'; payload: { lat: number; lng: number } }
  | { type: 'CLOSE_INPUT_PANEL' }
  | { type: 'OPEN_SHARE_CARD' }
  | { type: 'CLOSE_SHARE_CARD' }
  | { type: 'TOGGLE_SIDEBAR' };

export const MOOD_CONFIGS: Record<MoodType, MoodConfig> = {
  happy: {
    type: 'happy',
    label: '开心',
    color: '#FFD93D',
    dotColor: '#FFD93D',
  },
  touched: {
    type: 'touched',
    label: '感动',
    color: '#FF6B6B',
    dotColor: '#FF6B6B',
  },
  surprised: {
    type: 'surprised',
    label: '惊喜',
    color: '#6BCB77',
    dotColor: '#6BCB77',
  },
  calm: {
    type: 'calm',
    label: '平静',
    color: '#4D96FF',
    dotColor: '#4D96FF',
  },
  tired: {
    type: 'tired',
    label: '疲惫',
    color: '#A3A3A3',
    dotColor: '#A3A3A3',
  },
};

export const MOOD_ORDER: MoodType[] = ['happy', 'touched', 'surprised', 'calm', 'tired'];
