import { create } from 'zustand';
import { get, set } from 'idb-keyval';
import { worksManager } from '../modules/works/WorksManager';
import { voteManager } from '../modules/vote/VoteManager';
import { audioPlayer } from '../modules/audio/AudioPlayer';
import { STORAGE_KEYS } from '../utils/constants';
import type { Work, Vote, WorkStatus, AudioPlayerState, VoteStats } from '../types';

interface AppState {
  works: Work[];
  votes: Vote[];
  selectedWorkId: string | null;
  expandedMilestoneId: string | null;
  isLoading: boolean;
  filterStatus: WorkStatus | 'all';
  dateRange: { start: string | null; end: string | null };
  audioState: AudioPlayerState;
  initialized: boolean;

  initApp: () => Promise<void>;
  selectWork: (id: string | null) => void;
  setExpandedMilestone: (id: string | null) => void;
  setFilterStatus: (status: WorkStatus | 'all') => void;
  setDateRange: (range: { start: string | null; end: string | null }) => void;
  addVote: (workId: string, score: number, comment?: string) => Promise<void>;
  getVoteStats: (workId: string) => VoteStats;
  getFilteredWorks: () => Work[];
  setAudioState: (state: AudioPlayerState) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  works: [],
  votes: [],
  selectedWorkId: null,
  expandedMilestoneId: null,
  isLoading: true,
  filterStatus: 'all',
  dateRange: { start: null, end: null },
  audioState: {
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    currentWorkId: null,
    progress: 0,
  },
  initialized: false,

  initApp: async () => {
    try {
      set({ isLoading: true });

      await Promise.all([worksManager.loadFromStorage(), voteManager.loadFromStorage()]);

      const works = worksManager.getWorks();
      await voteManager.initializeSeedVotes(works);

      const votes = voteManager.getVotes();

      let lastWorkId: string | null = null;
      try {
        lastWorkId = await get<string | null>(STORAGE_KEYS.lastWorkId);
      } catch (e) {
        // ignore
      }

      if (!lastWorkId && works.length > 0) {
        lastWorkId = works[0].id;
      }

      worksManager.subscribe((updatedWorks) => {
        set({ works: updatedWorks });
      });

      voteManager.subscribe((updatedVotes) => {
        set({ votes: updatedVotes });
      });

      audioPlayer.subscribe((audioState) => {
        set({ audioState });
      });

      set({
        works,
        votes,
        selectedWorkId: lastWorkId,
        isLoading: false,
        initialized: true,
      });
    } catch (error) {
      console.error('Failed to initialize app:', error);
      set({ isLoading: false, initialized: true });
    }
  },

  selectWork: (id: string | null) => {
    set({ selectedWorkId: id, expandedMilestoneId: null });
    if (id) {
      set(STORAGE_KEYS.lastWorkId, id).catch(() => {});
    }
  },

  setExpandedMilestone: (id: string | null) => {
    set({ expandedMilestoneId: id });
  },

  setFilterStatus: (status: WorkStatus | 'all') => {
    set({ filterStatus: status });
  },

  setDateRange: (range: { start: string | null; end: string | null }) => {
    set({ dateRange: range });
  },

  addVote: async (workId: string, score: number, comment: string = '') => {
    await voteManager.addVote(workId, score, comment);
  },

  getVoteStats: (workId: string) => {
    return voteManager.getStatsForWork(workId);
  },

  getFilteredWorks: () => {
    const { filterStatus, dateRange } = get();
    return worksManager.filterWorks(filterStatus, dateRange);
  },

  setAudioState: (state: AudioPlayerState) => {
    set({ audioState: state });
  },
}));
