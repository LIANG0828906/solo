export type SyncEventType =
  | 'user-join'
  | 'user-leave'
  | 'user-mute'
  | 'user-volume'
  | 'user-name'
  | 'room-info'
  | 'ping'
  | 'pong';

export interface SyncEventPayloadMap {
  'user-join': {
    userId: string;
    userName: string;
    avatarColor: string;
  };
  'user-leave': {
    userId: string;
  };
  'user-mute': {
    userId: string;
    muted: boolean;
  };
  'user-volume': {
    userId: string;
    volume: number;
  };
  'user-name': {
    userId: string;
    userName: string;
  };
  'room-info': {
    roomId: string;
    users: Array<{
      userId: string;
      userName: string;
      avatarColor: string;
      muted: boolean;
      volume: number;
      isSpeaking: boolean;
      status: UserStatus;
    }>;
  };
  'ping': {
    timestamp: number;
  };
  'pong': {
    timestamp: number;
  };
}

export interface SyncEvent<T extends SyncEventType = SyncEventType> {
  type: T;
  userId: string;
  timestamp: number;
  payload: SyncEventPayloadMap[T];
}

export type UserStatus = 'online' | 'idle' | 'offline';

export interface UserState {
  userId: string;
  userName: string;
  avatarColor: string;
  muted: boolean;
  volume: number;
  isSpeaking: boolean;
  lastActive: number;
  status: UserStatus;
}

export interface RoomState {
  roomId: string;
  users: Map<string, UserState>;
}
