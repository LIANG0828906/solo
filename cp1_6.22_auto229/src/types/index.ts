export interface Sample {
  id: string;
  name: string;
  duration: number;
  url: string;
  color: string;
  category: 'drum' | 'vocal' | 'effect' | 'other';
}

export interface Track {
  id: string;
  name: string;
  color: string;
  volume: number;
  muted: boolean;
  solo: boolean;
}

export interface Clip {
  id: string;
  trackId: string;
  sampleId: string;
  start: number;
  duration: number;
  fadeIn: number;
  fadeOut: number;
  volume: number;
}

export interface Collaborator {
  id: string;
  name: string;
  color: string;
  cursor: { x: number; y: number } | null;
}

export interface Project {
  id: string;
  name: string;
  tracks: Track[];
  clips: Clip[];
  samples: Sample[];
  collaborators: Collaborator[];
}

export type CollabOperationType =
  | 'clip-add'
  | 'clip-move'
  | 'clip-delete'
  | 'clip-update'
  | 'track-add'
  | 'track-update'
  | 'cursor-move';

export interface CollabOperation {
  type: CollabOperationType;
  payload: any;
  userId: string;
  timestamp: number;
}

export interface JoinMessage {
  type: 'join';
  projectId: string;
  userId: string;
  userName: string;
}

export interface OperationMessage {
  type: 'operation';
  operation: CollabOperation;
}

export interface UserJoinedMessage {
  type: 'user-joined';
  user: Collaborator;
}

export interface UserLeftMessage {
  type: 'user-left';
  userId: string;
}

export interface OperationBroadcastMessage {
  type: 'operation-broadcast';
  operation: CollabOperation;
  excludeUserId?: string;
}

export type ServerMessage =
  | UserJoinedMessage
  | UserLeftMessage
  | OperationBroadcastMessage;

export type ClientMessage = JoinMessage | OperationMessage;

export const TRACK_HEIGHT = 80;
export const GRID_INTERVAL = 0.25;
export const PIXELS_PER_SECOND_BASE = 100;
export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 4;
export const TRACK_WIDTH = 240;
export const SAMPLE_PANEL_WIDTH = 280;
