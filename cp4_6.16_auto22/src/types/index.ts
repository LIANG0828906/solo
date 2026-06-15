export type RoleType = 'host' | 'guest' | 'narrator';

export interface ScriptSegment {
  id: string;
  title: string;
  content: string;
  expectedDuration: number;
  role: RoleType;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface TimelineSegment {
  id: string;
  segmentId: string;
  title: string;
  startTime: number;
  endTime: number;
  expectedDuration: number;
  actualDuration: number;
  isOverBudget: boolean;
  deviation: number;
}

export interface RhythmMetrics {
  speakingRate: number;
  speakingRateRange: [number, number];
  uniformity: number;
  uniformityRange: [number, number];
  fillerFrequency: number;
  fillerFrequencyRange: [number, number];
  fillerWordCount: { word: string; count: number }[];
}

export interface AudioAnalysisResult {
  totalDuration: number;
  timeline: TimelineSegment[];
  metrics: RhythmMetrics;
}

export type SilenceDetectionMode = 'silence' | 'interval' | 'hybrid';

export interface SilenceDetectionOptions {
  minSilenceDuration?: number;
  silenceThreshold?: number;
  mode?: SilenceDetectionMode;
  segmentCount?: number;
}

export interface SilenceSegment {
  start: number;
  end: number;
  duration: number;
  type: 'silence' | 'speech';
}

export const ROLE_LABELS: Record<RoleType, string> = {
  host: '主播',
  guest: '嘉宾',
  narrator: '旁白',
};

export const ROLE_COLORS: Record<RoleType, { bg: string; text: string; border: string }> = {
  host: { bg: 'rgba(233, 69, 96, 0.15)', text: '#E94560', border: 'rgba(233, 69, 96, 0.4)' },
  guest: { bg: 'rgba(0, 206, 209, 0.15)', text: '#00CED1', border: 'rgba(0, 206, 209, 0.4)' },
  narrator: { bg: 'rgba(155, 135, 245, 0.15)', text: '#9B87F5', border: 'rgba(155, 135, 245, 0.4)' },
};

export const FILLER_WORDS = ['嗯', '那个', '就是', '然后', '其实', '所以', '但是', '对吧', '啊', '哦'];
