import axios from 'axios';
import type {
  Vote,
  VoteFilters,
  CreateVoteRequest,
  UpdateVoteRequest,
  SubmitVoteRequest,
  VoteRecord,
} from '@/types';

// 创建 axios 实例
const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// 获取投票列表
export function fetchVotes(filters?: VoteFilters): Promise<Vote[]> {
  return request.get('/votes', { params: filters }).then((res) => res.data);
}

// 获取投票详情
export function fetchVote(id: string): Promise<Vote> {
  return request.get(`/votes/${id}`).then((res) => res.data);
}

// 创建投票
export function createVote(data: CreateVoteRequest): Promise<Vote> {
  return request.post('/votes', data).then((res) => res.data);
}

// 更新投票
export function updateVote(id: string, data: UpdateVoteRequest): Promise<Vote> {
  return request.put(`/votes/${id}`, data).then((res) => res.data);
}

// 删除投票
export function deleteVote(id: string): Promise<void> {
  return request.delete(`/votes/${id}`).then((res) => res.data);
}

// 提交投票
export function submitVote(
  id: string,
  data: SubmitVoteRequest
): Promise<{ success: boolean; message: string }> {
  return request.post(`/votes/${id}/submit`, data).then((res) => res.data);
}

// 获取投票结果
export function fetchVoteResults(id: string): Promise<any> {
  return request.get(`/votes/${id}/results`).then((res) => res.data);
}

// 获取投票记录
export function fetchVoteRecords(id: string): Promise<VoteRecord[]> {
  return request.get(`/votes/${id}/records`).then((res) => res.data);
}
