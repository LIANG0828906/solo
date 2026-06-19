export interface Comment {
  id: string;
  username: string;
  content: string;
  createdAt: string;
}

export interface Work {
  id: string;
  title: string;
  description: string;
  category: 'article' | 'video' | 'image';
  coverUrl: string;
  views: number;
  likes: number;
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface Stats {
  totalWorks: number;
  totalViews: number;
  totalLikes: number;
  categoryCounts: Record<string, number>;
  topWorks: Work[];
}

export interface CreateWorkData {
  title: string;
  description: string;
  category: 'article' | 'video' | 'image';
  coverUrl: string;
}

export interface UpdateWorkData {
  title?: string;
  description?: string;
  category?: 'article' | 'video' | 'image';
  coverUrl?: string;
}

export interface AddCommentData {
  username: string;
  content: string;
}
