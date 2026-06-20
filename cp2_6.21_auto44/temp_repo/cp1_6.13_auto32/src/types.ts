export interface User {
  id: string;
  username: string;
  createdAt: string;
}

export type Language = 'javascript' | 'python' | 'typescript' | 'htmlcss' | 'java';

export interface Snippet {
  id: string;
  title: string;
  language: Language;
  content: string;
  visibility: 'public' | 'private';
  tags: string[];
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Favorite {
  id: string;
  userId: string;
  snippetId: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}
