import { create } from 'zustand';
import { get as idbGet, set as idbSet } from 'idb-keyval';
import { v4 as uuidv4 } from 'uuid';
import { Idea, Milestone, IdeaStatus, MAX_IDEAS, MAX_MILESTONES } from './types';

interface CelebrationState {
  show: boolean;
  milestoneName: string;
}

interface IdeaStore {
  ideas: Idea[];
  selectedIdeaId: string | null;
  isSidebarOpen: boolean;
  isGanttOpen: boolean;
  isMobileDetailOpen: boolean;
  isCelebrating: CelebrationState;
  isLoaded: boolean;

  loadIdeas: () => Promise<void>;
  persistIdeas: (ideas: Idea[]) => Promise<void>;

  addIdea: (title: string, description: string) => boolean;
  updateIdea: (id: string, updates: Partial<Idea>) => void;
  deleteIdea: (id: string) => void;
  selectIdea: (id: string | null) => void;
  updateCreativeScore: (id: string, score: number) => void;
  updateStatus: (id: string, status: IdeaStatus) => void;

  addMilestone: (ideaId: string, milestone: Omit<Milestone, 'id'>) => boolean;
  updateMilestone: (ideaId: string, milestoneId: string, updates: Partial<Milestone>) => void;
  deleteMilestone: (ideaId: string, milestoneId: string) => void;
  toggleMilestoneComplete: (ideaId: string, milestoneId: string) => void;

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleGantt: () => void;
  setGanttOpen: (open: boolean) => void;
  setMobileDetailOpen: (open: boolean) => void;
  setCelebrating: (state: CelebrationState) => void;
}

export const useIdeaStore = create<IdeaStore>((set, get) => ({
  ideas: [],
  selectedIdeaId: null,
  isSidebarOpen: false,
  isGanttOpen: false,
  isMobileDetailOpen: false,
  isCelebrating: { show: false, milestoneName: '' },
  isLoaded: false,

  loadIdeas: async () => {
    try {
      const storedIdeas = await idbGet<Idea[]>('popupidea_ideas');
      if (Array.isArray(storedIdeas)) {
        set({ ideas: storedIdeas, isLoaded: true });
      } else {
        if (storedIdeas !== undefined && storedIdeas !== null) {
          console.warn('Invalid data in IndexedDB, resetting...');
        }
        set({ ideas: [], isLoaded: true });
      }
    } catch (e) {
      console.error('Failed to load ideas from IndexedDB:', e);
      set({ ideas: [], isLoaded: true });
    }
  },

  persistIdeas: async (ideas: Idea[]) => {
    try {
      await idbSet('popupidea_ideas', ideas);
    } catch (e) {
      console.error('Failed to persist ideas to IndexedDB:', e);
    }
  },

  addIdea: (title: string, description: string) => {
    const state = get();
    if (state.ideas.length >= MAX_IDEAS) return false;

    const now = new Date().toISOString();
    const newIdea: Idea = {
      id: uuidv4(),
      title,
      description,
      creativeScore: 0,
      status: 'fresh',
      milestones: [],
      createdAt: now,
      updatedAt: now,
    };

    const newIdeas = [newIdea, ...state.ideas];
    set({ ideas: newIdeas });
    state.persistIdeas(newIdeas);
    return true;
  },

  updateIdea: (id: string, updates: Partial<Idea>) => {
    const state = get();
    const newIdeas = state.ideas.map((idea) =>
      idea.id === id
        ? { ...idea, ...updates, updatedAt: new Date().toISOString() }
        : idea
    );
    set({ ideas: newIdeas });
    state.persistIdeas(newIdeas);
  },

  deleteIdea: (id: string) => {
    const state = get();
    const newIdeas = state.ideas.filter((idea) => idea.id !== id);
    set({
      ideas: newIdeas,
      selectedIdeaId: state.selectedIdeaId === id ? null : state.selectedIdeaId,
    });
    state.persistIdeas(newIdeas);
  },

  selectIdea: (id: string | null) => {
    set({ selectedIdeaId: id, isMobileDetailOpen: id !== null });
  },

  updateCreativeScore: (id: string, score: number) => {
    get().updateIdea(id, { creativeScore: score });
  },

  updateStatus: (id: string, status: IdeaStatus) => {
    get().updateIdea(id, { status });
  },

  addMilestone: (ideaId: string, milestone: Omit<Milestone, 'id'>) => {
    const state = get();
    const idea = state.ideas.find((i) => i.id === ideaId);
    if (!idea || idea.milestones.length >= MAX_MILESTONES) return false;

    const newMilestone: Milestone = {
      ...milestone,
      id: uuidv4(),
    };

    const newIdeas = state.ideas.map((i) =>
      i.id === ideaId
        ? {
            ...i,
            milestones: [...i.milestones, newMilestone],
            updatedAt: new Date().toISOString(),
          }
        : i
    );
    set({ ideas: newIdeas });
    state.persistIdeas(newIdeas);
    return true;
  },

  updateMilestone: (ideaId: string, milestoneId: string, updates: Partial<Milestone>) => {
    const state = get();
    const newIdeas = state.ideas.map((i) =>
      i.id === ideaId
        ? {
            ...i,
            milestones: i.milestones.map((m) =>
              m.id === milestoneId ? { ...m, ...updates } : m
            ),
            updatedAt: new Date().toISOString(),
          }
        : i
    );
    set({ ideas: newIdeas });
    state.persistIdeas(newIdeas);
  },

  deleteMilestone: (ideaId: string, milestoneId: string) => {
    const state = get();
    const newIdeas = state.ideas.map((i) =>
      i.id === ideaId
        ? {
            ...i,
            milestones: i.milestones.filter((m) => m.id !== milestoneId),
            updatedAt: new Date().toISOString(),
          }
        : i
    );
    set({ ideas: newIdeas });
    state.persistIdeas(newIdeas);
  },

  toggleMilestoneComplete: (ideaId: string, milestoneId: string) => {
    const state = get();
    const idea = state.ideas.find((i) => i.id === ideaId);
    const milestone = idea?.milestones.find((m) => m.id === milestoneId);

    if (milestone && !milestone.completed) {
      state.setCelebrating({ show: true, milestoneName: milestone.name });
      setTimeout(() => {
        state.setCelebrating({ show: false, milestoneName: '' });
      }, 2000);
    }

    state.updateMilestone(ideaId, milestoneId, {
      completed: milestone ? !milestone.completed : true,
      progress: milestone && !milestone.completed ? 100 : milestone?.progress || 0,
    });
  },

  toggleSidebar: () => {
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen }));
  },

  setSidebarOpen: (open: boolean) => {
    set({ isSidebarOpen: open });
  },

  toggleGantt: () => {
    set((state) => ({ isGanttOpen: !state.isGanttOpen }));
  },

  setGanttOpen: (open: boolean) => {
    set({ isGanttOpen: open });
  },

  setMobileDetailOpen: (open: boolean) => {
    set({ isMobileDetailOpen: open });
  },

  setCelebrating: (celebrationState: CelebrationState) => {
    set({ isCelebrating: celebrationState });
  },
}));
