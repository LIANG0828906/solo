export interface Movie {
  id: string;
  title: string;
  year: number;
  director: string;
  rating: number;
  review: string;
  posterColor: string;
  watchDate: string;
  order: number;
}

export interface MovieFormData {
  title: string;
  year: number;
  director: string;
  rating: number;
  review: string;
}

export interface PosterInfo {
  posterColor: string;
  groupYear: number;
}

const API_BASE = '/api';

export async function getPosterInfo(title: string, year: number): Promise<PosterInfo> {
  const response = await fetch(
    `${API_BASE}/poster?title=${encodeURIComponent(title)}&year=${year}`
  );
  if (!response.ok) {
    throw new Error('获取海报信息失败');
  }
  return response.json();
}

export function getRatingGradientColor(rating: number): string {
  const t = Math.max(0, Math.min(5, rating)) / 5;
  const r1 = 255, g1 = 107, b1 = 107;
  const r2 = 32, g2 = 201, b2 = 151;
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `linear-gradient(135deg, rgba(${r},${g},${b},0.9) 0%, rgba(${r},${g},${b},0.6) 100%)`;
}

export function getMonthColor(month: number): string {
  const colors = [
    '#ff6b6b', '#ffa94d', '#ffd43b', '#a9e34b', '#69db7c', '#38d9a9',
    '#4dd0e1', '#74c0fc', '#9775fa', '#da77f2', '#f783ac', '#ff8787'
  ];
  return colors[month % colors.length];
}
