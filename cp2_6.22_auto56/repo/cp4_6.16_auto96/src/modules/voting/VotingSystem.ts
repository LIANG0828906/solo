import { useAppStore } from '@/store/useAppStore';
import { generateId } from '@/utils/helpers';
import type { Poll, PollOption, Vote, Member } from '@/types';

export const VotingSystem = {
  getPollsByClub(clubId: string): Poll[] {
    return useAppStore.getState().polls
      .filter(p => p.clubId === clubId)
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  getActivePoll(clubId: string): Poll | undefined {
    return useAppStore.getState().polls.find(
      p => p.clubId === clubId && p.status === 'active'
    );
  },

  getPollById(pollId: string): Poll | undefined {
    return useAppStore.getState().polls.find(p => p.id === pollId);
  },

  hasUserVoted(pollId: string, memberId: string): boolean {
    return useAppStore.getState().votes.some(
      v => v.pollId === pollId && v.memberId === memberId
    );
  },

  getUserVote(pollId: string, memberId: string): Vote | undefined {
    return useAppStore.getState().votes.find(
      v => v.pollId === pollId && v.memberId === memberId
    );
  },

  createPoll(
    clubId: string,
    memberId: string,
    title: string,
    options: { bookTitle: string; description: string }[],
    durationHours: number = 72
  ): Poll | null {
    const state = useAppStore.getState();
    const member = state.members.find(m => m.id === memberId);

    if (!member || !member.isHost) {
      state.addToast('只有发起人可以创建投票', 'warning');
      return null;
    }

    if (options.length < 3 || options.length > 6) {
      state.addToast('候选书籍需在3-6本之间', 'warning');
      return null;
    }

    const pollOptions: PollOption[] = options.map((opt, index) => ({
      id: generateId(),
      bookTitle: opt.bookTitle,
      description: opt.description,
      voteCount: 0,
      colorIndex: index,
    }));

    const poll: Poll = {
      id: generateId(),
      clubId,
      title,
      options: pollOptions,
      status: 'active',
      createdBy: memberId,
      createdAt: Date.now(),
      endsAt: Date.now() + durationHours * 60 * 60 * 1000,
    };

    state.addPoll(poll);
    state.addToast('投票创建成功！', 'success');

    return poll;
  },

  submitVote(pollId: string, memberId: string, optionId: string): Vote | null {
    const state = useAppStore.getState();
    const poll = state.polls.find(p => p.id === pollId);

    if (!poll) {
      state.addToast('投票不存在', 'warning');
      return null;
    }

    if (poll.status !== 'active') {
      state.addToast('投票已结束', 'warning');
      return null;
    }

    const hasVoted = state.votes.some(
      v => v.pollId === pollId && v.memberId === memberId
    );

    if (hasVoted) {
      state.addToast('你已经投过票了', 'warning');
      return null;
    }

    const option = poll.options.find(o => o.id === optionId);
    if (!option) {
      state.addToast('选项不存在', 'warning');
      return null;
    }

    const vote: Vote = {
      id: generateId(),
      pollId,
      memberId,
      optionId,
      votedAt: Date.now(),
    };

    state.addVote(vote, optionId, pollId);
    state.addToast('投票成功！', 'success');

    return vote;
  },

  endPoll(pollId: string): Poll | null {
    const state = useAppStore.getState();
    const poll = state.polls.find(p => p.id === pollId);

    if (!poll) return null;

    const updatedPoll: Poll = { ...poll, status: 'ended' };
    state.updatePoll(updatedPoll);

    return updatedPoll;
  },

  getSortedOptions(pollId: string): PollOption[] {
    const poll = this.getPollById(pollId);
    if (!poll) return [];

    return [...poll.options].sort((a, b) => b.voteCount - a.voteCount);
  },

  getWinner(pollId: string): PollOption | null {
    const sorted = this.getSortedOptions(pollId);
    if (sorted.length === 0 || sorted[0].voteCount === 0) return null;
    return sorted[0];
  },

  getTotalVotes(pollId: string): number {
    const poll = this.getPollById(pollId);
    if (!poll) return 0;
    return poll.options.reduce((sum, opt) => sum + opt.voteCount, 0);
  },

  getMemberVoteCount(memberId: string): number {
    return useAppStore.getState().votes.filter(v => v.memberId === memberId).length;
  },
};
