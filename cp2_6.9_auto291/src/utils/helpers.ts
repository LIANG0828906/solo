import { v4 as uuidv4 } from 'uuid';
import type { Escort, MapNode, Mission } from '@/types';

export const generateId = (): string => uuidv4();

export const getRandomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const getRandomInterval = (min: number, max: number): number => {
  return getRandomInt(min, max) * 1000;
};

export const calculateBattleResult = (escortSkill: number, banditStrength: number): boolean => {
  const escortChance = (escortSkill / 10) * 0.7;
  const banditChance = (banditStrength / 10) * 0.5;
  const successChance = escortChance / (escortChance + banditChance);
  return Math.random() < successChance;
};

export const getEscortById = (escorts: Escort[], id: string): Escort | undefined => {
  return escorts.find(e => e.id === id);
};

export const getNodeById = (nodes: MapNode[], id: string): MapNode | undefined => {
  return nodes.find(n => n.id === id);
};

export const interpolatePosition = (
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  progress: number
): { x: number; y: number } => {
  return {
    x: startX + (endX - startX) * progress,
    y: startY + (endY - startY) * progress
  };
};

export const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatTime = (date: Date): string => {
  return new Date(date).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getCartTypeName = (type: 'single' | 'double'): string => {
  return type === 'single' ? '独轮车' : '双轮车';
};

export const getStatusName = (status: Mission['status']): string => {
  const names: Record<Mission['status'], string> = {
    'pending': '待出发',
    'in-progress': '押运中',
    'success': '成功',
    'failed': '失败'
  };
  return names[status];
};

export const getStatusColor = (status: Mission['status']): string => {
  const colors: Record<Mission['status'], string> = {
    'pending': '#8d6e63',
    'in-progress': '#FFD700',
    'success': '#4CAF50',
    'failed': '#f44336'
  };
  return colors[status];
};

export const getRankBackground = (rank: number): string => {
  if (rank === 1) return 'linear-gradient(135deg, #FFD700, #FFA500)';
  if (rank === 2) return 'linear-gradient(135deg, #C0C0C0, #A0A0A0)';
  if (rank === 3) return 'linear-gradient(135deg, #CD7F32, #8B4513)';
  return 'transparent';
};

export const getNodeEmoji = (type: MapNode['type']): string => {
  const emojis: Record<MapNode['type'], string> = {
    'town': '🏯',
    'mountain': '⛰️',
    'river': '🌊'
  };
  return emojis[type];
};
