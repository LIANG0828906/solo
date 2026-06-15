import { create } from 'zustand';
import type { SkillNode, PathStage, LearningResource, StageStatus, PlanResponse } from '../types';
import { generatePlan as generatePlanApi } from '../utils/api';

interface SkillStoreState {
  skills: SkillNode[];
  selectedSkill: SkillNode | null;
  searchQuery: string;
  highlightedSkillId: string | null;
  favorites: string[];
  learningPath: PathStage[];
  targetJobId: string | null;
  isLoading: boolean;
  isPathGenerating: boolean;
  error: string | null;
  jobTitle: string;
  totalEstimatedHours: number;
  missingSkills: string[];
}

interface SkillStoreActions {
  setSkills: (skills: SkillNode[]) => void;
  updateProficiency: (skillId: string, proficiency: number) => void;
  toggleFavorite: (resourceId: string) => void;
  updateStageStatus: (stageId: string, status: StageStatus) => void;
  setSearchQuery: (query: string) => void;
  setHighlightedSkill: (skillId: string | null) => void;
  setTargetJob: (jobId: string | null) => void;
  generateLearningPath: (targetJobId: string) => Promise<void>;
  setSelectedSkill: (skill: SkillNode | null) => void;
  setError: (error: string | null) => void;
  resetStore: () => void;
  setIsLoading: (loading: boolean) => void;
  updateSkillResources: (skillId: string, resources: LearningResource[]) => void;
}

const initialState: SkillStoreState = {
  skills: [],
  selectedSkill: null,
  searchQuery: '',
  highlightedSkillId: null,
  favorites: [],
  learningPath: [],
  targetJobId: null,
  isLoading: false,
  isPathGenerating: false,
  error: null,
  jobTitle: '',
  totalEstimatedHours: 0,
  missingSkills: [],
};

export const useSkillStore = create<SkillStoreState & SkillStoreActions>((set, get) => ({
  ...initialState,

  setSkills: (skills: SkillNode[]) => {
    set({ skills });
  },

  updateProficiency: (skillId: string, proficiency: number) => {
    const clampedProficiency = Math.max(0, Math.min(100, proficiency));
    set((state) => ({
      skills: state.skills.map((skill) =>
        skill.id === skillId
          ? { ...skill, proficiency: clampedProficiency }
          : skill
      ),
    }));

    const currentTargetJob = get().targetJobId;
    if (currentTargetJob) {
      void get().generateLearningPath(currentTargetJob);
    }
  },

  toggleFavorite: (resourceId: string) => {
    set((state) => ({
      favorites: state.favorites.includes(resourceId)
        ? state.favorites.filter((id) => id !== resourceId)
        : [...state.favorites, resourceId],
    }));
  },

  updateStageStatus: (stageId: string, status: StageStatus) => {
    set((state) => ({
      learningPath: state.learningPath.map((stage) =>
        stage.id === stageId ? { ...stage, status } : stage
      ),
    }));
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  setHighlightedSkill: (skillId: string | null) => {
    set({ highlightedSkillId: skillId });
  },

  setTargetJob: (jobId: string | null) => {
    set({ targetJobId: jobId });
  },

  generateLearningPath: async (targetJobId: string) => {
    set({ isPathGenerating: true, error: null });

    try {
      const { skills } = get();
      const currentSkills = skills.map((skill) => ({
        skillId: skill.id,
        proficiency: skill.proficiency,
      }));

      const response: PlanResponse = await generatePlanApi({
        targetJobId,
        currentSkills,
      });

      set({
        learningPath: response.stages,
        jobTitle: response.jobTitle,
        totalEstimatedHours: response.totalEstimatedHours,
        missingSkills: response.missingSkills,
        targetJobId,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate learning path';
      set({ error: errorMessage });
    } finally {
      set({ isPathGenerating: false });
    }
  },

  setSelectedSkill: (skill: SkillNode | null) => {
    set({ selectedSkill: skill });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  resetStore: () => {
    set(initialState);
  },

  setIsLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  updateSkillResources: (skillId: string, resources: LearningResource[]) => {
    set((state) => ({
      learningPath: state.learningPath.map((stage) =>
        stage.skillId === skillId ? { ...stage, resources } : stage
      ),
    }));
  },
}));

export default useSkillStore;
