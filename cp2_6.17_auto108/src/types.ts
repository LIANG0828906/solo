export type VoteStatus = 'ongoing' | 'ended';

export interface VoteOption {
  id: string;
  text: string;
  voteCount: number;
}

export interface VoteRecord {
  topicId: string;
  optionId: string;
  votedAt: number;
}

export interface VoteTopic {
  id: string;
  title: string;
  description: string;
  options: VoteOption[];
  createdAt: number;
  deadline: number;
  status: VoteStatus;
  totalVotes: number;
}

export interface CreateVoteForm {
  title: string;
  description: string;
  options: string[];
  deadline: number;
}

export interface VoteStoreState {
  topics: VoteTopic[];
  currentUserId: string;
  voteRecords: VoteRecord[];
  createTopic: (form: CreateVoteForm) => VoteTopic;
  submitVote: (topicId: string, optionId: string) => void;
  getTopicById: (id: string) => VoteTopic | undefined;
  hasUserVoted: (topicId: string) => boolean;
  updateTopicStatuses: () => void;
}
