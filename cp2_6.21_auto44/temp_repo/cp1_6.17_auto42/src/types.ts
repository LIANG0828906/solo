export interface StoryNode {
  id: string;
  sceneId: string;
  text: string;
  sceneBgColor: string;
  sceneImage: string;
  options: StoryOption[];
  isEnd?: boolean;
  chapter: number;
}

export interface StoryOption {
  text: string;
  nextNodeId: string;
  score: number;
  type: "critical" | "normal" | "score";
}

export interface PlayerProfile {
  id: string;
  nickname: string;
  currentNodeId: string;
  score: number;
  startTime: number;
  decisions: Decision[];
  completed: boolean;
}

export interface Decision {
  nodeId: string;
  optionText: string;
  timestamp: number;
  score: number;
  type: "critical" | "normal" | "score";
}
