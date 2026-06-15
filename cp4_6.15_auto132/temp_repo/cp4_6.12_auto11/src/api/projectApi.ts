import axios from 'axios';
import { Project, LayoutCell, FabricUsage } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

const getAuthHeaders = () => {
  const userId = localStorage.getItem('userId');
  return userId ? { 'X-User-Id': userId } : {};
};

interface RawProject extends Omit<Project, 'layout' | 'fabricUsage'> {
  layout: string;
  fabricUsage: string;
}

const parseProject = (raw: RawProject): Project => ({
  ...raw,
  layout: JSON.parse(raw.layout) as LayoutCell[],
  fabricUsage: JSON.parse(raw.fabricUsage) as FabricUsage[],
});

export const fetchProjects = async (): Promise<Project[]> => {
  const response = await api.get('/projects', {
    headers: getAuthHeaders(),
  });
  return response.data.map(parseProject);
};

export const fetchProjectById = async (id: number): Promise<Project> => {
  const response = await api.get(`/projects/${id}`, {
    headers: getAuthHeaders(),
  });
  return parseProject(response.data);
};

interface CreateProjectData {
  name: string;
  widthCm: number;
  heightCm: number;
  gridCols: number;
  gridRows: number;
  layout?: LayoutCell[];
  totalCost?: number;
  fabricUsage?: FabricUsage[];
}

export const createProject = async (data: CreateProjectData): Promise<Project> => {
  const response = await api.post('/projects', data, {
    headers: getAuthHeaders(),
  });
  return parseProject(response.data);
};

interface UpdateProjectData {
  name?: string;
  widthCm?: number;
  heightCm?: number;
  gridCols?: number;
  gridRows?: number;
  layout?: LayoutCell[];
  totalCost?: number;
  fabricUsage?: FabricUsage[];
}

export const updateProject = async (id: number, data: UpdateProjectData): Promise<Project> => {
  const response = await api.put(`/projects/${id}`, data, {
    headers: getAuthHeaders(),
  });
  return parseProject(response.data);
};

export const deleteProjectApi = async (id: number): Promise<void> => {
  await api.delete(`/projects/${id}`, {
    headers: getAuthHeaders(),
  });
};
