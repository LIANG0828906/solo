export interface Contributor {
  id: string;
  name: string;
  avatarColor: string;
}

export interface Paragraph {
  id: string;
  content: string;
  authorId: string;
  createdAt: number;
}

export interface Annotation {
  id: string;
  content: string;
  authorId: string;
  createdAt: number;
}

export interface Scene {
  id: string;
  title: string;
  description: string;
  ownerId: string;
  paragraphs: Paragraph[];
  annotations: Annotation[];
  order: number;
}

export interface Act {
  id: string;
  title: string;
  description: string;
  scenes: Scene[];
  order: number;
}

export interface StoryProject {
  id: string;
  title: string;
  description: string;
  acts: Act[];
  contributors: Contributor[];
}

export type RelationType = 'ally' | 'enemy' | 'lover' | 'stranger';

export interface Character {
  id: string;
  name: string;
  avatarColor: string;
  tags: string[];
}

export interface Relation {
  id: string;
  characterId1: string;
  characterId2: string;
  type: RelationType;
  description: string;
}

export interface CharacterPair {
  char1: string;
  char2: string;
  key: string;
}

export interface SceneMention {
  sceneId: string;
  sceneTitle: string;
  actId: string;
  actTitle: string;
  count: number;
  snippets: MentionSnippet[];
}

export interface MentionSnippet {
  id: string;
  content: string;
  timestamp: number;
  scenePath: string;
  isParagraph: boolean;
}

export interface ConflictData {
  pairKey: string;
  char1Name: string;
  char2Name: string;
  sceneMentions: SceneMention[];
  totalCount: number;
}
