export type SigilType = 'mood' | 'star' | 'element';

export interface Sigil {
  id: string;
  type: SigilType;
  name: string;
  icon: string;
  color: string;
  description: string;
}

export interface DivinationFormation {
  id: string;
  sigils: [Sigil, Sigil];
  timestamp: number;
}

export interface DivinationResult {
  id: string;
  formation: DivinationFormation;
  poetry: string;
  interpretation: string;
  indices: {
    stability: number;
    inspiration: number;
    conflict: number;
  };
  createdAt: string;
}

export interface DailyStats {
  remaining: number;
  nextRestore: number;
  totalToday: number;
}

export interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  averageIndices: {
    stability: number;
    inspiration: number;
    conflict: number;
  };
  sigilFrequency: Record<string, number>;
  keywords: string[];
  formations: DivinationResult[];
}

export interface SaveResponse {
  success: boolean;
  id: string;
}

export interface DeleteResponse {
  success: boolean;
}
