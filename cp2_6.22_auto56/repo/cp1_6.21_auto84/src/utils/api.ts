import type { UnitType, Room, ToastEvent, CombatResult } from '../types';

const API_BASE = '/api';

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  const data = await response.json();
  
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Request failed');
  }

  return data as T;
}

export interface CreateRoomResponse {
  success: boolean;
  roomId: string;
  playerId: string;
  room: Room;
}

export interface JoinRoomResponse {
  success: boolean;
  playerId: string;
  room: Room;
}

export interface RoomResponse {
  success: boolean;
  room: Room;
}

export interface CombatResponse {
  success: boolean;
  result: CombatResult;
  room: Room;
}

export interface PollResponse {
  success: boolean;
  room: Room;
  events: ToastEvent[];
}

export const api = {
  createRoom: (
    maxPlayers: number,
    initialHealth: number,
    playerName: string
  ): Promise<CreateRoomResponse> =>
    request('/rooms', {
      method: 'POST',
      body: JSON.stringify({ maxPlayers, initialHealth, playerName }),
    }),

  joinRoom: (roomId: string, playerName: string): Promise<JoinRoomResponse> =>
    request(`/rooms/${roomId}/join`, {
      method: 'POST',
      body: JSON.stringify({ playerName }),
    }),

  getRoom: (roomId: string): Promise<RoomResponse> =>
    request(`/rooms/${roomId}`),

  selectUnits: (
    roomId: string,
    playerId: string,
    unitTypes: UnitType[]
  ): Promise<RoomResponse> =>
    request(`/rooms/${roomId}/units`, {
      method: 'POST',
      body: JSON.stringify({ playerId, unitTypes }),
    }),

  setPlayerReady: (roomId: string, playerId: string): Promise<RoomResponse> =>
    request(`/rooms/${roomId}/ready`, {
      method: 'POST',
      body: JSON.stringify({ playerId }),
    }),

  startBattle: (roomId: string, playerId: string): Promise<RoomResponse> =>
    request(`/rooms/${roomId}/start`, {
      method: 'POST',
      body: JSON.stringify({ playerId }),
    }),

  executeCombatRound: (roomId: string): Promise<CombatResponse> =>
    request(`/rooms/${roomId}/combat`, {
      method: 'POST',
    }),

  leaveRoom: (roomId: string, playerId: string): Promise<RoomResponse> =>
    request(`/rooms/${roomId}/leave`, {
      method: 'POST',
      body: JSON.stringify({ playerId }),
    }),

  pollEvents: (roomId: string, since: number): Promise<PollResponse> =>
    request(`/rooms/${roomId}/poll?since=${since}`),
};
