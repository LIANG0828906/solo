export interface Class {
  id: string;
  name: string;
  studentCount: number;
  lastGradedDate: string;
}

export interface Essay {
  id: string;
  classId: string;
  studentName: string;
  title: string;
  content: string;
  filePath?: string;
  uploadTime: string;
  paragraphs: string[];
}

export interface Comment {
  id: string;
  essayId: string;
  paragraphIndex: number;
  content: string;
  type: 'positive' | 'improvement';
  presetType?: string;
  createdAt: string;
}

export interface PresetComment {
  id: string;
  content: string;
  type: 'positive' | 'improvement';
  createdAt: string;
}

export interface Score {
  id: string;
  essayId: string;
  content: number;
  language: number;
  structure: number;
  creativity: number;
  gradedAt: string;
}

export interface DimensionStats {
  dimension: string;
  average: number;
  color: string;
}

export interface GradeDistribution {
  grade: string;
  count: number;
  color: string;
}

export interface RadarData {
  dimension: string;
  student: number;
  classAverage: number;
}

export interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}

export interface PopupPosition {
  top: number;
  left: number;
}
