export interface StoryChoice {
  id: string;
  text: string;
  nextNodeId: string | null;
}

export interface StoryNode {
  id: string;
  title: string;
  description: string;
  choices: [StoryChoice, StoryChoice];
}

export interface HistoryEntry {
  nodeId: string;
  choiceIndex: 0 | 1;
  choiceText: string;
  timestamp: number;
}
