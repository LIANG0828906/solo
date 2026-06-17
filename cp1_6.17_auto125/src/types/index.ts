export interface Step {
  id: string;
  title: string;
  duration: number;
  notes: string;
  images: string[];
  quality: number;
  createdAt: number;
}

export interface Project {
  id: string;
  name: string;
  coverDescription: string;
  steps: Step[];
  createdAt: number;
  updatedAt: number;
}

export interface ProjectStore {
  projects: Project[];
  loading: boolean;
  error: string | null;
  fetchProjects: () => Promise<void>;
  createProject: (name: string, coverDescription: string) => Promise<Project | null>;
  updateProject: (id: string, data: Partial<Project>) => Promise<Project | null>;
  deleteProject: (id: string) => Promise<boolean>;
  addStep: (projectId: string, step: Omit<Step, 'id' | 'createdAt'>) => Promise<void>;
  updateStep: (projectId: string, stepId: string, data: Partial<Step>) => Promise<void>;
  deleteStep: (projectId: string, stepId: string) => Promise<void>;
  reorderSteps: (projectId: string, stepIds: string[]) => Promise<void>;
  getProjectById: (id: string) => Project | undefined;
}

export type ViewMode = 'list' | 'detail' | 'review';
