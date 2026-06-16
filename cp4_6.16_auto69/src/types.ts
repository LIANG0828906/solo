export type EventType = 'milestone' | 'achievement' | 'iteration';

export interface Article {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface EventNode {
  id: string;
  articleId: string;
  title: string;
  date: string;
  summary: string;
  rawText: string;
  eventType: EventType;
  order: number;
  references: string[];
}

export const EVENT_COLORS: Record<EventType, string> = {
  milestone: '#4A90D9',
  achievement: '#27AE60',
  iteration: '#E67E22',
};

export const EVENT_LABELS: Record<EventType, string> = {
  milestone: '里程碑',
  achievement: '成果',
  iteration: '迭代',
};

export const ARTICLE_LABEL_COLORS = [
  '#6C5CE7',
  '#00B894',
  '#FD79A8',
  '#FDCB6E',
  '#0984E3',
];
