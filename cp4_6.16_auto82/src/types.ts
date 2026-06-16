export interface Theme {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'open' | 'closed';
}

export interface Work {
  id: string;
  themeId: string;
  title: string;
  content: string;
  authorId: string;
  anonymousIndex: number;
  createdAt: string;
}

export interface Review {
  id: string;
  workId: string;
  reviewerId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface WeeklyReport {
  themeId: string;
  winnerWorkId: string;
  winnerAvgScore: number;
  totalWorks: number;
  totalReviews: number;
  uniqueAuthors: number;
}

export interface WorkWithScore extends Work {
  avgScore: number;
  reviewCount: number;
}
