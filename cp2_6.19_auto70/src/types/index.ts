export type AspectRatio = '16:9' | '1:1';

export interface Card {
  id: string;
  imageUrl: string;
  thumbnailUrl: string;
  aspectRatio: AspectRatio;
  width: number;
  height: number;
  caption: string;
  note: string;
  tags: string[];
  createdAt: Date;
  order: number;
  selected: boolean;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  cardCount: number;
}

export interface Note {
  id: string;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  backgroundColor: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExportLayout {
  columns: number;
  rowGap: number;
  columnGap: number;
  cardWidth: number;
}

export type ExportFormat = 'png' | 'pdf';

export interface ExportConfig {
  format: ExportFormat;
  layout: ExportLayout;
}

export interface CaptureState {
  mode: 'idle' | 'select' | 'upload' | 'crop';
  selectedImage: string | null;
  cropAspectRatio: AspectRatio;
  cropZoom: number;
}
