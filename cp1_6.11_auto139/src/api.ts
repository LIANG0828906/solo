import axios from 'axios';
import { Decision, DecisionType, Comment } from './types';

const api = axios.create({ baseURL: '/api' });

export const fetchDecisions = () =>
  api.get<{ decisions: Decision[] }>('/decisions').then(r => r.data.decisions);

export const createDecision = (data: { title: string; description: string; type: DecisionType; author: string }) =>
  api.post<{ decision: Decision }>('/decisions', data).then(r => r.data.decision);

export const updateDecision = (id: string, data: Partial<Pick<Decision, 'title' | 'description' | 'type'>>) =>
  api.put<{ decision: Decision }>(`/decisions/${id}`, data).then(r => r.data.decision);

export const deleteDecision = (id: string) =>
  api.delete(`/decisions/${id}`).then(r => r.data);

export const addComment = (id: string, data: { author: string; content: string }) =>
  api.post<{ comment: Comment }>(`/decisions/${id}/comments`, data).then(r => r.data.comment);

export const togglePin = (id: string) =>
  api.post<{ decision: Decision }>(`/decisions/${id}/pin`).then(r => r.data.decision);
