import { create } from 'zustand';
import { get as idbGet, set as idbSet, del as idbDel, keys as idbKeys } from 'idb-keyval';
import { v4 as uuidv4 } from 'uuid';
import { Idea, Milestone, IdeaStatus, MAX_IDEAS, MAX_MILESTONES } from './types';

const SCHEMA_VERSION = 1;
const SCHEMA_VERSION_KEY = 'popupidea_schema_version';
const IDEAS_KEY = 'popupidea_ideas';
const LEGACY_KEYS = ['popupidea_ideas_v0', 'popupidea_state'];

const VALID_STATUSES: IdeaStatus[] = ['fresh', 'hatching', 'launched', 'abandoned'];
const VALID_PRIORITIES = ['high', 'medium', 'low'];

function isValidIdea(obj: unknown): obj is Idea {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    typeof o.title === 'string' &&
    typeof o.description === 'string' &&
    typeof o.creativeScore === 'number' &&
    typeof o.status === 'string' &&
    VALID_STATUSES.includes(o.status as IdeaStatus) &&
    Array.isArray(o.milestones) &&
    typeof o.createdAt === 'string' &&
    typeof o.updatedAt === 'string'
  );
}

function isValidMilestone(obj: unknown): obj is Milestone {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    typeof o.name === 'string' &&
    typeof o.description === 'string' &&
    typeof o.startDate === 'string' &&
    typeof o.endDate === 'string' &&
    typeof o.progress === 'number' &&
    typeof o.priority === 'string' &&
    VALID_PRIORITIES.includes(o.priority as string) &&
    typeof o.completed === 'boolean'
  );
}

function migrateIdeas(rawIdeas: unknown[]): { validIdeas: Idea[]; migrated: boolean } {
  let migrated = false;
  const validIdeas: Idea[] = [];
  const now = new Date().toISOString();

  for (let i = 0; i < rawIdeas.length; i++) {
    const raw = rawIdeas[i];
    if (!isValidIdea(raw)) {
      migrated = true;
      continue;
    }

    let idea = { ...raw };

    const validMilestones: Milestone[] = [];
    for (let j = 0; j < idea.milestones.length; j++) {
      const m = idea.milestones[j];
      if (isValidMilestone(m)) {
        let milestone = { ...m };
        if (milestone.progress < 0) {
          milestone.progress = 0;
          migrated = true;
        }
        if (milestone.progress > 100) {
          milestone.progress = 100;
          migrated = true;
        }
        if (milestone.completed && milestone.progress < 100) {
          milestone.progress = 100;
          migrated = true;
        }
        validMilestones.push(milestone);
      } else {
        migrated = true;
      }
    }
    if (validMilestones.length !== idea.milestones.length) {
      idea.milestones = validMilestones;
    }

    if (idea.creativeScore < 0) {
      idea.creativeScore = 0;
      migrated = true;
    }
    if (idea.creativeScore > 5) {
      idea.creativeScore = 5;
      migrated = true;
    }

    idea.milestones = idea.milestones.slice(0, MAX_MILESTONES);

    if (!idea.updatedAt) {
      idea.updatedAt = idea.createdAt || now;
      migrated = true;
    }

    validIdeas.push(idea);
  }

  return { validIdeas: validIdeas.slice(0, MAX_IDEAS), migrated };
}

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
  clearAllData: () => Promise<void>;

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
      for (const key of LEGACY_KEYS) {
        try {
          await idbDel(key);
        } catch {
          /* ignore */
        }
      }

      const storedVersion = await idbGet<number>(SCHEMA_VERSION_KEY);
      const storedIdeas = await idbGet<Idea[]>(IDEAS_KEY);

      if (storedVersion === undefined || storedVersion !== SCHEMA_VERSION) {
        console.log(
          `[PopUpIdea] Schema version mismatch (stored: ${storedVersion}, current: ${SCHEMA_VERSION}), migrating...`
        );
        if (storedVersion === undefined) {
          const allKeys = await idbKeys();
          for (const k of allKeys) {
            const keyStr = String(k);
            if (
              keyStr.startsWith('popupidea_') &&
              keyStr !== IDEAS_KEY &&
              keyStr !== SCHEMA_VERSION_KEY
            ) {
              try {
                await idbDel(k);
              } catch {
                /* ignore */
              }
            }
          }
        }
        await idbSet(SCHEMA_VERSION_KEY, SCHEMA_VERSION);
      }

      if (Array.isArray(storedIdeas)) {
        const { validIdeas, migrated } = migrateIdeas(storedIdeas);
        if (migrated) {
          console.log(`[PopUpIdea] Migrated ${validIdeas.length} ideas to schema v${SCHEMA_VERSION}`);
          set({ ideas: validIdeas, isLoaded: true });
          get().persistIdeas(validIdeas);
        } else {
          set({ ideas: validIdeas, isLoaded: true });
        }
      } else {
        if (storedIdeas !== undefined && storedIdeas !== null) {
          console.warn('[PopUpIdea] Invalid data format in IndexedDB, resetting to empty array');
          await idbDel(IDEAS_KEY);
        }
        await idbSet(SCHEMA_VERSION_KEY, SCHEMA_VERSION);
        set({ ideas: [], isLoaded: true });
      }
    } catch (e) {
      console.error('[PopUpIdea] loadIdeas: FAILED with error:', e);
      try {
        await idbDel(IDEAS_KEY);
        await idbSet(SCHEMA_VERSION_KEY, SCHEMA_VERSION);
      } catch {
        /* ignore */
      }
      set({ ideas: [], isLoaded: true });
    }
  },

  persistIdeas: async (ideas: Idea[]) => {
    try {
      await idbSet(IDEAS_KEY, ideas);
      await idbSet(SCHEMA_VERSION_KEY, SCHEMA_VERSION);
    } catch (e) {
      console.error('[PopUpIdea] persistIdeas: write FAILED:', e);
    }
  },

  clearAllData: async () => {
    try {
      const allKeys = await idbKeys();
      for (const k of allKeys) {
        if (String(k).startsWith('popupidea_')) {
          await idbDel(k);
        }
      }
      await idbSet(SCHEMA_VERSION_KEY, SCHEMA_VERSION);
      set({
        ideas: [],
        selectedIdeaId: null,
        isGanttOpen: false,
        isMobileDetailOpen: false,
        isSidebarOpen: false,
        isCelebrating: { show: false, milestoneName: '' },
      });
      console.log('[PopUpIdea] All data cleared successfully');
    } catch (e) {
      console.error('[PopUpIdea] Failed to clear data:', e);
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
