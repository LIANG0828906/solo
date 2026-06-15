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
  /** 静音灵敏度阈值 (0-1)，值越低检测越灵敏，产生更多更短的静音段；值越高只有更长静音才被检测到 */
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

export interface ScriptCardProps {
  segment: ScriptSegment;
  index: number;
  percentage: number;
}

export interface TimelineProps {
  segments: TimelineSegment[];
  totalDuration: number;
}

export interface DashboardProps {
  metrics: RhythmMetrics | null;
}

export interface GaugeProps {
  value: number;
  min: number;
  max: number;
  recommendedRange: [number, number];
  label: string;
  unit: string;
  icon: React.ReactNode;
  gradientColors: [string, string];
  description: string;
}
