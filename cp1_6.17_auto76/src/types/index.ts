export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Challenge {
  id: string;
  title: string;
  difficulty: Difficulty;
  tags: string[];
  description: string;
  exampleInput: string;
  exampleOutput: string;
  starterCode: string;
  submissions: number;
}

export interface Submission {
  id: string;
  challengeId: string;
  userId: string;
  userName: string;
  code: string;
  createdAt: string;
}

export interface Review {
  id: string;
  submissionId: string;
  reviewerId: string;
  reviewerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface UserRanking {
  userId: string;
  userName: string;
  averageScore: number;
  rank: number;
}

export type DifficultyFilter = 'all' | Difficulty;
