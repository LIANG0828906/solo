export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  tags: string[];
  techStack: string[];
  link?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  summary: string;
  publishedAt: string;
  readingTime: number;
}

export interface Message {
  id: string;
  nickname: string;
  email: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

export interface AppStats {
  monthlyPosts: { month: string; count: number }[];
  monthlyMessages: { month: string; count: number }[];
  techStackFreq: { name: string; value: number }[];
}
