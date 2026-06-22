import axios from 'axios';
import type { KnowledgeGraph, Collaborator } from './data';

const API_BASE = '/api';

export const api = {
  async listGraphs(): Promise<KnowledgeGraph[]> {
    try {
      const res = await axios.get(`${API_BASE}/graphs`);
      return res.data;
    } catch {
      return [];
    }
  },

  async getGraph(id: string): Promise<KnowledgeGraph | null> {
    try {
      const res = await axios.get(`${API_BASE}/graphs/${id}`);
      return res.data;
    } catch {
      return null;
    }
  },

  async createGraph(name: string): Promise<KnowledgeGraph> {
    const res = await axios.post(`${API_BASE}/graphs`, { name });
    return res.data;
  },

  async updateGraph(graph: KnowledgeGraph): Promise<KnowledgeGraph> {
    const res = await axios.put(`${API_BASE}/graphs/${graph.id}`, graph);
    return res.data;
  },

  async pollGraph(id: string, version: number): Promise<{ version: number; graph?: KnowledgeGraph; collaborators: Collaborator[] }> {
    try {
      const res = await axios.get(`${API_BASE}/graphs/${id}/poll`, { params: { version } });
      return res.data;
    } catch {
      return { version, collaborators: [] };
    }
  },

  async joinGraph(id: string, roomCode: string, userName: string): Promise<{ collaboratorId: string; graph: KnowledgeGraph } | null> {
    try {
      const res = await axios.post(`${API_BASE}/graphs/${id}/join`, { roomCode, userName });
      return res.data;
    } catch {
      return null;
    }
  },

  async updateActivity(id: string, collaboratorId: string, activeNodeId: string | null): Promise<void> {
    try {
      await axios.post(`${API_BASE}/graphs/${id}/activity`, { collaboratorId, activeNodeId });
    } catch {}
  },

  saveLocal(graphId: string, data: { nodes: any[]; edges: any[] }) {
    localStorage.setItem(`kg_${graphId}`, JSON.stringify(data));
  },

  loadLocal(graphId: string): { nodes: any[]; edges: any[] } | null {
    const raw = localStorage.getItem(`kg_${graphId}`);
    return raw ? JSON.parse(raw) : null;
  }
};
