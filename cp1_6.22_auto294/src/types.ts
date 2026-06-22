export interface User {
  id: string;
  name: string;
  avatar?: string;
}

export interface Reply {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: number;
}

export interface Annotation {
  id: string;
  poemId: string;
  lineIndex: number;
  userId: string;
  userName: string;
  content: string;
  likes: number;
  likedBy: string[];
  replies: Reply[];
  createdAt: number;
}

export interface Poem {
  id: string;
  title: string;
  author: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}
