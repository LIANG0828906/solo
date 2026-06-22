export interface User {
  id: string;
  socketId: string;
  nickname: string;
  isCreator: boolean;
  roomId: string;
}

export interface Card {
  id: string;
  content: string;
  nickname: string;
  roomId: string;
  createdAt: number;
  isNew?: boolean;
}

export interface VoteState {
  isOpen: boolean;
  cardIds: string[];
  votes: Record<string, number>;
  userVotes: Record<string, string[]>;
  totalVotes: number;
  startedAt: number;
}

export interface VoteHistory {
  id: string;
  roomId: string;
  options: { cardId: string; content: string; votes: number }[];
  totalVotes: number;
  startedAt: number;
  endedAt: number;
}

export interface RoomState {
  users: User[];
  cards: Card[];
  voteState: VoteState | null;
}

export interface AppState {
  userId: string | null;
  nickname: string | null;
  roomId: string | null;
  isCreator: boolean;
  users: User[];
  cards: Card[];
  voteState: VoteState | null;
  myVotes: string[];
  history: VoteHistory[];
  isHistoryOpen: boolean;
  isVotingPanelOpen: boolean;
  error: string | null;
  setUser: (user: { userId: string; nickname: string; roomId: string; isCreator: boolean }) => void;
  setRoomState: (state: { users: User[]; cards: Card[]; voteState: VoteState | null }) => void;
  addCard: (card: Card) => void;
  deleteCard: (cardId: string) => void;
  addUser: (user: User) => void;
  removeUser: (userId: string) => void;
  openVote: (voteState: VoteState) => void;
  updateVotes: (votes: Record<string, number>, totalVotes: number) => void;
  closeVote: (history: VoteHistory) => void;
  castVote: (cardId: string) => void;
  setHistory: (history: VoteHistory[]) => void;
  toggleHistory: () => void;
  toggleVotingPanel: () => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export type ServerToClientEvents = {
  'room:joined': (data: { roomId: string; users: User[]; cards: Card[]; voteState: VoteState | null }) => void;
  'room:error': (data: { message: string }) => void;
  'user:joined': (data: { user: User }) => void;
  'user:left': (data: { userId: string }) => void;
  'card:added': (data: { card: Card }) => void;
  'card:deleted': (data: { cardId: string }) => void;
  'vote:opened': (data: { voteState: VoteState }) => void;
  'vote:updated': (data: { votes: Record<string, number>; totalVotes: number }) => void;
  'vote:closed': (data: { history: VoteHistory }) => void;
  'history:list': (data: { history: VoteHistory[] }) => void;
};

export type ClientToServerEvents = {
  'room:join': (data: { roomId: string; nickname: string; isCreator: boolean }) => void;
  'card:add': (data: { roomId: string; content: string; nickname: string }) => void;
  'card:delete': (data: { roomId: string; cardId: string }) => void;
  'vote:open': (data: { roomId: string; cardIds: string[] }) => void;
  'vote:cast': (data: { roomId: string; cardId: string }) => void;
  'vote:close': (data: { roomId: string }) => void;
  'history:get': (data: { roomId: string }) => void;
};
