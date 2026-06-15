export type SceneType = 'initial' | 'objection' | 'negotiation' | 'closing' | 'followup' | 'custom';

export interface DialogueOption {
  id: string;
  text: string;
  keywords: string[];
  score: number;
  feedback: string;
  nextNodeId?: string;
  isOptimal?: boolean;
}

export interface DialogueNode {
  id: string;
  type: 'system' | 'user';
  text: string;
  options?: DialogueOption[];
  requiredKeywords?: string[];
  position?: { x: number; y: number };
}

export interface SceneEdge {
  id: string;
  from: string;
  to: string;
}

export interface Scene {
  id: string;
  name: string;
  description: string;
  type: SceneType;
  difficulty: number;
  startNodeId: string;
  nodes: Record<string, DialogueNode>;
  edges: SceneEdge[];
  isCustom?: boolean;
}

export interface RoundResult {
  nodeId: string;
  selectedOptionId: string;
  score: number;
  keywordMatch: number;
  matchedKeywords: string[];
  feedback: string;
  isOptimalPath: boolean;
}

export interface TrainingResult {
  sceneId: string;
  sceneName: string;
  sceneType: SceneType;
  totalScore: number;
  roundScores: RoundResult[];
  averageKeywordMatch: number;
  pathComplete: boolean;
  optimalPathCount: number;
  timestamp: number;
}

export interface TrainingReport {
  averageScore: number;
  totalTrainingCount: number;
  weaknessAnalysis: Record<SceneType, { count: number; avgScore: number }>;
  history: { date: string; score: number; sceneType: SceneType }[];
}

export interface EditorNode {
  id: string;
  x: number;
  y: number;
  data: DialogueNode;
}

export interface EditorEdge {
  id: string;
  source: string;
  target: string;
}
