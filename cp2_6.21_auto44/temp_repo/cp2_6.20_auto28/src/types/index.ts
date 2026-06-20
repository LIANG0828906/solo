export interface Dialogue {
  id: string;
  characterId: string;
  text: string;
}

export interface StoryNode {
  id: string;
  title: string;
  description: string;
  dialogues: Dialogue[];
  position: { x: number; y: number };
  createdAt: number;
  updatedAt: number;
}

export interface BranchCondition {
  type: 'read_node' | 'has_item';
  targetNodeId?: string;
  itemId?: string;
  itemName?: string;
}

export interface StoryEdge {
  id: string;
  sourceId: string;
  targetId: string;
  condition: BranchCondition;
  createdAt: number;
}

export interface Character {
  id: string;
  name: string;
  avatar: string;
  color: string;
}

export type RelationType = 'ally' | 'enemy' | 'lover' | 'unknown';

export interface CharacterRelation {
  id: string;
  sourceId: string;
  targetId: string;
  type: RelationType;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  color: string;
}

export interface StoryVersion {
  id: string;
  version: number;
  createdAt: number;
  creator: User;
  nodes: StoryNode[];
  edges: StoryEdge[];
  characters: Character[];
  relations: CharacterRelation[];
}

export interface CollaboratorCursor {
  userId: string;
  userName: string;
  color: string;
  x: number;
  y: number;
}

export interface SimulationResult {
  path: string[];
  choices: { nodeId: string; choice: string; edgeId: string }[];
  summary: string;
}

export type RightPanelTab = 'graph' | 'simulator' | 'versions';

export type WSMessage =
  | { type: 'node:update'; payload: StoryNode }
  | { type: 'node:create'; payload: StoryNode }
  | { type: 'node:delete'; payload: { id: string } }
  | { type: 'edge:create'; payload: StoryEdge }
  | { type: 'edge:update'; payload: StoryEdge }
  | { type: 'edge:delete'; payload: { id: string } }
  | { type: 'cursor:move'; payload: CollaboratorCursor }
  | { type: 'character:update'; payload: Character }
  | { type: 'character:create'; payload: Character }
  | { type: 'relation:create'; payload: CharacterRelation }
  | { type: 'relation:update'; payload: CharacterRelation };

export interface VersionDiff {
  addedNodes: string[];
  removedNodes: string[];
  modifiedNodes: string[];
  addedEdges: string[];
  removedEdges: string[];
}
