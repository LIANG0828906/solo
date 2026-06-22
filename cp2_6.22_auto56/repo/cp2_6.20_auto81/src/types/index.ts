export interface Choice {
  id: string;
  text: string;
  next_node_id: string;
  condition?: Record<string, number | string>;
  effect?: Record<string, number>;
}

export interface StoryNode {
  id: string;
  text: string;
  choices: Choice[];
  end?: boolean;
  ending_type?: 'good' | 'bad' | 'neutral';
}

export interface Attributes {
  health: number;
  sanity: number;
  gold: number;
  charisma: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
}

export interface GameState {
  currentNodeId: string;
  attributes: Attributes;
  inventory: InventoryItem[];
  history: HistoryEntry[];
  isEnded: boolean;
}

export interface HistoryEntry {
  nodeId: string;
  choiceId?: string;
  timestamp: number;
}

export interface SaveData {
  id: string;
  timestamp: number;
  sceneSummary: string;
  state: GameState;
}

export interface StartStoryResponse {
  node: StoryNode;
  state: GameState;
}

export interface ChooseResponse {
  node: StoryNode;
  state: GameState;
}
