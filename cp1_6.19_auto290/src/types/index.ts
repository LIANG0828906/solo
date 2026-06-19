export interface Project {
  id: string;
  name: string;
  clientName: string;
  deadline: string;
  shareToken: string;
  createdAt: string;
  updatedAt: string;
}

export interface Sketch {
  id: string;
  projectId: string;
  currentVersionId: string;
  fileName: string;
  originalBlobKey: string;
  watermarkedBlobKey: string;
  thumbnailBlobKey: string;
  isFinal: boolean;
  isConfirmed: boolean;
  createdAt: string;
}

export interface Annotation {
  id: string;
  sketchId: string;
  x: number;
  y: number;
  text: string;
  authorType: 'designer' | 'client';
  isRead: boolean;
  createdAt: string;
}

export interface Version {
  id: string;
  sketchId: string;
  versionNumber: number;
  originalBlobKey: string;
  watermarkedBlobKey: string;
  createdAt: string;
}

export type TabType = 'sketches' | 'annotations' | 'versions' | 'delivery';

export interface ContextMenuAction {
  label: string;
  action: () => void;
  icon?: string;
}
