export interface Candidate {
  id: string;
  name: string;
  emoji: string;
  color: string;
  votes: number;
}

export interface Room {
  id: string;
  title: string;
  candidates: Candidate[];
  status: 'voting' | 'ended';
  totalVotes: number;
}

export interface VoteRecord {
  candidateId: string;
  timestamp: number;
}

export interface Particle {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  startX: number;
  startY: number;
  color: string;
  size: number;
  speed: number;
  progress: number;
  phase: number;
  candidateId: string;
}

export interface VoteResult {
  candidateId: string;
  name: string;
  emoji: string;
  color: string;
  votes: number;
  percentage: number;
}

export const PARTICLE_COLORS = ['#FF6B6B', '#4ECDC4', '#FFD93D', '#6BCB77'];

export const DEFAULT_CANDIDATES: Omit<Candidate, 'id' | 'votes'>[] = [
  { name: '火焰凤凰', emoji: '🔥', color: '#FF6B6B' },
  { name: '海洋之心', emoji: '💎', color: '#4ECDC4' },
  { name: '金色阳光', emoji: '☀️', color: '#FFD93D' },
  { name: '翠绿树精', emoji: '🌿', color: '#6BCB77' },
];
