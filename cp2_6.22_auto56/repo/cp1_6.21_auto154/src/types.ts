export interface Board {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  color?: string;
}

export interface TodoItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface TextNoteContent {
  text: string;
}

export interface ImageNoteContent {
  url: string;
}

export interface TodoNoteContent {
  items: TodoItem[];
}

export type NoteContent = TextNoteContent | ImageNoteContent | TodoNoteContent;

export interface Note {
  id: string;
  boardId: string;
  type: 'text' | 'image' | 'todo';
  x: number;
  y: number;
  width: number;
  height: number;
  content: NoteContent;
  createdAt: string;
  updatedAt: string;
  syncError?: boolean;
}

export interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
}

export interface User {
  id: string;
  name: string;
  color: string;
}
