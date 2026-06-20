export type ProposalCategory = '技术' | '市场' | '管理';

export type ProposalStatus = '审核中' | '已通过' | '已关闭';

export type VoteType = 'up' | 'down' | null;

export interface Comment {
  id: string;
  proposalId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: number;
}

export interface Proposal {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: ProposalCategory;
  status: ProposalStatus;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  upVotes: number;
  downVotes: number;
  commentCount: number;
  isPinned: boolean;
  createdAt: number;
  updatedAt: number;
  images?: string[];
}

export interface UserVote {
  proposalId: string;
  voteType: VoteType;
  userId: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  category?: ProposalCategory;
  status?: ProposalStatus;
  keyword?: string;
}

export interface PaginationResult<T> {
  data: T[];
  total: number;
  hasMore: boolean;
}
