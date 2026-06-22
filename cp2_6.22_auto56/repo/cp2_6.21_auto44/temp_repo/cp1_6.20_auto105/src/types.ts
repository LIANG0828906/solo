export type CardAnimation = 'none' | 'slideLeft' | 'slideUp' | 'zoomFade';

export interface StoryboardCard {
  id: string;
  imageUrl: string;
  title: string;
  description: string;
  animation: CardAnimation;
}

export interface Storyboard {
  id: string;
  title: string;
  cover: string;
  cards: StoryboardCard[];
  musicUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export type Route =
  | { name: 'list' }
  | { name: 'editor'; id: string }
  | { name: 'viewer'; id: string };
