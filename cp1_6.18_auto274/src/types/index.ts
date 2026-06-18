export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Marker {
  id: string;
  position: Vec3;
  text: string;
  author: string;
  createdAt: number;
  updatedAt: number;
  isDeleted?: boolean;
}

export interface User {
  id: string;
  nickname: string;
  roomId: string;
  joinedAt: number;
}

export interface HistorySnapshot {
  timestamp: number;
  markers: Marker[];
}

export interface RoomState {
  roomId: string;
  users: User[];
  markers: Marker[];
  createdAt: number;
}

export interface ExportMarker {
  id: string;
  position: Vec3;
  text: string;
  author: string;
  timestamp: string;
}

export interface ExportReport {
  roomId: string;
  exportTime: string;
  snapshotTime?: string;
  markers: ExportMarker[];
  thumbnail: string;
}

export type SocketEventType =
  | 'join-room'
  | 'room-joined'
  | 'user-joined'
  | 'user-left'
  | 'add-marker'
  | 'marker-added'
  | 'edit-marker'
  | 'marker-edited'
  | 'delete-marker'
  | 'marker-deleted';
