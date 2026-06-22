export type ChapterStatus = 'unassigned' | 'translating' | 'reviewing' | 'completed';

export interface Note {
  id: string;
  content: string;
  createdAt: number;
}

export interface Annotation {
  id: string;
  reviewerId: string;
  reviewerName: string;
  content: string;
  decision: 'approved' | 'rejected';
  createdAt: number;
}

export interface Sentence {
  id: string;
  original: string;
  translation: string;
  translatorId?: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  notes: Note[];
  annotations: Annotation[];
}

export interface Chapter {
  id: string;
  title: string;
  sentences: Sentence[];
  translatorId?: string;
  status: ChapterStatus;
  children?: Chapter[];
}

export interface Project {
  id: string;
  name: string;
  sourceLanguage: string;
  targetLanguage: string;
  chapters: Chapter[];
  createdAt: number;
}

export interface Translator {
  id: string;
  name: string;
  avatar: string;
  weeklyTranslatedChars: number;
  weeklyReviewedSentences: number;
  weeklyRejectionRate: number;
}

export interface ProgressStats {
  unassigned: number;
  translating: number;
  reviewing: number;
  completed: number;
}

export const STATUS_COLORS: Record<ChapterStatus, string> = {
  unassigned: '#A0AEC0',
  translating: '#3182CE',
  reviewing: '#ED8936',
  completed: '#48BB78'
};

export const STATUS_LABELS: Record<ChapterStatus, string> = {
  unassigned: '待分配',
  translating: '翻译中',
  reviewing: '待审校',
  completed: '已完成'
};

export const countChars = (text: string): number => {
  return text.replace(/\s/g, '').length;
};

export const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;

  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
};

export const describeArc = (
  x: number,
  y: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string => {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  return [
    'M', start.x, start.y,
    'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y
  ].join(' ');
};

const polarToCartesian = (
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
): { x: number; y: number } => {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
};

export const generateRingPath = (
  percentage: number,
  size: number = 180,
  strokeWidth: number = 14
): { bgPath: string; arcPath: string } => {
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const clampedPct = Math.min(Math.max(percentage, 0), 100);
  const angle = (clampedPct / 100) * 360;

  return {
    bgPath: describeArc(center, center, radius, 0, 360),
    arcPath: clampedPct > 0 && clampedPct < 100
      ? describeArc(center, center, radius, 0, angle)
      : describeArc(center, center, radius, 0, 359.99)
  };
};

export const calculateProgress = (chapters: Chapter[]): ProgressStats => {
  const stats: ProgressStats = { unassigned: 0, translating: 0, reviewing: 0, completed: 0 };
  const walk = (list: Chapter[]) => {
    list.forEach(ch => {
      stats[ch.status]++;
      if (ch.children) walk(ch.children);
    });
  };
  walk(chapters);
  return stats;
};

export const flattenChapters = (chapters: Chapter[]): Chapter[] => {
  const result: Chapter[] = [];
  const walk = (list: Chapter[]) => {
    list.forEach(ch => {
      result.push(ch);
      if (ch.children) walk(ch.children);
    });
  };
  walk(chapters);
  return result;
};
