import axios from 'axios';
import type {
  StoryNode,
  StoryEdge,
  Character,
  CharacterRelation,
  StoryVersion,
  BranchCondition,
  SimulationResult,
} from '@/types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface CreateStoryParams {
  title: string;
  description?: string;
}

export interface CreateStoryResponse {
  id: string;
  title: string;
  description: string;
  createdAt: number;
  updatedAt: number;
}

export const storyApi = {
  createStory: async (params: CreateStoryParams): Promise<CreateStoryResponse> => {
    try {
      const { data } = await api.post('/stories', params);
      return data;
    } catch {
      return {
        id: `story-${Date.now()}`,
        title: params.title,
        description: params.description || '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    }
  },

  getStory: async (id: string) => {
    try {
      const { data } = await api.get(`/stories/${id}`);
      return data;
    } catch {
      return null;
    }
  },

  getNodes: async (storyId: string): Promise<StoryNode[]> => {
    try {
      const { data } = await api.get(`/stories/${storyId}/nodes`);
      return data;
    } catch {
      return [];
    }
  },

  createNode: async (storyId: string, node: Omit<StoryNode, 'id' | 'createdAt' | 'updatedAt'>): Promise<StoryNode> => {
    try {
      const { data } = await api.post(`/stories/${storyId}/nodes`, node);
      return data;
    } catch {
      return { ...node, id: `node-${Date.now()}`, createdAt: Date.now(), updatedAt: Date.now() };
    }
  },

  updateNode: async (storyId: string, nodeId: string, updates: Partial<StoryNode>): Promise<StoryNode | null> => {
    try {
      const { data } = await api.put(`/stories/${storyId}/nodes/${nodeId}`, updates);
      return data;
    } catch {
      return null;
    }
  },

  deleteNode: async (storyId: string, nodeId: string): Promise<boolean> => {
    try {
      await api.delete(`/stories/${storyId}/nodes/${nodeId}`);
      return true;
    } catch {
      return true;
    }
  },

  createEdge: async (storyId: string, sourceId: string, targetId: string, condition: BranchCondition): Promise<StoryEdge> => {
    try {
      const { data } = await api.post(`/stories/${storyId}/edges`, { sourceId, targetId, condition });
      return data;
    } catch {
      return {
        id: `edge-${Date.now()}`,
        sourceId,
        targetId,
        condition,
        createdAt: Date.now(),
      };
    }
  },

  updateEdge: async (storyId: string, edgeId: string, updates: Partial<StoryEdge>): Promise<StoryEdge | null> => {
    try {
      const { data } = await api.put(`/stories/${storyId}/edges/${edgeId}`, updates);
      return data;
    } catch {
      return null;
    }
  },

  deleteEdge: async (storyId: string, edgeId: string): Promise<boolean> => {
    try {
      await api.delete(`/stories/${storyId}/edges/${edgeId}`);
      return true;
    } catch {
      return true;
    }
  },

  createCharacter: async (storyId: string, char: Omit<Character, 'id'>): Promise<Character> => {
    try {
      const { data } = await api.post(`/stories/${storyId}/characters`, char);
      return data;
    } catch {
      return { ...char, id: `char-${Date.now()}` };
    }
  },

  createRelation: async (storyId: string, rel: Omit<CharacterRelation, 'id'>): Promise<CharacterRelation> => {
    try {
      const { data } = await api.post(`/stories/${storyId}/relations`, rel);
      return data;
    } catch {
      return { ...rel, id: `rel-${Date.now()}` };
    }
  },

  getVersions: async (storyId: string): Promise<StoryVersion[]> => {
    try {
      const { data } = await api.get(`/stories/${storyId}/versions`);
      return data;
    } catch {
      return [];
    }
  },

  getVersion: async (storyId: string, versionId: string): Promise<StoryVersion | null> => {
    try {
      const { data } = await api.get(`/stories/${storyId}/versions/${versionId}`);
      return data;
    } catch {
      return null;
    }
  },

  createVersion: async (storyId: string): Promise<StoryVersion | null> => {
    try {
      const { data } = await api.post(`/stories/${storyId}/versions`);
      return data;
    } catch {
      return null;
    }
  },

  simulate: async (storyId: string, startNodeId: string): Promise<SimulationResult | null> => {
    try {
      const { data } = await api.post(`/stories/${storyId}/simulate`, { startNodeId });
      return data;
    } catch {
      return null;
    }
  },
};

export default api;
