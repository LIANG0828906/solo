export interface VoteOption {
  id: string;
  text: string;
  votes: string[];
}

export interface Vote {
  id: string;
  title: string;
  options: VoteOption[];
  createdAt: number;
  deadline: number;
}

export interface VoteStat {
  optionId: string;
  text: string;
  count: number;
  percentage: number;
}

export interface CreateVoteParams {
  title: string;
  options: string[];
  duration: number;
}

const BASE = '/api';

export async function createVote(params: CreateVoteParams): Promise<Vote> {
  const res = await fetch(`${BASE}/votes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params) });
  if (!res.ok) throw new Error('创建失败');
  return res.json();
}

export async function getVotes(): Promise<Vote[]> {
  const res = await fetch(`${BASE}/votes`);
  return res.json();
}

export async function submitVote(voteId: string, userId: string, optionId: string): Promise<Vote> {
  const res = await fetch(`${BASE}/votes/${voteId}/vote`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, optionId }) });
  if (res.status === 400) { const data = await res.json(); throw new Error(data.error || '已投票'); }
  if (!res.ok) throw new Error('投票失败');
  return res.json();
}

export async function getVoteStats(voteId: string): Promise<{ vote: Vote; stats: VoteStat[] }> {
  const res = await fetch(`${BASE}/votes/${voteId}/stats`);
  return res.json();
}
