export interface StoryParagraph {
  id: string;
  content: string;
  authorIndex: number;
  timestamp: number;
}

export type ShotType = '远景' | '全景' | '中景' | '近景' | '特写';

export interface StoryboardPanel {
  id: string;
  sceneNumber: number;
  shotType: ShotType;
  description: string;
  dialogue: string;
  sourceParagraphIndex: number;
}

export interface ExportMetadata {
  title: string;
  createdAt: string;
  participants: string[];
  panels: StoryboardPanel[];
}
