export enum LayoutMode {
  GRID = 'grid',
  TIMELINE = 'timeline',
  RANDOM = 'random',
}

export interface Card {
  id: string;
  title: string;
  content: string;
  photoUrl: string | null;
  position: { x: number; y: number; z: number };
  wallIndex: number;
  createdAt: string;
  color: string;
}

export interface CreateCardPayload {
  title: string;
  content: string;
  photoBase64?: string;
  position?: { x: number; y: number; z: number };
  wallIndex?: number;
  color?: string;
}

export type ApiResponse<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
};
