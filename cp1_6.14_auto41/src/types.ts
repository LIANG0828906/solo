export type Emotion = 'neutral' | 'angry' | 'happy';

export const EMOTION_COLORS: Record<Emotion, string> = {
  neutral: '#888888',
  angry: '#ef4444',
  happy: '#22c55e',
};

export const EMOTION_LABELS: Record<Emotion, string> = {
  neutral: '中性',
  angry: '愤怒',
  happy: '高兴',
};

export interface Character {
  id: string;
  name: string;
  avatar: string;
  defaultEmotion: Emotion;
}

export interface DialogueNode {
  id: string;
  characterId: string;
  text: string;
  emotion: Emotion;
  x: number;
  y: number;
  branchLabels: string[];
}

export interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
  sourcePort: number;
}

export interface DialogueTree {
  characters: Character[];
  nodes: DialogueNode[];
  connections: Connection[];
  rootNodeId: string | null;
}

export const NODE_WIDTH = 260;
export const NODE_HEIGHT = 200;
export const PORT_RADIUS = 8;
export const AVATAR_SIZE = 44;

export const DEFAULT_CHARACTERS: Character[] = [
  { id: 'char-1', name: '主角', avatar: '🧙', defaultEmotion: 'neutral' },
  { id: 'char-2', name: '勇者', avatar: '⚔️', defaultEmotion: 'neutral' },
  { id: 'char-3', name: '精灵', avatar: '🧝', defaultEmotion: 'happy' },
];

export const DEFAULT_NODES: DialogueNode[] = [
  {
    id: 'node-1',
    characterId: 'char-1',
    text: '欢迎来到奇幻世界！你准备好踏上冒险了吗？',
    emotion: 'neutral',
    x: 80,
    y: 80,
    branchLabels: ['接受挑战', '考虑一下', '拒绝邀请'],
  },
  {
    id: 'node-2',
    characterId: 'char-2',
    text: '我早已整装待发！让我们出发吧！',
    emotion: 'happy',
    x: 420,
    y: 40,
    branchLabels: [],
  },
  {
    id: 'node-3',
    characterId: 'char-2',
    text: '嗯……让我再想想，还需要准备些东西。',
    emotion: 'neutral',
    x: 420,
    y: 280,
    branchLabels: ['准备好了', '再等等'],
  },
  {
    id: 'node-4',
    characterId: 'char-3',
    text: '真遗憾，不过随时欢迎你改变主意。',
    emotion: 'angry',
    x: 420,
    y: 520,
    branchLabels: [],
  },
  {
    id: 'node-5',
    characterId: 'char-1',
    text: '好！那我们立即前往迷雾森林！',
    emotion: 'happy',
    x: 780,
    y: 40,
    branchLabels: [],
  },
];

export const DEFAULT_CONNECTIONS: Connection[] = [
  { id: 'conn-1', sourceId: 'node-1', targetId: 'node-2', sourcePort: 0 },
  { id: 'conn-2', sourceId: 'node-1', targetId: 'node-3', sourcePort: 1 },
  { id: 'conn-3', sourceId: 'node-1', targetId: 'node-4', sourcePort: 2 },
  { id: 'conn-4', sourceId: 'node-2', targetId: 'node-5', sourcePort: 0 },
];

export const DEFAULT_TREE: DialogueTree = {
  characters: DEFAULT_CHARACTERS,
  nodes: DEFAULT_NODES,
  connections: DEFAULT_CONNECTIONS,
  rootNodeId: 'node-1',
};

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
