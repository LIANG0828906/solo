export interface User {
  id: string;
  name: string;
  color: string;
  initials: string;
}

export interface Annotation {
  id: string;
  roomId: string;
  versionId: string;
  x: number;
  y: number;
  bubbleX: number;
  bubbleY: number;
  text: string;
  creatorId: string;
  creatorName: string;
  creatorColor: string;
  createdAt: string;
  readBy: string[];
}

export interface ImageVersion {
  id: string;
  url: string;
  filename: string;
  uploadedAt: string;
}

export interface AlignmentMarkerSet {
  id: string;
  version1Id: string;
  version2Id: string;
  points1: MarkerPoint[];
  points2: MarkerPoint[];
}

export interface MarkerPoint {
  x: number;
  y: number;
}

export interface Room {
  id: string;
  name: string;
  collaborators: User[];
  versions: ImageVersion[];
  annotations: Annotation[];
  markers: AlignmentMarkerSet[];
}

export interface CreateRoomResponse {
  room: Room;
  user: User;
}

export interface JoinRoomResponse {
  room: Room;
  user: User;
}

export interface DiffRequest {
  image1Url: string;
  image2Url: string;
  offsetX: number;
  offsetY: number;
}

export const CREATOR_COLORS = [
  '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c',
];
