export type LensStatus = 'pending' | 'approved' | 'reshoot';
export type LensType = 'video' | 'image';

export interface Lens {
  id: string;
  name: string;
  type: LensType;
  status: LensStatus;
  uploadTime: string;
  thumbnail?: string;
  format?: string;
  dimensions?: string;
  duration?: string;
  reviewNotes?: string;
}

export interface FilterOptions {
  status: 'all' | LensStatus;
  type: 'all' | LensType;
  search: string;
}
