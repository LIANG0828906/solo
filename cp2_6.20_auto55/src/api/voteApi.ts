import axios from 'axios';
import type {
  Vote,
  VoteFilters,
  CreateVoteRequest,
  UpdateVoteRequest,
  SubmitVoteRequest,
  VoteRecord,
} from '@/types';

const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

function validateVoteData(data: CreateVoteRequest | UpdateVoteRequest): void {
  const { type, options, maxScore } = data;

  if (type === 'rank') {
    const validOptions = options?.filter((o) => o && o.trim());
    if (validOptions && validOptions.length < 2) {
      throw new Error('排名投票至少需要2个有效选项');
    }
  }

  if (type === 'score') {
    if (maxScore !== undefined && (maxScore < 0 || maxScore > 10)) {
      throw new Error('评分投票的最大分数必须在0-10之间');
    }
  }
}

export function fetchVotes(filters?: Partial<VoteFilters>): Promise<Vote[]> {
  return request.get('/votes', { params: filters }).then((res) => res.data);
}

export function fetchVote(id: string): Promise<Vote> {
  return request.get(`/votes/${id}`).then((res) => res.data);
}

export function createVote(data: CreateVoteRequest): Promise<Vote> {
  validateVoteData(data);
  return request.post('/votes', data).then((res) => res.data);
}

export function updateVote(id: string, data: UpdateVoteRequest): Promise<Vote> {
  validateVoteData(data);
  return request.put(`/votes/${id}`, data).then((res) => res.data);
}

export function deleteVote(id: string): Promise<{ success: boolean }> {
  return request.delete(`/votes/${id}`).then((res) => res.data);
}

export function submitVote(
  id: string,
  data: SubmitVoteRequest
): Promise<{ success: boolean; message: string }> {
  return request.post(`/votes/${id}/submit`, data).then((res) => res.data);
}

export function fetchVoteResults(id: string): Promise<any> {
  return request.get(`/votes/${id}/results`).then((res) => res.data);
}

export function fetchVoteRecords(id: string): Promise<VoteRecord[]> {
  return request.get(`/votes/${id}/records`).then((res) => res.data);
}
