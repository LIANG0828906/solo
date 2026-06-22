import type { Item, Rarity, RankingView } from '../../server/database';

export interface ApiItem {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  attributes: { name: string; value: number }[];
}

export interface ApiRankingEntry {
  rank: number;
  playerName: string;
  score: number;
  accuracy: number;
  duration: number;
}

interface ApiResp<T> {
  success: boolean;
  data?: T;
  error?: string;
}

function handleError(err: unknown): never {
  if (err instanceof Error) {
    throw new Error(`请求失败: ${err.message}`);
  }
  throw new Error('网络请求异常');
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const resp = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers ?? {}),
      },
    });
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }
    const json = (await resp.json()) as ApiResp<T>;
    if (!json.success || json.data === undefined) {
      throw new Error(json.error ?? '响应格式错误');
    }
    return json.data;
  } catch (e) {
    return handleError(e);
  }
}

export default class ApiClient {
  static async getItem(): Promise<ApiItem> {
    return request<ApiItem>('/api/item');
  }

  static async submitScore(params: {
    playerName: string;
    score: number;
    accuracy: number;
    duration: number;
  }): Promise<{ success: boolean; rank: number }> {
    return request<{ success: boolean; rank: number }>('/api/score', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  static async getRanking(limit = 100): Promise<ApiRankingEntry[]> {
    return request<ApiRankingEntry[]>(`/api/ranking?limit=${limit}`);
  }
}

export type { Item, RankingView };
