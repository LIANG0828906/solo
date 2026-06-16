export interface DreamEntry {
  id: string;
  text: string;
  date: string;
  emotionTag: string;
  emotionColor: string;
}

export interface SymbolData {
  name: string;
  emoji: string;
  category: 'nature' | 'architecture' | 'emotion' | 'action' | 'object';
  keywords: string[];
}

export interface SymbolMatch {
  symbolName: string;
  emoji: string;
  category: string;
  matchCount: number;
  contexts: string[];
}

export interface Connection {
  from: string;
  to: string;
  strength: number;
}

export interface IslandNode {
  symbolName: string;
  emoji: string;
  category: string;
  matchCount: number;
  x: number;
  y: number;
  radius: number;
  targetX: number;
  targetY: number;
}
