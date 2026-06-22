export type Speaker = 'player' | 'npc';

export type ExpressionType = 'default' | 'happy' | 'sad' | 'angry' | 'surprised';

export type ConditionType = 'affection' | 'time' | 'story';

export interface DialogueCondition {
  type: ConditionType;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'range';
  value: number | string;
  minValue?: number;
  maxValue?: number;
}

export interface DialogueNode {
  id: string;
  speaker: Speaker;
  text: string;
  expression?: ExpressionType;
  position: { x: number; y: number };
  branches: DialogueBranch[];
}

export interface DialogueBranch {
  id: string;
  targetNodeId: string;
  condition?: DialogueCondition;
  label: string;
}

export interface DialogueTree {
  nodes: DialogueNode[];
  startNodeId: string;
}

export interface GameState {
  affection: number;
  time: number;
  storyFlags: string[];
}

export interface SpriteFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CharacterSprite {
  characterId: string;
  image: HTMLImageElement | null;
  frames: Record<ExpressionType, SpriteFrame[]>;
  frameWidth: number;
  frameHeight: number;
  loaded: boolean;
  error: boolean;
}

export interface LoadingProgress {
  total: number;
  loaded: number;
  percentage: number;
  status: 'loading' | 'success' | 'error';
}

export interface DialogueRuntimeState {
  currentNodeId: string | null;
  displayedText: string;
  isTyping: boolean;
  availableBranches: DialogueBranch[];
  currentExpression: ExpressionType;
  currentSpeaker: Speaker | null;
}
