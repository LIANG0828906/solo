import { GameState } from './types';

const API_BASE = '/api';

export async function getState(): Promise<GameState> {
  const response = await fetch(`${API_BASE}/state`);
  if (!response.ok) {
    throw new Error('获取游戏状态失败');
  }
  return response.json();
}

export async function moveTeam(x: number, y: number): Promise<{ success: boolean; state: GameState; eventTriggered: boolean }> {
  const response = await fetch(`${API_BASE}/move`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ x, y }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '移动失败');
  }
  return response.json();
}

export async function chooseEventOption(optionId: string): Promise<{ success: boolean; state: GameState }> {
  const response = await fetch(`${API_BASE}/event/choose`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ optionId }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '选择事件选项失败');
  }
  return response.json();
}

export async function eventTimeout(): Promise<{ success: boolean; state: GameState }> {
  const response = await fetch(`${API_BASE}/event/timeout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '事件超时处理失败');
  }
  return response.json();
}

export async function resetGame(): Promise<{ success: boolean; state: GameState }> {
  const response = await fetch(`${API_BASE}/reset`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error('重置游戏失败');
  }
  return response.json();
}
