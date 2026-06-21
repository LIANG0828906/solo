import { create } from 'zustand';
import type { ScoreOutput, TechTag } from '../utils/scoreCalculator';

export interface IdeaProject {
  id: string;
  name: string;
  description: string;
  techTags: TechTag[];
  developmentMonths: number;
  targetUsers: number;
  initialFunding: number;
  scores: ScoreOutput;
  isFavorite: boolean;
  createdAt: number;
}

interface IdeaState {
  ideas: IdeaProject[];
  currentPreview: ScoreOutput | null;
  addIdea: (idea: Omit<IdeaProject, 'id' | 'createdAt' | 'isFavorite'>) => void;
  toggleFavorite: (id: string) => void;
  setCurrentPreview: (scores: ScoreOutput | null) => void;
}

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

export const useIdeaStore = create<IdeaState>((set) => ({
  ideas: [],
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
      ideas: state.ideas.map((idea) =>
        idea.id === id ? { ...idea, isFavorite: !idea.isFavorite } : idea
      ),
    })),

  setCurrentPreview: (scores) =>
    set({
      currentPreview: scores,
    }),
}));
