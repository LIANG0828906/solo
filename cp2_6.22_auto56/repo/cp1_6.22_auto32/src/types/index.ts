export interface User {
  id: string;
  username: string;
  nickname: string;
  bio: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: number;
}

export interface Poem {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  tags: string[];
  likes: number;
  liked?: boolean;
  comments: Comment[] | number;
  createdAt: number;
}

export const TAGS = ['喜悦', '忧伤', '哲思', '自然', '幽默', '励志'] as const;
export type TagType = typeof TAGS[number];
