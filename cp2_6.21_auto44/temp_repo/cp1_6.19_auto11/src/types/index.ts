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

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}
