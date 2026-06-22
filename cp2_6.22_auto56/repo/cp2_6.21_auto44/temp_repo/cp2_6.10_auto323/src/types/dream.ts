export type SymbolCategory = 'flying' | 'falling' | 'chasing' | 'lost' | 'water' | 'forest' | 'star' | 'rare';

export type SymbolRarity = 'common' | 'rare' | 'legendary';

export type SlotPosition = 'north' | 'south' | 'east' | 'west';

export interface DreamSymbol {
  id: string;
  name: string;
  emoji: string;
  category: SymbolCategory;
  rarity: SymbolRarity;
  description: string;
}

export interface DreamSlot {
  id: string;
  position: SlotPosition;
  symbol: DreamSymbol | null;
}

export interface EmotionIndex {
  excitement: number;
  anxiety: number;
  peace: number;
}

export interface DreamResult {
  id: string;
  date: string;
  symbols: DreamSymbol[];
  interpretation: string;
  emotion: EmotionIndex;
  illustrationUrl: string;
  isSuccess: boolean;
  starLit: boolean;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

export interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  totalDreams: number;
  emotionTrend: { date: string; emotion: EmotionIndex }[];
  symbolFrequency: { symbol: DreamSymbol; count: number }[];
  rareCollected: DreamSymbol[];
  achievements: Achievement[];
}
