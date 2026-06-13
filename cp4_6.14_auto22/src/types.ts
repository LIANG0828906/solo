export interface Chapter {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface VersionSnapshot {
  id: string;
  version: number;
  chapterId: string;
  content: string;
  timestamp: number;
}

export interface User {
  id: string;
  name: string;
  color: string;
  cursorPosition: number;
}

export interface Selection {
  start: number;
  end: number;
}
