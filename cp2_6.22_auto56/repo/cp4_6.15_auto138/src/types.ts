export interface Comment {
  id: string;
  text: string;
  author: string;
  createdAt: number;
}

export interface MatrixScore {
  feasibility: number;
  influence: number;
}

export interface Idea {
  id: string;
  title: string;
  description: string;
  author: string;
  authorAvatar: string;
  likes: number;
  likedBy: string[];
  comments: Comment[];
  group: 'pending' | 'in-progress' | 'completed';
  createdAt: number;
  matrixScore: MatrixScore;
}

export type GroupType = 'pending' | 'in-progress' | 'completed';
