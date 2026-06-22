import axios from 'axios';
import { MindmapNode, Task } from '../types';

const api = axios.create({
  baseURL: 'http://localhost:8001',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const mindmapApi = {
  saveMindmap: async (nodes: MindmapNode[], tasks: Task[]) => {
    const response = await api.post('/mindmap/save', { nodes, tasks });
    return response.data;
  },

  loadMindmap: async () => {
    const response = await api.get('/mindmap/load');
    return response.data;
  },

  createNode: async (node: Omit<MindmapNode, 'created_at' | 'updated_at'>) => {
    const response = await api.post('/node/', node);
    return response.data;
  },

  updateNode: async (id: string, updates: Partial<MindmapNode>) => {
    const response = await api.put(`/node/${id}`, updates);
    return response.data;
  },

  deleteNode: async (id: string) => {
    const response = await api.delete(`/node/${id}`);
    return response.data;
  },

  getNodes: async () => {
    const response = await api.get('/node/');
    return response.data;
  },

  createTask: async (task: Omit<Task, 'created_at' | 'updated_at'>) => {
    const response = await api.post('/task/', task);
    return response.data;
  },

  updateTask: async (id: string, updates: Partial<Task>) => {
    const response = await api.put(`/task/${id}`, updates);
    return response.data;
  },

  deleteTask: async (id: string) => {
    const response = await api.delete(`/task/${id}`);
    return response.data;
  },

  getTasks: async (nodeId?: string) => {
    const url = nodeId ? `/task/?node_id=${nodeId}` : '/task/';
    const response = await api.get(url);
    return response.data;
  },
};

export default api;
