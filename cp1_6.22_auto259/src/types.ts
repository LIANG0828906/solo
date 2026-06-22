export type ChapterStatus = 'draft' | 'serializing' | 'completed';

export interface Project {
  id: string;
  title: string;
  createdAt: string;
}

export interface Chapter {
  id: string;
  projectId: string;
  title: string;
  pageCount: number;
  status: ChapterStatus;
  orderIndex: number;
  createdAt: string;
}

export interface Panel {
  id: string;
  chapterId: string;
  gridIndex: number;
  dialogueText: string;
  notes: string;
  characterIds: string[];
}

export interface Character {
  id: string;
  name: string;
  avatarColor: string;
  personalityTags: string[];
  catchphrase: string;
}

export type ViewType = 'chapters' | 'characters' | 'timeline';

export const STATUS_COLORS: Record<ChapterStatus, string> = {
  draft: '#B0B0B0',
  serializing: '#5B8DEF',
  completed: '#5CB85C',
};

export const STATUS_LABELS: Record<ChapterStatus, string> = {
  draft: '草稿',
  serializing: '连载中',
  completed: '完结',
};
