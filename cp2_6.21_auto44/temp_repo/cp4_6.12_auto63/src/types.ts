export interface User {
  id: string;
  nickname: string;
  avatar: string;
}

export interface PoemListItem {
  id: string;
  title: string;
  authorName: string;
  lastEditor: string;
  lastEditTime: number;
  participantCount: number;
  lineCount: number;
}

export interface Poem {
  id: string;
  title: string;
  author: string;
  authorName: string;
  lines: string[];
  lastEditor: string;
  lastEditTime: number;
  createdAt: number;
  participants: string[];
}

export interface Comment {
  id: string;
  poemId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: number;
  lineIndex: number | null;
  parentId: string | null;
  replies: Comment[];
}

export interface Version {
  id: string;
  poemId: string;
  versionNumber: number;
  lines: string[];
  savedAt: number;
  editorId: string;
  editorName: string;
  charDelta: number;
}

export interface UserComment {
  id: string;
  poemId: string;
  poemTitle: string;
  content: string;
  contentPreview: string;
  createdAt: number;
  lineIndex: number | null;
}

export type DiffLine = {
  index: number;
  html: string;
  hasChange: boolean;
};
