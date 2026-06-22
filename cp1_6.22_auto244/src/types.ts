export interface Event {
  id: string;
  name: string;
  date: string;
  projects: Project[];
}

export interface Project {
  id: string;
  name: string;
  maxParticipants: number;
  type: 'timed' | 'scored';
  participants: Participant[];
}

export interface Participant {
  id: string;
  name: string;
  unit: string;
  number: string;
  projects: string[];
  scores: Record<string, number>;
}

export interface ScoreRecord {
  projectId: string;
  participantId: string;
  score: number;
  timestamp: number;
}

export interface RankItem {
  participant: Participant;
  score: number;
  rank: number;
}

export type SocketEventHandler = (...args: unknown[]) => void;

export interface SocketServiceInterface {
  connect(): void;
  disconnect(): void;
  on(event: string, handler: SocketEventHandler): () => void;
  emit(event: string, data: unknown): void;
  isConnected(): boolean;
}
