export type TagCategory = 'tech' | 'design' | 'illustration';

export interface Tag {
  name: string;
  category: TagCategory;
}

export interface Work {
  id: string;
  title: string;
  coverUrl: string;
  description: string;
  tags: Tag[];
  createdAt: number;
  score: number;
  lastScoreUpdate: number;
}

export type ActionType = 'view' | 'click' | 'favorite' | 'unfavorite';

export interface UserAction {
  id: string;
  workId: string;
  actionType: ActionType;
  timestamp: number;
  duration?: number;
}

export interface WorksState {
  works: Work[];
  actions: UserAction[];
  favorites: Set<string>;
  sortedWorks: Work[];
  topRecommendations: Work[];
}

export interface AddWorkForm {
  title: string;
  coverUrl: string;
  description: string;
  tags: Tag[];
}
