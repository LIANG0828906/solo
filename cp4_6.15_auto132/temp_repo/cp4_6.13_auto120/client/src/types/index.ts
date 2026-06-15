export interface VoteOption {
  id: string;
  text: string;
  votes: number;
}

export interface Vote {
  id: string;
  title: string;
  options: VoteOption[];
  createdAt: number;
  totalVotes: number;
  ended?: boolean;
}

export interface CreateVoteRequest {
  title: string;
  options: string[];
}

export interface CreateVoteResponse {
  voteId: string;
}

export interface VoteUpdateMessage {
  type: 'vote_update';
  voteId: string;
  options: VoteOption[];
  totalVotes: number;
}

export interface VoteSubmitMessage {
  type: 'vote';
  voteId: string;
  optionId: string;
  sessionId: string;
}

export interface VoteErrorMessage {
  type: 'error';
  message: string;
  code: string;
}

export interface JoinRoomMessage {
  type: 'join';
  voteId: string;
  sessionId: string;
}

export interface VoteStateMessage {
  type: 'vote_state';
  vote: Vote;
  hasVoted: boolean;
}

export type WebSocketMessage =
  | VoteUpdateMessage
  | VoteErrorMessage
  | VoteStateMessage;

export interface HistoryItem {
  id: string;
  title: string;
  createdAt: number;
  totalVotes: number;
}
