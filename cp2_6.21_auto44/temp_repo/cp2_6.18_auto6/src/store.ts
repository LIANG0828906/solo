import { create } from 'zustand';
import { createVoteSlice, VoteSlice } from './modules/投票模块/voteSlice';
import { createStatsSlice, StatsSlice } from './modules/统计模块/statsSlice';

export type AppState = VoteSlice & StatsSlice;

export const useAppStore = create<AppState>()((...a) => ({
  ...createVoteSlice(...a),
  ...createStatsSlice(...a),
}));
