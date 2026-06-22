export interface Comment {
  id: string;
  ideaId: string;
  author: string;
  avatar: string;
  content: string;
  createdAt: string;
}

export interface Idea {
  id: string;
  title: string;
  description: string;
  author: string;
  avatar: string;
  likes: number;
  likedBy: string[];
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface RankingItem {
  id: string;
  title: string;
  likes: number;
  commentCount: number;
  hotScore: number;
}
