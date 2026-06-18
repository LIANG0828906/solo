import { create } from 'zustand';
import type { RankingMember } from '../types';

interface RankingState {
  rankings: RankingMember[];
  loading: boolean;
  error: string | null;
  timeRange: number;
  setTimeRange: (days: number) => void;
  fetchRankings: (days?: number) => Promise<void>;
  clearRankings: () => void;
}

export const useRankingStore = create<RankingState>((set, get) => ({
  rankings: [],
  loading: false,
  error: null,
  timeRange: 7,

  setTimeRange: (days: number) => {
    set({ timeRange: days });
  },

  fetchRankings: async (days?: number) => {
    const targetDays = days ?? get().timeRange;
    const prevRankings = get().rankings;
    const prevRankMap = new Map<number, number>();
    prevRankings.forEach((member, index) => {
      prevRankMap.set(member.id, index + 1);
    });

    set({ loading: true, error: null });

    try {
      const response = await fetch(`/api/rankings?days=${targetDays}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: RankingMember[] = await response.json();

      const processedRankings = data.map((member, index) => {
        const currentRank = index + 1;
        const previousRank = prevRankMap.get(member.id);
        let rankChange: 'up' | 'down' | 'same' | undefined;

        if (previousRank !== undefined) {
          if (currentRank < previousRank) {
            rankChange = 'up';
          } else if (currentRank > previousRank) {
            rankChange = 'down';
          } else {
            rankChange = 'same';
          }
        }

        return {
          ...member,
          prev_rank: previousRank,
          rank_change: rankChange,
        };
      });

      set({ rankings: processedRankings, loading: false, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取排行榜数据失败';
      set({ loading: false, error: message });
    }
  },

  clearRankings: () => {
    set({ rankings: [], loading: false, error: null });
  },
}));
