import axios from 'axios';
import type { Story, Branch, CreateStoryRequest, CreateBranchRequest, AddParagraphRequest } from './types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export const storyApi = {
  getAllStories: async (): Promise<Story[]> => {
    const response = await api.get<Story[]>('/stories');
    return response.data;
  },

  getStory: async (id: string): Promise<Story> => {
    const response = await api.get<Story>(`/stories/${id}`);
    return response.data;
  },

  createStory: async (data: CreateStoryRequest): Promise<Story> => {
    const response = await api.post<Story>('/stories', data);
    return response.data;
  },

  addParagraph: async (storyId: string, data: AddParagraphRequest): Promise<Story> => {
    const response = await api.post<Story>(`/stories/${storyId}/paragraphs`, data);
    return response.data;
  },
};

export const branchApi = {
  getBranches: async (storyId: string): Promise<Branch[]> => {
    const response = await api.get<Branch[]>('/branches', {
      params: { storyId },
    });
    return response.data;
  },

  createBranch: async (data: CreateBranchRequest): Promise<Branch> => {
    const response = await api.post<Branch>('/branches', data);
    return response.data;
  },

  activateBranch: async (branchId: string, storyId: string): Promise<Story> => {
    const response = await api.put<Story>(`/branches/${branchId}/activate`, {
      storyId,
    });
    return response.data;
  },
};
