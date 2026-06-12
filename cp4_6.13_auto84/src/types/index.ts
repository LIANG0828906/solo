export interface User {
  id: string;
  username: string;
  nickname: string;
  avatar: string;
  createdAt: string;
}

export interface Club {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  startDate: string;
  endDate: string;
  creatorId: string;
  creatorNickname: string;
  creatorAvatar: string;
  reviewCount: number;
  memberCount: number;
  hasCrowdfunding: boolean;
  crowdfundingGoal: number;
  crowdfundingRaised: number;
  crowdfundingDeadline: string;
  createdAt: string;
}

export interface Review {
  id: string;
  clubId: string;
  userId: string;
  userNickname: string;
  userAvatar: string;
  rating: number;
  content: string;
  helpfulCount: number;
  createdAt: string;
}

export interface ClubMember {
  id: string;
  nickname: string;
  avatar: string;
}

export interface Recommendation {
  id: string;
  clubId: string;
  title: string;
  author: string;
  coverImage: string;
  bookstoreUrl: string;
  voteCount: number;
  keywords: string[];
}

export interface CrowdfundingSupport {
  id: string;
  clubId: string;
  userId: string;
  userNickname: string;
  userAvatar: string;
  amount: number;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface MyReview {
  id: string;
  clubId: string;
  clubName: string;
  clubCover: string;
  rating: number;
  content: string;
  helpfulCount: number;
  createdAt: string;
}
