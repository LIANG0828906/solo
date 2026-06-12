import type { GraphNode, GraphLink, GraphData, NodeType, LinkType } from './types';

const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export const dataStore = {
  async getGraph(): Promise<GraphData> {
    return request<GraphData>('/graph');
  },

  async getNodes(): Promise<GraphNode[]> {
    return request<GraphNode[]>('/nodes');
  },

  async createNode(node: { type: NodeType; title: string; content: string; x?: number; y?: number }): Promise<GraphNode> {
    return request<GraphNode>('/nodes', {
      method: 'POST',
      body: JSON.stringify(node),
    });
  },

  async updateNode(id: string, updates: Partial<GraphNode>): Promise<GraphNode> {
    return request<GraphNode>(`/nodes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteNode(id: string): Promise<void> {
    await request(`/nodes/${id}`, { method: 'DELETE' });
  },

  async getLinks(): Promise<GraphLink[]> {
    return request<GraphLink[]>('/links');
  },

  async createLink(link: { source: string; target: string; type: LinkType }): Promise<GraphLink> {
    return request<GraphLink>('/links', {
      method: 'POST',
      body: JSON.stringify(link),
    });
  },

  async updateLink(id: string, updates: Partial<GraphLink>): Promise<GraphLink> {
    return request<GraphLink>(`/links/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteLink(id: string): Promise<void> {
    await request(`/links/${id}`, { method: 'DELETE' });
  },
};
