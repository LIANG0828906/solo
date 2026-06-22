export type Faction = 'protagonist' | 'deuteragonist' | 'antagonist';

export type RelationStyle = 'solid' | 'dashed';

export interface InventoryItem {
  id: string;
  name: string;
  icon: string;
}

export interface Character {
  id: string;
  name: string;
  age: number;
  avatar: string;
  appearance: string;
  personality: string[];
  background: string;
  faction: Faction;
  inventory: InventoryItem[];
  stats: number;
}

export interface Relation {
  id: string;
  sourceId: string;
  targetId: string;
  type: string;
  style: RelationStyle;
}

export interface GraphNode {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx?: number | null;
  fy?: number | null;
  character: Character;
  radius: number;
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  relation: Relation;
}

export interface HistoryState {
  characters: Character[];
  relations: Relation[];
}

export const RELATION_TYPES = [
  { type: '朋友', style: 'solid' as RelationStyle },
  { type: '敌人', style: 'dashed' as RelationStyle },
  { type: '恋人', style: 'solid' as RelationStyle },
  { type: '师徒', style: 'solid' as RelationStyle },
  { type: '兄弟', style: 'solid' as RelationStyle },
  { type: '仇敌', style: 'dashed' as RelationStyle },
  { type: '同事', style: 'solid' as RelationStyle },
  { type: '家人', style: 'solid' as RelationStyle },
];

export const FACTION_COLORS: Record<Faction, string> = {
  protagonist: '#00B894',
  deuteragonist: '#FDCB6E',
  antagonist: '#FF6B6B',
};

export const FACTION_LABELS: Record<Faction, string> = {
  protagonist: '主角',
  deuteragonist: '副角',
  antagonist: '反派',
};

export const MAX_INVENTORY_SIZE = 10;
export const MAX_HISTORY_SIZE = 50;
