export type WorkCategory = 'article' | 'video' | 'image';

export interface Comment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface Work {
  id: string;
  title: string;
  description: string;
  category: WorkCategory;
  coverUrl: string;
  views: number;
  likes: number;
  likedByUser: boolean;
  comments: Comment[];
  createdAt: string;
}

export interface WorkFormData {
  title: string;
  description: string;
  category: WorkCategory;
  coverUrl: string;
}

export interface CategoryStats {
  name: string;
  value: number;
}

export interface StatsData {
  totalWorks: number;
  totalViews: number;
  totalLikes: number;
  categoryStats: CategoryStats[];
  topWorks: Work[];
}
