import axios from 'axios';
import type { CreatePollRequest, Poll, VoteRequest } from '../types';

const api = axios.create({
  baseURL: '/api',
});

export async function createPoll(data: CreatePollRequest, deviceId: string): Promise<Poll> {
  const response = await api.post('/polls', data, {
    headers: { 'X-Device-Id': deviceId },
  });
  return response.data;
}

export async function getPoll(id: string): Promise<Poll> {
  const response = await api.get(`/polls/${id}`);
  return response.data;
}

export async function submitVote(pollId: string, optionIds: number[], deviceId: string): Promise<Poll> {
  const data: VoteRequest = { optionIds };
  const response = await api.post(`/polls/${pollId}/vote`, data, {
    headers: { 'X-Device-Id': deviceId },
  });
  return response.data;
}

export async function getMyPolls(deviceId: string): Promise<Poll[]> {
  const response = await api.get('/polls', {
    headers: { 'X-Device-Id': deviceId },
  });
  return response.data;
}

export async function deletePoll(pollId: string, deviceId: string): Promise<{ success: boolean }> {
  const response = await api.delete(`/polls/${pollId}`, {
    headers: { 'X-Device-Id': deviceId },
  });
  return response.data;
}
