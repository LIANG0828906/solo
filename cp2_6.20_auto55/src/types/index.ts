// 投票选项类型
export interface VoteOption {
  id: string;
  text: string;
  votes?: number;
}

// 投票状态枚举
export type VoteStatus = 'draft' | 'active' | 'ended';

// 投票类型
export interface Vote {
  id: string;
  title: string;
  description: string;
  options: VoteOption[];
  status: VoteStatus;
  isMultiple: boolean;
  isAnonymous: boolean;
  startTime?: string;
  endTime?: string;
  totalVotes: number;
  createdAt: string;
  updatedAt: string;
}

// 投票查询过滤条件
export interface VoteFilters {
  status?: VoteStatus;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

// 创建投票请求
export interface CreateVoteRequest {
  title: string;
  description: string;
  options: string[];
  isMultiple: boolean;
  isAnonymous: boolean;
  startTime?: string;
  endTime?: string;
}

// 更新投票请求
export interface UpdateVoteRequest {
  title?: string;
  description?: string;
  options?: string[];
  isMultiple?: boolean;
  isAnonymous?: boolean;
  startTime?: string;
  endTime?: string;
  status?: VoteStatus;
}

// 提交投票请求
export interface SubmitVoteRequest {
  optionIds: string[];
  userId?: string;
  username?: string;
}

// 投票记录
export interface VoteRecord {
  id: string;
  voteId: string;
  userId?: string;
  username?: string;
  optionIds: string[];
  votedAt: string;
  ip?: string;
}
