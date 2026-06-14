export interface User {
  id: string;
  username: string;
  createdAt: string;
}

export interface CommunityScores {
  life: number;
  transport: number;
  quiet: number;
  green: number;
  neighbor: number;
}

export interface Community {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  scores: CommunityScores;
  reviewCount: number;
  averageScore: number;
}

export interface ReviewScores {
  life: number;
  transport: number;
  quiet: number;
}

export interface Review {
  id: string;
  userId: string;
  communityId: string;
  username: string;
  scores: ReviewScores;
  content: string;
  images: string[];
  likes: number;
  likedBy: string[];
  reported: boolean;
  createdAt: string;
}
