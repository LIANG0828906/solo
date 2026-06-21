export interface Speaker {
  id: string;
  name: string;
  color: string;
  note?: string;
}

export interface TranscriptSentence {
  id: string;
  speakerId: string;
  text: string;
  startTime: number;
  endTime: number;
}

export interface TranscriptResult {
  sentences: TranscriptSentence[];
  speakers: Speaker[];
  duration: number;
}

export type UploadStatus = 'idle' | 'uploading' | 'transcribing' | 'completed' | 'error';

export type ExportFormat = 'txt' | 'srt' | 'json';
