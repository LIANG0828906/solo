import { Trail } from '@/shared/types';

export interface SocialState {
  trails: Trail[];
  loading: boolean;
  error: string | null;
  selectedCompareTrails: string[];
  likeAnimation: string | null;
}

export interface SocialActions {
  loadPublicTrails: () => Promise<void>;
  loadAllTrails: () => Promise<void>;
  likeTrail: (trailId: string) => Promise<void>;
  toggleCompareSelection: (trailId: string) => void;
  clearCompareSelection: () => void;
  setLikeAnimation: (trailId: string | null) => void;
}

export interface CompareInfo {
  trail1: Trail | null;
  trail2: Trail | null;
  distanceDiff: number;
  elevationDiff: number;
}
