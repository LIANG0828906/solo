import type { GameState, AIAction } from '../types';

const API_BASE = '/api';

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: '请求失败' }));
      throw new Error(error.error || `HTTP ${res.status}`);
    }

    return res.json();
  }

  async startGame(): Promise<GameState> {
    return this.request<GameState>('/startGame', {
      method: 'POST',
    });
  }

  async playCard(
    gameId: string,
    cardInstanceId: string,
    targetId?: string
  ): Promise<GameState> {
    return this.request<GameState>('/playCard', {
      method: 'POST',
      body: JSON.stringify({ gameId, cardInstanceId, targetId }),
    });
  }

  async endTurn(gameId: string): Promise<GameState> {
    return this.request<GameState>('/endTurn', {
      method: 'POST',
      body: JSON.stringify({ gameId }),
    });
  }

  async getAIAction(gameId: string): Promise<AIAction | null> {
    return this.request<AIAction | null>(`/aiAction?gameId=${gameId}`, {
      method: 'GET',
    });
  }

  async executeAIAction(
    gameId: string,
    action: AIAction
  ): Promise<GameState> {
    return this.request<GameState>('/executeAIAction', {
      method: 'POST',
      body: JSON.stringify({ gameId, action }),
    });
  }

  async getBattleLogs(gameId: string) {
    return this.request(`/battleLogs?gameId=${gameId}`, {
      method: 'GET',
    });
  }

  async attack(
    gameId: string,
    attackerId: string,
    targetId: string,
    targetType: 'minion' | 'hero'
  ): Promise<GameState> {
    return this.request<GameState>('/attack', {
      method: 'POST',
      body: JSON.stringify({ gameId, attackerId, targetId, targetType }),
    });
  }
}

export const apiService = new ApiService();
export default apiService;
