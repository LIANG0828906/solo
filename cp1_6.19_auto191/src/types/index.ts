export type StyleId = 'short-wallet' | 'long-wallet' | 'key-case';

export interface Style {
  id: StyleId;
  name: string;
  width: number;
  height: number;
  corners: number;
}

export interface Wood {
  id: string;
  name: string;
  color: string;
  grainPattern: string;
}

export interface Metal {
  id: string;
  name: string;
  color: string;
  shine: string;
}

export interface Combination {
  id: string;
  styleId: StyleId;
  woodId: string;
  metalId: string;
  timestamp: number;
}

export interface HistoryEntry {
  styleId: StyleId;
  woodId: string;
  metalId: string;
  count: number;
}
