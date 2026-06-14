export interface EmotionRecord {
  id: string;
  date: string;
  color: string;
  emotion: string;
  note: string;
  intensity: number;
}

export interface DailyStats {
  date: string;
  intensity: number;
  diversity: number;
  emotions: string[];
  records: EmotionRecord[];
}

export interface StatsResult {
  averageIntensity: number;
  dominantEmotion: string;
  emotionDistribution: Record<string, number>;
  diversityScore: number;
  trendDirection: 'up' | 'down' | 'stable';
  warmRatio: number;
  peakDay: string;
  peakIntensity: number;
}

export type ViewMode = 'week' | 'month';
export type AnalysisMode = 'intensity' | 'diversity';
