export interface VoteOption {
  index: number;
  text: string;
  votes: number;
}

export interface VoteData {
  roomId: string;
  title: string;
  options: VoteOption[];
  duration: number;
  remainingTime: number;
  totalVotes: number;
  status: 'active' | 'ended';
  createdAt: number;
  winnerIndex: number | null;
}

export interface VoteRecord {
  roomId: string;
  clientId: string;
  optionIndex: number;
  timestamp: number;
}

export interface CreateVotePayload {
  title: string;
  options: string[];
  duration: number;
}

export interface SubmitVotePayload {
  roomId: string;
  optionIndex: number;
}

export interface JoinVotePayload {
  roomId: string;
}
