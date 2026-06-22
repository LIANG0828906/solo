export interface Postcard {
  id: string;
  title: string;
  location: string;
  date: string;
  note: string;
  imageUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export interface AppState {
  postcards: Postcard[];
  selectedId: string | null;
  isDragging: boolean;
  zoomLevel: number;
  offsetX: number;
  offsetY: number;
}

export type ViewState = {
  offsetX: number;
  offsetY: number;
  zoomLevel: number;
};
