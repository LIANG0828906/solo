import axios from 'axios';
import { Task, Dependency, Milestone } from '../types';

const API_BASE = '/api';

export const taskService = {
  getTasks: async (): Promise<Task[]> => {
    const response = await axios.get(`${API_BASE}/tasks`);
    return response.data;
  },

  createTask: async (task: Partial<Task>): Promise<Task> => {
    const response = await axios.post(`${API_BASE}/tasks`, task);
    return response.data;
  },

  updateTask: async (id: string, updates: Partial<Task>): Promise<Task> => {
    const response = await axios.put(`${API_BASE}/tasks/${id}`, updates);
    return response.data;
  },

  getDependencies: async (): Promise<Dependency[]> => {
    const response = await axios.get(`${API_BASE}/dependencies`);
    return response.data;
  },

  createDependency: async (
    fromTaskId: string,
    toTaskId: string
  ): Promise<Dependency> => {
    const response = await axios.post(`${API_BASE}/dependencies`, {
      fromTaskId,
      toTaskId,
    });
    return response.data;
  },

  getMilestones: async (): Promise<Milestone[]> => {
    const response = await axios.get(`${API_BASE}/milestones`);
    return response.data;
  },

  createMilestone: async (milestone: Partial<Milestone>): Promise<Milestone> => {
    const response = await axios.post(`${API_BASE}/milestones`, milestone);
    return response.data;
  },

  updateMilestone: async (id: string, updates: Partial<Milestone>): Promise<Milestone> => {
    const response = await axios.put(`${API_BASE}/milestones/${id}`, updates);
    return response.data;
  },

  deleteMilestone: async (id: string): Promise<void> => {
    await axios.delete(`${API_BASE}/milestones/${id}`);
  },
};
