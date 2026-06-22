export interface Player {
  id: string;
  nickname: string;
  avatarSeed: number;
  isHost: boolean;
  status: 'waiting' | 'answering';
  joinTime: number;
}

export interface Verse {
  text: string;
  source: string;
  author: string;
  dynasty: string;
  lastChar: string;
  firstChar: string;
  submittedBy?: string;
  id?: string;
}

export interface RoomState {
  players: Player[];
  chain: Verse[];
  currentPlayerId: string | null;
  promptVerse: Verse | null;
  timeLeft: number;
  round: number;
}

export interface VerseResult {
  success: boolean;
  message: string;
  chain?: Verse[];
  newPrompt?: Verse;
  nextPlayerId?: string;
}
