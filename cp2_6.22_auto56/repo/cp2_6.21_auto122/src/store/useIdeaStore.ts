import { create } from 'zustand';
import type { ScoreOutput, TechTag } from '../utils/scoreCalculator';

export interface Idea {
  id: string;
  name: string;
  description: string;
  tags: TechTag[];
  devTime: number;
  userScale: number;
  budget: number;
  scores: ScoreOutput;
  isFavorite: boolean;
  createdAt: number;
}

interface IdeaState {
  ideas: Idea[];
  favorites: string[];
  currentPreview: ScoreOutput | null;
  addIdea: (idea: Omit<Idea, 'id' | 'createdAt' | 'isFavorite'>) => void;
  toggleFavorite: (id: string) => void;
  setCurrentPreview: (scores: ScoreOutput | null) => void;
}

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

export const useIdeaStore = create<IdeaState>((set) => ({
  ideas: [],
  favorites: [],
  currentPreview: null,

  addIdea: (ideaData) =>
    set((state) => ({
      ideas: [
        ...state.ideas,
        {
          ...ideaData,
          id: generateId(),
          isFavorite: false,
          createdAt: Date.now(),
        },
      ],
      currentPreview: ideaData.scores,
    })),

  toggleFavorite: (id) =>
    set((state) => ({
      ideas: state.ideas.map((idea: Idea) =>
        idea.id === id ? { ...idea, isFavorite: !idea.isFavorite } : idea
      ),
      favorites: state.favorites.includes(id)
        ? state.favorites.filter((fid: string) => fid !== id)
        : [...state.favorites, id],
    })),

  setCurrentPreview: (scores) =>
    set({
      currentPreview: scores,
    }),
}));
