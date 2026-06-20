export type Mood = 'happy' | 'calm' | 'sad' | 'angry';

export interface AudioMetadata {
  baseFrequency: number;
  amplitude: number;
  waveformData: number[];
}

export interface Diary {
  id: string;
  date: string;
  text: string;
  mood: Mood;
  weather: string;
  audioUrl: string;
  audioMetadata: AudioMetadata;
  createdAt: string;
}

export interface CreateDiaryRequest {
  text: string;
  mood: Mood;
  weather: string;
  audioUrl: string;
  audioMetadata: AudioMetadata;
}

export interface AudioAnalysisResult {
  baseFrequency: number;
  amplitude: number;
  waveformData: number[];
  mood: Mood;
}
