export type PlotStatus = 'idle' | 'claimed' | 'harvest';

export interface GrowthLog {
  id: string;
  date: string;
  photoUrl: string;
  height: number;
  note: string;
  healthStatus: 'good' | 'pests' | 'thirsty';
}

export interface Plot {
  id: string;
  plotNumber: string;
  status: PlotStatus;
  claimant: string;
  crop: string;
  growthDays: number;
  logs: GrowthLog[];
}

export interface Comment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
  author: string;
  createdAt: string;
  likes: number;
  likedBy: string[];
  comments: Comment[];
}
