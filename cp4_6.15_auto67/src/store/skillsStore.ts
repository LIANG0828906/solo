import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { mockSkills, type Skill, type SkillCategory, type ExchangeRequestItem, type UserProfile } from '@/data/mockSkills';

interface SkillsState {
  skills: Skill[];
  filterCategory: SkillCategory | 'all';
  searchQuery: string;
  exchangeRequests: ExchangeRequestItem[];
  userProfile: UserProfile;
  appliedSkillIds: Set<string>;
  setFilterCategory: (category: SkillCategory | 'all') => void;
  setSearchQuery: (query: string) => void;
  addExchangeRequest: (skillId: string, reason: string, expectedTime: string) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  incrementSearchCount: (query: string) => void;
  removeSkill: (skillId: string) => void;
  getFilteredSkills: () => Skill[];
}

export const useSkillsStore = create<SkillsState>((set, get) => ({
  skills: mockSkills,
  filterCategory: 'all',
  searchQuery: '',
  exchangeRequests: [],
  userProfile: {
    username: '我',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Me',
    bio: '热爱学习新技能，乐于分享所学',
    points: 200,
  },
  appliedSkillIds: new Set<string>(),

  setFilterCategory: (category) => set({ filterCategory: category }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  addExchangeRequest: (skillId, reason, expectedTime) => {
    const id = uuidv4();
    const date = new Date().toLocaleDateString('zh-CN');
    const skill = get().skills.find((s) => s.id === skillId);
    const newRequest: ExchangeRequestItem = {
      id,
      skillId,
      reason,
      expectedTime,
      status: 'pending',
      date,
    };
    set((state) => ({
      exchangeRequests: [newRequest, ...state.exchangeRequests],
      appliedSkillIds: new Set([...state.appliedSkillIds, skillId]),
      userProfile: {
        ...state.userProfile,
        points: state.userProfile.points - (skill?.pointsCost ?? 0),
      },
    }));
  },

  updateProfile: (profile) =>
    set((state) => ({
      userProfile: { ...state.userProfile, ...profile },
    })),

  incrementSearchCount: (query) => {
    const q = query.toLowerCase().trim();
    if (!q) return;
    set((state) => {
      const matchedIds = new Set<string>();
      state.skills.forEach((s) => {
        if (
          s.title.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.username.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q)
        ) {
          matchedIds.add(s.id);
        }
      });
      if (matchedIds.size === 0) return {};
      return {
        skills: state.skills.map((s) =>
          matchedIds.has(s.id) ? { ...s, searchCount: s.searchCount + 1 } : s
        ),
      };
    });
  },

  removeSkill: (skillId) =>
    set((state) => ({
      skills: state.skills.filter((s) => s.id !== skillId),
    })),

  getFilteredSkills: () => {
    const { skills, filterCategory, searchQuery } = get();
    let filtered = skills;

    if (filterCategory !== 'all') {
      filtered = filtered.filter((s) => s.category === filterCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.username.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q)
      );
    }

    return filtered;
  },
}));
