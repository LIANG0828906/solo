export interface FrameData {
  id: string;
  index: number;
  timestamp: number;
  blob: Blob;
  url: string;
}

export interface TagItem {
  name: string;
  color: string;
}

export interface MarkData {
  frameId: string;
  tags: TagItem[];
  rating: number;
  note: string;
}

export interface ProjectData {
  id: string;
  fileName: string;
  createdAt: number;
  frameCount: number;
  markCount: number;
  frameUrls: string[];
  frameTimestamps: number[];
  marks: Record<string, MarkData>;
}

export interface ProjectMeta {
  id: string;
  fileName: string;
  createdAt: number;
  frameCount: number;
  markCount: number;
}

export const PRESET_COLORS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E', '#06B6D4',
  '#3B82F6', '#8B5CF6', '#EC4899', '#F43F5E', '#14B8A6',
];

export function getRandomColor(): string {
  return PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];
}

export function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}
