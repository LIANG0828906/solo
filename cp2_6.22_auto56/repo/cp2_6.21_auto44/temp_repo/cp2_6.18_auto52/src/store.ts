import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Poll, PollStatistics, VoteRecord } from '@/types';

interface PollStore {
  polls: Poll[];
  votedPolls: Record<string, string>;
  searchKeyword: string;
  createPoll: (title: string, optionTexts: string[], deadline: number) => void;
  vote: (pollId: string, optionId: string) => void;
  closePoll: (pollId: string) => void;
  setSearchKeyword: (keyword: string) => void;
  hasVoted: (pollId: string) => boolean;
  getSelectedOption: (pollId: string) => string | null;
  getStatistics: (pollId: string) => PollStatistics;
  getStats: (pollId: string) => PollStatistics;
  getFilteredPolls: () => Poll[];
}

function checkAndCloseExpired(polls: Poll[]): Poll[] {
  const now = Date.now();
  return polls.map((p) => {
    if (!p.isClosed && now >= p.deadline) {
      return { ...p, isClosed: true };
    }
    return p;
  });
}

export const usePollStore = create<PollStore>((set, get) => ({
  polls: [],
  votedPolls: {},
  searchKeyword: '',

  createPoll: (title, optionTexts, deadline) => {
    const options = optionTexts.map((text) => ({
      id: uuidv4(),
      text,
      votes: 0,
    }));
    const poll: Poll = {
      id: uuidv4(),
      title,
      options,
      createdAt: Date.now(),
      deadline,
      isClosed: false,
      votes: [],
    };
    set((state) => {
      const updated = checkAndCloseExpired([poll, ...state.polls]);
      return { polls: updated };
    });
  },

  vote: (pollId, optionId) => {
    set((state) => {
      const previousOptionId = state.votedPolls[pollId] ?? null;
      const now = Date.now();
      const updatedPolls = state.polls.map((poll) => {
        if (poll.id !== pollId) return poll;
        if (poll.isClosed) return poll;

        let updatedOptions = poll.options;
        let updatedVotes = poll.votes;

        if (previousOptionId) {
          updatedOptions = updatedOptions.map((opt) => {
            if (opt.id === previousOptionId) {
              return { ...opt, votes: Math.max(0, opt.votes - 1) };
            }
            return opt;
          });
          updatedVotes = updatedVotes.filter(
            (v) => v.optionId !== previousOptionId
          );
        }

        updatedOptions = updatedOptions.map((opt) => {
          if (opt.id === optionId) {
            return { ...opt, votes: opt.votes + 1 };
          }
          return opt;
        });

        const newVote: VoteRecord = { optionId, timestamp: now };
        updatedVotes = [...updatedVotes, newVote];

        return { ...poll, options: updatedOptions, votes: updatedVotes };
      });

      return {
        polls: checkAndCloseExpired(updatedPolls),
        votedPolls: { ...state.votedPolls, [pollId]: optionId },
      };
    });
  },

  closePoll: (pollId) => {
    set((state) => {
      const updated = state.polls.map((p) =>
        p.id === pollId ? { ...p, isClosed: true } : p
      );
      return { polls: updated };
    });
  },

  setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),

  hasVoted: (pollId) => {
    return pollId in get().votedPolls;
  },

  getSelectedOption: (pollId) => {
    return get().votedPolls[pollId] ?? null;
  },

  getStatistics: (pollId) => {
    const poll = get().polls.find((p) => p.id === pollId);
    if (!poll) {
      return { totalVotes: 0, optionStats: [], timelineData: [] };
    }

    const totalVotes = poll.votes.length;
    const optionStats = poll.options.map((opt) => ({
      optionId: opt.id,
      text: opt.text,
      votes: opt.votes,
      percentage: totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0,
    }));

    if (poll.votes.length === 0) {
      return { totalVotes: 0, optionStats, timelineData: [] };
    }

    const timeBuckets: Record<string, number> = {};
    const bucketSize = 5 * 60 * 1000;

    let cumulativeCount = 0;
    const sortedVotes = [...poll.votes].sort((a, b) => a.timestamp - b.timestamp);

    for (const v of sortedVotes) {
      const bucket = Math.floor((v.timestamp - poll.createdAt) / bucketSize) * bucketSize;
      cumulativeCount++;
      const label = formatBucketLabel(bucket);
      timeBuckets[label] = cumulativeCount;
    }

    const timelineData = Object.entries(timeBuckets).map(([time, votes]) => ({
      time,
      votes,
    }));

    return { totalVotes, optionStats, timelineData };
  },

  getStats: (pollId) => {
    return get().getStatistics(pollId);
  },

  getFilteredPolls: () => {
    const state = get();
    const keyword = state.searchKeyword.trim().toLowerCase();
    const closed = checkAndCloseExpired(state.polls);

    const active = closed.filter((p) => !p.isClosed);
    const expired = closed.filter((p) => p.isClosed);

    const sortByTime = (a: Poll, b: Poll) => b.createdAt - a.createdAt;

    if (!keyword) {
      return [...active.sort(sortByTime), ...expired.sort(sortByTime)];
    }

    const filterFn = (p: Poll) => p.title.toLowerCase().includes(keyword);
    return [
      ...active.filter(filterFn).sort(sortByTime),
      ...expired.filter(filterFn).sort(sortByTime),
    ];
  },
}));

function formatBucketLabel(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  if (totalMinutes < 60) {
    return `${totalMinutes}m`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins > 0 ? `${hours}h${mins}m` : `${hours}h`;
}
