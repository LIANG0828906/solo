import client from './client';

export interface Project {
  id: string;
  project_type: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  design_images?: string;
  wood_type: string;
  surface_finish: string;
  expected_date: string;
  description?: string;
  status: ProjectStatus;
  price?: number;
  created_at: string;
  updated_at: string;
}

export type ProjectStatus = 'pending_quote' | 'confirmed' | 'preparing' | 'in_progress' | 'quality_check' | 'completed';

export const statusLabels: Record<ProjectStatus, string> = {
  pending_quote: '待报价',
  confirmed: '已确认',
  preparing: '备料中',
  in_progress: '制作中',
  quality_check: '待质检',
  completed: '已完成待取'
};

export const statusColors: Record<ProjectStatus, string> = {
  pending_quote: '#FF9800',
  confirmed: '#2196F3',
  preparing: '#9C27B0',
  in_progress: '#4CAF50',
  quality_check: '#FF5722',
  completed: '#795548'
};

export const statusOrder: ProjectStatus[] = [
  'pending_quote',
  'confirmed',
  'preparing',
  'in_progress',
  'quality_check',
  'completed'
];

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const getProjects = async (status?: ProjectStatus): Promise<Project[]> => {
  const params = status ? { status } : {};
  const response = await client.get<any, ApiResponse<Project[]>>('/projects', { params });
  return response.data;
};

export const getProject = async (id: string): Promise<Project> => {
  const response = await client.get<any, ApiResponse<Project>>(`/projects/${id}`);
  return response.data;
};

export const createProject = async (project: Omit<Project, 'id' | 'status' | 'created_at' | 'updated_at'>): Promise<Project> => {
  const response = await client.post<any, ApiResponse<Project>>('/projects', project);
  return response.data;
};

export const updateProjectStatus = async (id: string, status: ProjectStatus): Promise<Project> => {
  const response = await client.patch<any, ApiResponse<Project>>(`/projects/${id}/status`, { status });
  return response.data;
};

export const deleteProject = async (id: string): Promise<void> => {
  await client.delete(`/projects/${id}`);
};
