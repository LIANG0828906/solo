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
    o.id.length > 0 &&
    typeof o.title === 'string' &&
    o.title.length > 0 &&
    typeof o.description === 'string' &&
    typeof o.creativeScore === 'number' &&
    o.creativeScore >= 0 &&
    o.creativeScore <= 5 &&
    typeof o.status === 'string' &&
    VALID_STATUSES.includes(o.status as IdeaStatus) &&
    Array.isArray(o.milestones) &&
    typeof o.createdAt === 'string' &&
    o.createdAt.length > 0 &&
    typeof o.updatedAt === 'string' &&
    o.updatedAt.length > 0
  );
}

function isValidMilestone(obj: unknown): obj is Milestone {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    o.id.length > 0 &&
    typeof o.name === 'string' &&
    o.name.length > 0 &&
    typeof o.description === 'string' &&
    typeof o.startDate === 'string' &&
    o.startDate.length > 0 &&
    typeof o.endDate === 'string' &&
    o.endDate.length > 0 &&
    typeof o.progress === 'number' &&
    o.progress >= 0 &&
    o.progress <= 100 &&
    typeof o.priority === 'string' &&
    VALID_PRIORITIES.includes(o.priority as string) &&
    typeof o.completed === 'boolean'
  );
}

function migrateIdeas(rawIdeas: unknown[]): { validIdeas: Idea[]; migrated: boolean } {
  let migrated = rawIdeas.length > 0;
  const validIdeas: Idea[] = [];
  const now = new Date().toISOString();
  const todayISO = now.split('T')[0];
  const nextWeekISO = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  for (let i = 0; i < rawIdeas.length; i++) {
    const raw = rawIdeas[i];
    if (!raw || typeof raw !== 'object') {
      migrated = true;
      continue;
    }

    const o = raw as Record<string, unknown>;

    const idea: Idea = {
      id: typeof o.id === 'string' && o.id.length > 0 ? o.id : uuidv4(),
      title: typeof o.title === 'string' && o.title.length > 0 ? o.title : '未命名灵感',
      description: typeof o.description === 'string' ? o.description : '',
      creativeScore: typeof o.creativeScore === 'number' ? Math.max(0, Math.min(5, Math.floor(o.creativeScore))) : 0,
      status:
        typeof o.status === 'string' && VALID_STATUSES.includes(o.status as IdeaStatus)
          ? (o.status as IdeaStatus)
          : 'fresh',
      milestones: [],
      createdAt: typeof o.createdAt === 'string' ? o.createdAt : now,
      updatedAt: typeof o.updatedAt === 'string' ? o.updatedAt : now,
    };

    if (o.id !== idea.id) migrated = true;
    if (o.title !== idea.title) migrated = true;
    if (o.description !== idea.description) migrated = true;
    if (o.creativeScore !== idea.creativeScore) migrated = true;
    if (o.status !== idea.status) migrated = true;
    if (!o.createdAt) migrated = true;
    if (!o.updatedAt) migrated = true;

    const rawMilestones = Array.isArray(o.milestones) ? o.milestones : [];
    for (let j = 0; j < rawMilestones.length; j++) {
      const mRaw = rawMilestones[j];
      if (!mRaw || typeof mRaw !== 'object') {
        migrated = true;
        continue;
      }
      const m = mRaw as Record<string, unknown>;

      let startDate = typeof m.startDate === 'string' ? m.startDate : todayISO;
      let endDate = typeof m.endDate === 'string' ? m.endDate : nextWeekISO;
      try {
        if (new Date(startDate).toString() === 'Invalid Date') startDate = todayISO;
        if (new Date(endDate).toString() === 'Invalid Date') endDate = nextWeekISO;
        if (new Date(startDate) > new Date(endDate)) {
          endDate = startDate;
          migrated = true;
        }
      } catch {
        startDate = todayISO;
        endDate = nextWeekISO;
      }

      let progress = typeof m.progress === 'number' ? Math.floor(m.progress) : 0;
      if (progress < 0) progress = 0;
      if (progress > 100) progress = 100;

      const completed = typeof m.completed === 'boolean' ? m.completed : progress >= 100;
      if (completed && progress < 100) progress = 100;

      const priority =
        typeof m.priority === 'string' && VALID_PRIORITIES.includes(m.priority)
          ? (m.priority as 'high' | 'medium' | 'low')
          : 'medium';

      const milestone: Milestone = {
        id: typeof m.id === 'string' && m.id.length > 0 ? m.id : uuidv4(),
        name: typeof m.name === 'string' && m.name.length > 0 ? m.name : `里程碑 ${j + 1}`,
        description: typeof m.description === 'string' ? m.description : '',
        startDate,
        endDate,
        progress,
        priority,
        completed,
      };

      if (m.id !== milestone.id) migrated = true;
      if (m.name !== milestone.name) migrated = true;
      if (m.description !== milestone.description) migrated = true;
      if (m.startDate !== milestone.startDate) migrated = true;
      if (m.endDate !== milestone.endDate) migrated = true;
      if (m.progress !== milestone.progress) migrated = true;
      if (m.priority !== milestone.priority) migrated = true;
      if (m.completed !== milestone.completed) migrated = true;

      idea.milestones.push(milestone);
    }

    idea.milestones = idea.milestones.slice(0, MAX_MILESTONES);
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
