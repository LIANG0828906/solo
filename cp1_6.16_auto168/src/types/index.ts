export interface NetworkNode {
  id: string;
  name: string;
  x: number;
  y: number;
  defense: number;
  parentId: string | null;
  childrenIds: string[];
  status: 'locked' | 'captured' | 'entry';
  defenseLevel: 'low' | 'medium' | 'high';
}

export interface LogEntry {
  timestamp: number;
  message: string;
}

export interface LeaderboardEntry {
  id: string;
  score: number;
  time: number;
  date: number;
}

export type HackResult = 'success' | 'failure' | 'invalid';

export interface FirewallChoice {
  id: string;
  label: string;
  description: string;
  effect: {
    type: 'addFragments' | 'removeFragments' | 'halfDefense';
    value: number;
    duration?: number;
  };
}

export type GameStatus = 'playing' | 'completed';

export interface AnimationEvent {
  type: 'pulse' | 'flash';
  nodeId: string;
  startTime: number;
  duration: number;
}
