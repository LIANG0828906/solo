export interface ShapeItem {
  shapeType: number;
  gridIndex: number;
}

export interface PlayerInfo {
  id: string;
  nickname: string;
  score: number;
}

export interface RoomState {
  roomCode: string;
  players: PlayerInfo[];
  ownerId: string;
  gameStarted: boolean;
}

export interface TurnData {
  sequence: ShapeItem[];
  currentPlayerIndex: number;
  currentPlayerNickname: string;
  currentPlayerId: string;
  round: number;
  sequenceLength: number;
  players: PlayerInfo[];
  phase: string;
}

export interface ScoreEntry {
  nickname: string;
  score: number;
}
