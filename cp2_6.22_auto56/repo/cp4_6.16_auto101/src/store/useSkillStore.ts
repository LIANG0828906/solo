import { create } from 'zustand';
import type { Skill, SkillCategory } from '../types';
import { SkillModule } from '../modules/skill/SkillModule';

interface SkillState {
  skills: Skill[];
  isLoading: boolean;
  error: string | null;
  searchKeyword: string;
  searchCache: Record<string, Skill[]>;

  loadSkills: () => Promise<void>;
  createSkill: (
    userId: string,
    data: Omit<Skill, 'id' | 'userId' | 'createdAt'>
  ) => Promise<Skill>;
  getSkillById: (skillId: string) => Skill | null;
  getUserSkills: (userId: string) => Skill[];
  getSkillsByCategory: (category: SkillCategory) => Skill[];
  searchSkills: (keyword: string) => Promise<Skill[]>;
  setSearchKeyword: (keyword: string) => void;
  deleteSkill: (skillId: string) => Promise<void>;
  getSkillsByCategories: () => Record<SkillCategory, Skill[]>;
}

export const useSkillStore = create<SkillState>((set, get) => ({
  skills: [],
  isLoading: false,
  error: null,
  searchKeyword: '',
  searchCache: {},

  loadSkills: async () => {
    set({ isLoading: true });
    try {
      const skills = await SkillModule.getAllSkills();
      set({ skills, searchCache: {} });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  createSkill: async (userId, data) => {
    set({ isLoading: true });
    try {
      const skill = await SkillModule.createSkill(userId, data);
      const skills = await SkillModule.getAllSkills();
      set({ skills, searchCache: {} });
      return skill;
    } finally {
      set({ isLoading: false });
    }
  },

  getSkillById: (skillId: string) => {
    const { skills } = get();
    return skills.find((s) => s.id === skillId) || null;
  },

  getUserSkills: (userId: string) => {
    const { skills } = get();
    return skills
      .filter((s) => s.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  getSkillsByCategory: (category: SkillCategory) => {
    const { skills } = get();
    return skills
      .filter((s) => s.category === category)
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  searchSkills: async (keyword: string) => {
    const { searchCache } = get();
    const cacheKey = keyword.toLowerCase().trim();

    if (searchCache[cacheKey]) {
      return searchCache[cacheKey];
    }

    const results = await SkillModule.searchSkills(keyword);
    set((state) => ({
      searchCache: {
        ...state.searchCache,
        [cacheKey]: results,
      },
    }));
    return results;
  },

  setSearchKeyword: (keyword: string) => {
    set({ searchKeyword: keyword });
  },

  deleteSkill: async (skillId: string) => {
    await SkillModule.deleteSkill(skillId);
    const skills = await SkillModule.getAllSkills();
    set({ skills, searchCache: {} });
  },

  getSkillsByCategories: () => {
    const { skills } = get();
    const categories: Record<SkillCategory, Skill[]> = {
      programming: [],
      design: [],
      language: [],
      other: [],
    };

    for (const skill of skills) {
      categories[skill.category].push(skill);
    }

    for (const cat of Object.keys(categories) as SkillCategory[]) {
      categories[cat].sort((a, b) => b.createdAt - a.createdAt);
    }

    return categories;
  },
}));
