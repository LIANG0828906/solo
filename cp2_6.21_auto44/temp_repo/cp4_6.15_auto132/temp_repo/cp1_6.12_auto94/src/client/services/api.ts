import axios from 'axios';
import { Card, Group, User } from '../../shared/types';

const api = axios.create({
  baseURL: '/api',
});

export const ideasApi = {
  getCards: async (teamName: string): Promise<{ cards: Card[]; groups: Group[]; votingActive: boolean; votingRound: number }> => {
    const response = await api.get(`/ideas/${teamName}`);
    return response.data;
  },

  createCard: async (data: {
    content: string;
    author: string;
    authorColor: string;
    teamName: string;
    x: number;
    y: number;
  }): Promise<Card> => {
    const response = await api.post('/ideas', data);
    return response.data;
  },

  updatePosition: async (id: string, x: number, y: number, teamName: string): Promise<Card> => {
    const response = await api.put(`/ideas/${id}/position`, { x, y, teamName });
    return response.data;
  },

  updateGroup: async (id: string, groupId: string | null, teamName: string): Promise<Card> => {
    const response = await api.put(`/ideas/${id}/group`, { groupId, teamName });
    return response.data;
  },

  deleteCard: async (id: string, teamName: string): Promise<void> => {
    await api.delete(`/ideas/${id}`, { data: { teamName } });
  },

  getGroups: async (teamName: string): Promise<Group[]> => {
    const response = await api.get(`/ideas/${teamName}/groups`);
    return response.data;
  },

  createGroup: async (teamName: string, name: string): Promise<Group> => {
    const response = await api.post('/ideas/groups', { teamName, name });
    return response.data;
  },

  updateGroup: async (id: string, teamName: string, name: string): Promise<Group> => {
    const response = await api.put(`/ideas/groups/${id}`, { teamName, name });
    return response.data;
  },

  deleteGroup: async (id: string, teamName: string): Promise<void> => {
    await api.delete(`/ideas/groups/${id}`, { data: { teamName } });
  },
};

export const voteApi = {
  getResults: async (teamName: string): Promise<{ cards: Card[]; votingActive: boolean; votingRound: number }> => {
    const response = await api.get(`/vote/${teamName}/results`);
    return response.data;
  },

  vote: async (cardId: string, userId: string, teamName: string): Promise<{ card: Card; user: User }> => {
    const response = await api.post('/vote/vote', { cardId, userId, teamName });
    return response.data;
  },

  startVoting: async (teamName: string): Promise<{ votingActive: boolean; votingRound: number }> => {
    const response = await api.post('/vote/start', { teamName });
    return response.data;
  },

  endVoting: async (teamName: string): Promise<{ votingActive: boolean; sortedCards: Card[] }> => {
    const response = await api.post('/vote/end', { teamName });
    return response.data;
  },

  joinUser: async (teamName: string, nickname: string, color: string): Promise<User> => {
    const response = await api.post('/vote/user', { teamName, nickname, color });
    return response.data;
  },

  getUser: async (teamName: string, userId: string): Promise<User> => {
    const response = await api.get(`/vote/${teamName}/users/${userId}`);
    return response.data;
  },
};
