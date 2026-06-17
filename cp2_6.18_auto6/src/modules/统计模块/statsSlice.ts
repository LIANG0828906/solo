import { StateCreator } from 'zustand';
import type { Vote } from '../../types';
import type { VoteSlice } from '../投票模块/voteSlice';

const COLORS = ['#6C63FF', '#FF6584', '#4ECDC4', '#FFD93D', '#6BCB77'];

export interface VoteStats {
  id: string;
  title: string;
  totalVotes: number;
  options: { name: string; value: number; color: string }[];
}

export interface StatsSlice {
  getVoteStats: () => VoteStats[];
  getTotalVotesCount: () => number;
}

export const createStatsSlice: StateCreator<
  StatsSlice,
  [],
  [],
  StatsSlice & VoteSlice
> = (_set, get) => ({
  getVoteStats: (): VoteStats[] => {
    const votes = get().votes;
    return votes.map((vote, index) => {
      const totalVotes = vote.options.reduce((sum, o) => sum + o.votes, 0);
      const options = vote.options.map((opt, optIndex) => ({
        name: opt.text,
        value: opt.votes,
        color: COLORS[(index + optIndex) % COLORS.length],
      }));
      return {
        id: vote.id,
        title: vote.title,
        totalVotes,
        options,
      };
    });
  },

  getTotalVotesCount: (): number => {
    const votes = get().votes;
    return votes.reduce(
      (total, vote) => total + vote.options.reduce((sum, o) => sum + o.votes, 0),
      0
    );
  },
});
