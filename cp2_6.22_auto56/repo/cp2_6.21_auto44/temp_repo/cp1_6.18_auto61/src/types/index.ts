export type EmotionType = 'happy' | 'sad' | 'angry' | 'calm';

export interface EmotionResult {
  emotion: EmotionType;
  intensity: number;
  spectrumData?: Float32Array;
}

export interface AudioItem {
  id: string;
  title: string;
  emotion: EmotionType;
  intensity: number;
  duration: number;
  playCount: number;
  createdAt: number;
  userId: string;
  audioUrl: string;
  thumbnailData: string;
}

export interface UserInfo {
  id: string;
  nickname: string;
  avatar: string;
}

export interface PlayState {
  isPlaying: boolean;
  currentAudioId: string | null;
  isFullscreen: boolean;
}

export interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
}

export interface EmotionColorMap {
  happy: string;
  sad: string;
  angry: string;
  calm: string;
}

export const EMOTION_COLORS: EmotionColorMap = {
  happy: '#FFD93D',
  sad: '#4D96FF',
  angry: '#FF6B6B',
  calm: '#6BCB77',
};

export const EMOTION_LABELS: Record<EmotionType, string> = {
  happy: '快乐',
  sad: '悲伤',
  angry: '愤怒',
  calm: '平静',
};
