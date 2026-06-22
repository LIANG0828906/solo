export type ProjectStatus = 'pending' | 'creating' | 'completed';

export type SketchStatus = 'pending' | 'approved' | 'rejected';

export type MaterialStatus = 'pending' | 'ordered' | 'received';

export interface Annotation {
  x: number;
  y: number;
  comment?: string;
}

export interface Sketch {
  id: string;
  projectId: string;
  version: number;
  svgUrl: string;
  status: SketchStatus;
  annotations: Annotation[];
  createdAt: string;
  feedback?: string;
}

export interface ScheduleItem {
  id: string;
  projectId: string;
  volunteerId: string;
  date: string;
  startTime: string;
  endTime: string;
  task: string;
}

export interface Volunteer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  skills: string[];
}

export interface Material {
  id: string;
  projectId: string;
  name: string;
  quantity: number;
  unit: string;
  status: MaterialStatus;
  estimatedCost?: number;
  notes?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  location: string;
  status: ProjectStatus;
  startDate: string;
  endDate?: string;
  leadArtist: string;
  budget?: number;
}
