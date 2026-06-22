export interface VideoMetadata {
  id: string;
  fileName: string;
  fileSize: number;
  duration: number;
  mimeType: string;
  uploadDate: number;
  url: string;
}

export interface CropRange {
  start: number;
  end: number;
}

export type TransitionType = 'fade' | 'flip' | 'zoom';

export interface Transition {
  id: string;
  position: number;
  type: TransitionType;
}

export interface Chapter {
  id: string;
  index: number;
  startTime: number;
  title: string;
}

export interface ProjectState {
  id: string;
  videoId: string | null;
  videoMetadata: VideoMetadata | null;
  cropRange: CropRange;
  transitions: Transition[];
  chapters: Chapter[];
  lastSaved: number;
  createdAt: number;
}

export interface ExportData {
  videoMetadata: VideoMetadata;
  cropRange: CropRange;
  transitions: Transition[];
  chapters: Chapter[];
  exportedAt: number;
}
