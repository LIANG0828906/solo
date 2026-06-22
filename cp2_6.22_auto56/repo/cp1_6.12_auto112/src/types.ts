export interface User {
  id: string;
  name: string;
  avatar: string;
}

export interface CodeSnippet {
  id: string;
  shareCode: string;
  title: string;
  code: string;
  language: string;
  description: string;
  tags: string[];
  author: User;
  likes: number;
  likedByMe: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  snippetId: string;
  author: User;
  content: string;
  parentId: string | null;
  createdAt: string;
}

export interface Language {
  name: string;
  color: string;
}
