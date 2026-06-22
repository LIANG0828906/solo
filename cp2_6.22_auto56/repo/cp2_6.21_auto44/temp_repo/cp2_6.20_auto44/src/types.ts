export interface User {
  id: string;
  name: string;
  avatar: string;
  online: boolean;
}

export type VoteType = 'agree' | 'disagree' | 'neutral';

export interface Vote {
  type: VoteType;
  count: number;
}

export interface Idea {
  id: string;
  roomId: string;
  title: string;
  description: string;
  author: User;
  tags: string[];
  votes: {
    agree: number;
    disagree: number;
    neutral: number;
  };
  createdAt: string;
  bgColor: string;
}

export interface Room {
  id: string;
  name: string;
  users: User[];
  ideas: Idea[];
}

export interface VoteMessage {
  type: 'vote';
  ideaId: string;
  voteType: VoteType;
  votes: Idea['votes'];
}

export interface IdeaMessage {
  type: 'idea_created' | 'idea_updated' | 'idea_deleted';
  idea: Idea;
}

export interface UserMessage {
  type: 'user_joined' | 'user_left';
  user: User;
}

export type WSMessage = VoteMessage | IdeaMessage | UserMessage;

export const CARD_COLORS = [
  'rgba(249, 115, 22, 0.15)',
  'rgba(59, 130, 246, 0.15)',
  'rgba(34, 197, 94, 0.15)',
  'rgba(168, 85, 247, 0.15)',
  'rgba(236, 72, 153, 0.15)',
];

export const PRESET_TAGS = [
  '产品',
  '技术',
  '设计',
  '运营',
  '市场',
  '用户体验',
  '创新',
  '效率',
];
