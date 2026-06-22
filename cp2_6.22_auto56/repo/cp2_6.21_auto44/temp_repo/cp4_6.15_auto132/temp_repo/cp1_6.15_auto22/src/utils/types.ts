export interface User {
  id: string;
  name: string;
  avatar: string;
  color: string;
}

export interface Note {
  id: string;
  content: string;
  color: 'red' | 'green' | 'blue' | 'yellow';
  x: number;
  y: number;
  group?: 'problem' | 'solution' | 'action';
  authorId: string;
  authorName: string;
  authorAvatar: string;
  votes: string[];
  createdAt: number;
}

export interface RoomState {
  notes: Note[];
  users: User[];
}

export type ViewMode = 'free' | 'mindmap';
export type ColorFilter = 'all' | 'red' | 'green' | 'blue' | 'yellow';

export const NOTE_COLORS: Record<Note['color'], string> = {
  red: '#FFE0E0',
  green: '#E0F2E9',
  blue: '#E0ECF8',
  yellow: '#FFF4D6',
};

export const NOTE_BORDER_COLORS: Record<Note['color'], string> = {
  red: '#E8A0A0',
  green: '#A0D8C0',
  blue: '#A0C8E8',
  yellow: '#E8D090',
};

export const GROUP_ZONES = [
  { id: 'problem', title: '问题', color: '#FFE0E0', borderColor: '#E8A0A0' },
  { id: 'solution', title: '方案', color: '#E0F2E9', borderColor: '#A0D8C0' },
  { id: 'action', title: '行动项', color: '#E0ECF8', borderColor: '#A0C8E8' },
] as const;

export const AVATAR_EMOJIS = [
  '😊', '🤓', '😎', '🥳', '🤔', '😇', '🤗', '😺',
  '🐱', '🐶', '🦊', '🐼', '🐨', '🐯', '🦁', '🐸',
  '🦄', '🐙', '🐳', '🦋', '🌸', '🌻', '🌟', '💫',
];

export const NICKNAMES = [
  '创意达人', '思考者', '设计师', '工程师', '产品经理',
  '分析师', '探索者', '梦想家', '实践者', '创新者',
  '观察员', '策略家', '开发者', '架构师', '体验师',
];

export const USER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
];
