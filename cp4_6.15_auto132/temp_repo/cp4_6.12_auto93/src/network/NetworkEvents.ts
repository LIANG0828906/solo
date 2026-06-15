import { Player, AttackResult } from '../engine/types';

export enum NetworkEventType {
  MATCH_REQUEST = 'match_request',
  MATCH_FOUND = 'match_found',
  PLAYER_READY = 'player_ready',
  ATTACK = 'attack',
  ATTACK_RESULT = 'attack_result',
  EMOTE = 'emote',
  PING = 'ping',
  PONG = 'pong',
  RECONNECT = 'reconnect',
  GAME_STATE_SYNC = 'game_state_sync',
  TURN_TIMEOUT = 'turn_timeout',
}

export interface NetworkMessage<T = unknown> {
  type: NetworkEventType;
  senderId: string;
  roomId: string;
  timestamp: number;
  payload: T;
  messageId?: string;
}

export interface MatchRequestPayload {
  playerId: string;
  playerName: string;
}

export interface MatchFoundPayload {
  roomId: string;
  player1: { id: string; name: string };
  player2: { id: string; name: string };
  yourTurn: boolean;
}

export interface PlayerReadyPayload {
  playerId: string;
  player: Player;
}

export interface AttackPayload {
  row: number;
  col: number;
  attackerId: string;
  messageId: string;
}

export interface AttackResultPayload {
  result: AttackResult;
  attackerId: string;
  defenderId: string;
  messageId: string;
  nextPlayerId: string;
}

export interface EmotePayload {
  emote: string;
  label: string;
  playerId: string;
}

export interface GameStateSyncPayload {
  player: Player;
  opponent: Player;
  currentPlayerId: string;
  phase: string;
}

export interface TurnTimeoutPayload {
  timedOutPlayerId: string;
  nextPlayerId: string;
}

export type NetworkPayload =
  | MatchRequestPayload
  | MatchFoundPayload
  | PlayerReadyPayload
  | AttackPayload
  | AttackResultPayload
  | EmotePayload
  | GameStateSyncPayload
  | TurnTimeoutPayload
  | null;
