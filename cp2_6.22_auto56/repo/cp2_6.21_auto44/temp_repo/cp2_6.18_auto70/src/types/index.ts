export interface Collaborator {
  id: string;
  name: string;
  color: string;
}

export interface Project {
  id: string;
  name: string;
  clientName: string;
  genres: string[];
  bpmRange: { min: number; max: number };
  trackIds: string[];
  collaborators: Collaborator[];
  createdAt: Date;
}

export type TrackStatus = 'pending' | 'recorded' | 'mixing' | 'finalized';

export interface Track {
  id: string;
  projectId: string;
  name: string;
  description: string;
  status: TrackStatus;
  versionIds: string[];
  assigneeId?: string;
  createdAt: Date;
}

export interface Version {
  id: string;
  trackId: string;
  version: string;
  uploader: string;
  uploaderId: string;
  uploadTime: Date;
  note: string;
  audioUrl: string;
  fileSize: number;
  commentIds: string[];
  waveformData?: number[];
}

export interface Comment {
  id: string;
  versionId: string;
  author: string;
  authorId: string;
  content: string;
  emoji?: string;
  timestamp: number;
  createdAt: Date;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}
