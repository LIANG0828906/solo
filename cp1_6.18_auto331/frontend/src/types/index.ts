export interface User {
  id: number;
  username: string;
}

export interface Note {
  id: number;
  word: string;
  ipa: string;
  description: string;
  audioUrl: string | null;
  audioDuration: number;
  waveformData: number[];
  languageFamily: string;
  createdAt: string;
}

export interface MapMarker {
  id: string;
  family: string;
  x: number;
  y: number;
  count: number;
  color: string;
}

export interface AppState {
  user: User | null;
  notes: Note[];
  selectedNotes: number[];
  filterFamily: string | null;
  isOnline: boolean;
  mapZoom: number;
  mapOffset: { x: number; y: number };
  sidebarOpen: boolean;
  comparePanelOpen: boolean;
}

export interface AppActions {
  setUser: (user: User | null) => void;
  setNotes: (notes: Note[]) => void;
  addNote: (note: Note) => void;
  removeNote: (id: number) => void;
  toggleNoteSelection: (id: number) => void;
  clearSelection: () => void;
  setFilterFamily: (family: string | null) => void;
  setIsOnline: (online: boolean) => void;
  setMapZoom: (zoom: number) => void;
  setMapOffset: (offset: { x: number; y: number }) => void;
  toggleSidebar: () => void;
  toggleComparePanel: () => void;
}

export const VOWEL_COLORS: Record<string, string> = {
  'i:': '#00BFFF',
  'i': '#00CED1',
  'ɪ': '#48D1CC',
  'e': '#40E0D0',
  'ɛ': '#48D1CC',
  'æ': '#66CDAA',
  'a': '#90EE90',
  'a:': '#FF6347',
  'ʌ': '#FFA07A',
  'ə': '#FFD700',
  'ɜ:': '#DAA520',
  'u': '#9370DB',
  'u:': '#7C4DFF',
  'ʊ': '#8A2BE2',
  'o': '#9932CC',
  'ɔ:': '#8B008B',
  'ɔ': '#C71585',
  '3': '#FFD54F',
  'y': '#00BFFF',
  'ø': '#00CED1',
  'œ': '#48D1CC',
};

export const FAMILY_COLORS: Record<string, string> = {
  '印欧语系': '#7C4DFF',
  '汉藏语系': '#FF6347',
  '日本-琉球语系': '#00BFFF',
  '朝鲜语系': '#FFD54F',
  '亚非语系': '#00C853',
  '乌拉尔语系': '#FF6D00',
  '阿尔泰语系': '#AA00FF',
  '南岛语系': '#00BCD4',
  '其他': '#78909C',
};

export const FAMILY_POSITIONS: Record<string, { x: number; y: number }> = {
  '印欧语系': { x: 0.45, y: 0.35 },
  '汉藏语系': { x: 0.72, y: 0.4 },
  '日本-琉球语系': { x: 0.85, y: 0.35 },
  '朝鲜语系': { x: 0.8, y: 0.32 },
  '亚非语系': { x: 0.5, y: 0.55 },
  '乌拉尔语系': { x: 0.55, y: 0.25 },
  '阿尔泰语系': { x: 0.65, y: 0.28 },
  '南岛语系': { x: 0.78, y: 0.65 },
  '其他': { x: 0.2, y: 0.5 },
};

export const LANGUAGE_FAMILIES = [
  '印欧语系',
  '汉藏语系',
  '日本-琉球语系',
  '朝鲜语系',
  '亚非语系',
  '乌拉尔语系',
  '阿尔泰语系',
  '南岛语系',
  '其他',
];
