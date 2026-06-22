import axios from 'axios';
import type { CreateVoteRequest, SubmitRankingRequest, Vote, OptionScore } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const voteApi = {
  createVote: async (data: CreateVoteRequest): Promise<{ id: string }> => {
    const response = await api.post('/votes', data);
    return response.data;
  },

  getVote: async (id: string): Promise<Vote> => {
    const response = await api.get(`/votes/${id}`);
    return response.data;
  },

  submitRanking: async (voteId: string, data: SubmitRankingRequest): Promise<void> => {
    await api.post(`/votes/${voteId}/rankings`, data);
  },

  closeVote: async (voteId: string): Promise<void> => {
    await api.post(`/votes/${voteId}/close`);
  },

  getResults: async (voteId: string): Promise<OptionScore[]> => {
    const response = await api.get(`/votes/${voteId}/results`);
    return response.data;
  },
};
