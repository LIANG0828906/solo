export type IconType = 'sun' | 'star' | 'smile' | 'flag' | 'heart' | 'rocket' | 'coffee' | 'music';

export interface Option {
  id: string;
  text: string;
  color: string;
  icon: IconType;
  votes: number;
}

export interface VoteRecord {
  id: string;
  optionId: string;
  userId: string;
  userName: string;
  timestamp: number;
}

export interface Vote {
  id: string;
  title: string;
  description: string;
  options: Option[];
  inviteCode: string;
  createdAt: number;
  creatorId: string;
  creatorName: string;
  status: 'active' | 'ended';
  voteRecords: VoteRecord[];
}

export interface VoteResultItem {
  option: Option;
  percentage: number;
  count: number;
}

export interface VoteResult {
  totalVotes: number;
  items: VoteResultItem[];
}
