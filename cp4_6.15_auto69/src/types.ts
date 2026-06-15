import type { ThemeColors } from '@/utils/themes';

export type SentimentType = 'positive' | 'neutral' | 'conflict';

export type StoryNodeSide = 'root' | 'left' | 'right';

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
  side: StoryNodeSide;
  sentiment: SentimentType;
  childrenIds: string[];
}

export interface RenderNode extends StoryNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphLink {
  source: string;
  target: string;
}
