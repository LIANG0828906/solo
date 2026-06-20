export type LanguageCode = 'zh' | 'en' | 'ja' | 'ko' | 'fr';

export type SpeedLevel = 'slow' | 'normal' | 'fast';

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  flag: string;
}

export interface TranslationResult {
  sourceText: string;
  translatedText: string;
  sourceLang: LanguageCode;
  targetLang: LanguageCode;
  timestamp: number;
}

export interface BarrageItem {
  id: string;
  originalText: string;
  translations: Partial<Record<LanguageCode, string>>;
  sourceLang: LanguageCode;
  color: string;
  top: number;
  speed: SpeedLevel;
  likes: number;
  likedByCurrentUser: boolean;
  createdAt: number;
}

export interface UserSettings {
  targetLanguage: LanguageCode;
  speedLevel: SpeedLevel;
  filterKeyword: string;
}

export interface Statistics {
  onlineUsers: number;
  totalBarrages: number;
  translationRequests: number;
}

export const BARRAGE_COLORS: string[] = [
  '#ff6b6b',
  '#feca57',
  '#48dbfb',
  '#1dd1a1',
  '#ff9ff3',
  '#54a0ff',
  '#5f27cd',
  '#00d2d3'
];

export const SPEED_DURATION: Record<SpeedLevel, number> = {
  slow: 15000,
  normal: 10000,
  fast: 6000
};

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' }
];

export const MAX_BARRAGE_COUNT = 200;
export const TRANSLATION_THROTTLE_MS = 300;
export const MAX_INPUT_LENGTH = 100;
