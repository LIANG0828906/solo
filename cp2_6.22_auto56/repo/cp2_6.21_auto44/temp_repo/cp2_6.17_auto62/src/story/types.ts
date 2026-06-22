export interface StoryChoice {
  id: string;
  text: string;
  nextNodeId: string;
}

export interface StoryNode {
  id: string;
  title: string;
  description: string;
  choices: [StoryChoice, StoryChoice];
  isEnding?: boolean;
}

export interface HistoryNode {
  nodeId: string;
  choiceId?: string;
  choiceText?: string;
  timestamp: number;
  depth: number;
  parentIndex: number | null;
}

export type ChoiceDirection = 'left' | 'right';
