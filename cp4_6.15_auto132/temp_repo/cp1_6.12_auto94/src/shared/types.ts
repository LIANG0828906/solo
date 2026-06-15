export interface Card {
  id: string;
  content: string;
  author: string;
  authorColor: string;
  x: number;
  y: number;
  votes: number;
  votedBy: string[];
  groupId: string | null;
  createdAt: number;
}

export interface Group {
  id: string;
  name: string;
}

export interface User {
  id: string;
  nickname: string;
  color: string;
  teamName: string;
  votesRemaining: number;
}

export interface TeamState {
  cards: Card[];
  groups: Group[];
  users: User[];
  votingActive: boolean;
  votingRound: number;
}
