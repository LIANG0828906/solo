export interface Project {
  id: string;
  name: string;
  description: string;
  templateId: string;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail: string;
  schema: Record<string, unknown>;
  defaultData: Record<string, unknown>;
}

export interface ProjectCreateBody {
  name: string;
  description?: string;
  templateId: string;
  data?: Record<string, unknown>;
}

export interface ProjectUpdateBody {
  name?: string;
  description?: string;
  data?: Record<string, unknown>;
}
