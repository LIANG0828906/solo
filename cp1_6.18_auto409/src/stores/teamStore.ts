import { create } from 'zustand';
import type { TeamProgress } from '../types';

interface TeamState {
  teamProgress: TeamProgress | null;
  loading: boolean;
  error: string | null;
  fetchTeamProgress: () => Promise<void>;
  clearTeamProgress: () => void;
}

export const useTeamStore = create<TeamState>((set) => ({
  teamProgress: null,
  loading: false,
  error: null,

  fetchTeamProgress: async () => {
    set({ loading: true, error: null });

    try {
      const response = await fetch('/api/team/progress');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: TeamProgress = await response.json();
      set({ teamProgress: data, loading: false, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取团队进度失败';
      set({ loading: false, error: message });
    }
  },

  clearTeamProgress: () => {
    set({ teamProgress: null, loading: false, error: null });
  },
}));
