export interface Note {
  id: string;
  content: string;
  html: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnnotationReply {
  id: string;
  text: string;
  author: string;
  authorColor: string;
  createdAt: Date;
}

export interface Annotation {
  id: string;
  noteId: string;
  text: string;
  selectedText: string;
  from: number;
  to: number;
  author: string;
  authorColor: string;
  createdAt: Date;
  replies: AnnotationReply[];
  relatedConceptId?: string;
}

export interface Concept {
  id: string;
  name: string;
  frequency: number;
  noteId: string;
  firstOccurrence: number;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  weight: number;
  noteId: string;
}

export interface VersionHistory {
  id: string;
  noteId: string;
  content: string;
  html: string;
  description: string;
  timestamp: Date;
}

export interface User {
  id: string;
  name: string;
  color: string;
  cursorPosition: number | null;
}

export type WsMessageType = 'cursor' | 'edit' | 'annotation' | 'sync' | 'user-join' | 'user-leave' | 'users-update' | 'init';

export interface WsMessage {
  type: WsMessageType;
  payload: any;
  userId: string;
  timestamp: number;
}

export interface GraphNode {
  data: {
    id: string;
    name: string;
    frequency: number;
    firstOccurrence: number;
  };
}

export interface GraphEdge {
  data: {
    id: string;
    source: string;
    target: string;
    weight: number;
  };
}

export type ViewMode = 'notepad' | 'knowledge';
export type RightPanelMode = 'annotations' | 'knowledge' | 'history';
