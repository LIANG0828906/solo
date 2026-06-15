export type SentimentType = 'positive' | 'conflict' | 'neutral';

import type { ThemeColors } from '@/utils/themes';

export interface Author {
  id: string;
  name: string;
  avatarColor: string;
}

export interface RoomMeta {
  id: string;
  title: string;
  theme: string;
  themeColors: ThemeColors;
  coverIllustration: string;
  initialParagraph: string;
  createdAt: number;
  updatedAt: number;
  participantCount: number;
  nodeCount: number;
  isPublic: boolean;
  inviteCode: string;
}

export interface StoryNode {
  id: string;
  roomId: string;
  parentId: string | null;
  content: string;
  author: Author;
  createdAt: number;
  depth: number;
  side: 'root' | 'left' | 'right';
  sentiment: 'positive' | 'conflict' | 'neutral';
  childrenIds: string[];
}

export interface RenderNode extends StoryNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx?: number;
  fy?: number;
}

export interface GraphLink {
  source: string;
  target: string;
}
