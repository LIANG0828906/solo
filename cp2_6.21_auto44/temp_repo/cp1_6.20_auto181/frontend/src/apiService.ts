import { Card, CardEffect, Rarity, BattleResult } from './types';

const API_BASE = '/api';

export interface CalculateResponse {
  power: number;
  cost: number;
  valid: boolean;
  error?: string;
}

export async function calculateCard(
  effects: CardEffect[],
  rarity: Rarity
): Promise<CalculateResponse> {
  const response = await fetch(`${API_BASE}/cards/calculate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ effects, rarity }),
  });

  if (!response.ok) {
    throw new Error('计算卡牌失败');
  }

  return response.json();
}

export async function fetchCards(): Promise<Card[]> {
  const response = await fetch(`${API_BASE}/cards`);

  if (!response.ok) {
    throw new Error('获取卡牌列表失败');
  }

  return response.json();
}

export async function saveCard(card: Card): Promise<{ success: boolean; card: Card }> {
  const response = await fetch(`${API_BASE}/cards`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(card),
  });

  if (!response.ok) {
    throw new Error('保存卡牌失败');
  }

  return response.json();
}

export async function fetchEffects(): Promise<CardEffect[]> {
  const response = await fetch(`${API_BASE}/effects`);

  if (!response.ok) {
    throw new Error('获取效果列表失败');
  }

  return response.json();
}

export async function simulateBattle(playerDeck: Card[]): Promise<BattleResult> {
  const response = await fetch(`${API_BASE}/decks/simulate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ playerDeck }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || '模拟对战失败');
  }

  return response.json();
}
