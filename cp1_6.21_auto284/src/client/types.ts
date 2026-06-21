export interface User {
  id: string;
  name: string;
  color: string;
  avatar: string;
}

export interface CursorPosition {
  userId: string;
  top: number;
  left: number;
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorColor: string;
  content: string;
  selectedText: string;
  timestamp: number;
}

export interface Version {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorColor: string;
  timestamp: number;
}

export interface DocData {
  id: string;
  title: string;
  content: string;
}
