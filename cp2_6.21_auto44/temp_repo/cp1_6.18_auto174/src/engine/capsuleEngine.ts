import { Capsule, CreateCapsuleInput, EmotionType } from '../../shared/types';

const API_BASE = '/api';

export const EMOTION_COLORS: Record<EmotionType, string> = {
  joy: '#FF6B6B',
  sadness: '#6B6BFF',
  nostalgia: '#FFB347',
  anticipation: '#4ECDC4',
  calm: '#95E1D3',
};

export const EMOTION_LABELS: Record<EmotionType, string> = {
  joy: '喜悦',
  sadness: '悲伤',
  nostalgia: '怀念',
  anticipation: '期待',
  calm: '平静',
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Request failed');
  }
  return data.data;
}

export async function fetchCapsules(): Promise<Capsule[]> {
  return request<Capsule[]>('/capsules');
}

export async function fetchCapsule(id: string): Promise<Capsule> {
  return request<Capsule>(`/capsules/${id}`);
}

export async function createCapsule(input: CreateCapsuleInput): Promise<Capsule> {
  return request<Capsule>('/capsules', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function markCapsuleAsRead(id: string): Promise<Capsule> {
  return request<Capsule>(`/capsules/${id}/read`, {
    method: 'PATCH',
  });
}

export async function pollUpdates(): Promise<Capsule[]> {
  return request<Capsule[]>('/poll/updates');
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00:00';
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);
  return `${String(days).padStart(2, '0')}:${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function encodeImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}
