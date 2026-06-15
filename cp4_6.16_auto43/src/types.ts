export interface Photo {
  id: string;
  url: string;
  thumbnail: string;
  name: string;
  size: number;
  uploadedAt: string;
  order: number;
}

export interface Portfolio {
  id: string;
  name: string;
  description: string;
  tags: string[];
  coverPhotoId: string | null;
  photos: Photo[];
  createdAt: string;
  updatedAt: string;
}

export interface Inquiry {
  id: string;
  clientName: string;
  email: string;
  projectType: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

export type ProjectStatus = 'pending' | 'inProgress' | 'completed';

export interface Project {
  id: string;
  name: string;
  clientName: string;
  deadline: string;
  previewImage: string;
  status: ProjectStatus;
  statusUpdatedAt: string;
  createdAt: string;
}

export interface StatusChangeLog {
  id: string;
  projectId: string;
  projectName: string;
  fromStatus: ProjectStatus;
  toStatus: ProjectStatus;
  timestamp: string;
}

export interface AppState {
  portfolios: Portfolio[];
  inquiries: Inquiry[];
  projects: Project[];
  statusChangeLogs: StatusChangeLog[];
}
