export type ContentType = 'text' | 'image' | 'drawing';

export interface Card {
  id: string;
  content: string;
  contentType: ContentType;
  x: number;
  y: number;
  width: number;
  height: number;
  folderId?: string;
  createdAt: string;
  updatedAt: string;
  color: string;
  isNew?: boolean;
}

export interface Folder {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface CanvasTransform {
  x: number;
  y: number;
  scale: number;
}

export interface SimilarityPair {
  cardId1: string;
  cardId2: string;
  similarity: number;
}

export interface StoreState {
  cards: Card[];
  folders: Folder[];
  selectedCardId: string | null;
  editingCardId: string | null;
  showKnowledgeNetwork: boolean;
  canvasTransform: CanvasTransform;
  showCreateModal: boolean;
  activeTab: ContentType;
  sidebarOpen: boolean;
}
