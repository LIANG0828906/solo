export type HotspotType = 'blink' | 'glow';

export interface Hotspot {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: HotspotType;
}

export interface ComicPage {
  id: string;
  imageUrl: string;
  hotspots: Hotspot[];
}

export interface Book {
  id: string;
  title: string;
  totalPages: number;
  pages: ComicPage[];
}

export interface FlipStyle {
  transform: string;
  boxShadow: string;
  backfaceVisibility: string;
  transformOrigin: string;
}
