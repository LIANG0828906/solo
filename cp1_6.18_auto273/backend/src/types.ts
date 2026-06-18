export interface Track {
  id: string;
  name: string;
  type: 'drum' | 'bass' | 'guitar';
  volume: number;
  muted: boolean;
  waveData: number[];
  order: number;
}

export interface Effects {
  reverb: number;
  compression: number;
  delay: number;
}

export interface User {
  id: string;
  nickname: string;
  isHost: boolean;
}

export interface RoomState {
  roomId: string;
  users: User[];
  tracks: Track[];
  masterVolume: number;
  effects: Effects;
  isPlaying: boolean;
  hostId: string;
}

export type WSMessage =
  | { type: 'join'; roomId: string; nickname: string }
  | { type: 'joined'; state: RoomState; userId: string }
  | { type: 'state_update'; state: Partial<RoomState> }
  | { type: 'track_update'; track: Track }
  | { type: 'track_delete'; trackId: string }
  | { type: 'track_reorder'; trackIds: string[] }
  | { type: 'effects_update'; effects: Effects }
  | { type: 'master_volume'; volume: number }
  | { type: 'playback'; isPlaying: boolean }
  | { type: 'export_request' }
  | { type: 'export_complete'; blobUrl: string }
  | { type: 'error'; message: string }
  | { type: 'user_leave'; userId: string }
  | { type: 'room_full' };
