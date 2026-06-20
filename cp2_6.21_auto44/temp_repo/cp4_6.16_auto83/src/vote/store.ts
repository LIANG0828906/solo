import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { get, set } from 'idb-keyval';
import type { Vote, Option, VoteRecord, VoteResult, IconType } from './types';

interface VoteState {
  currentVote: Vote | null;
  currentUserId: string;
  currentUserName: string;
  allVotes: Map<string, Vote>;
  hasVoted: boolean;
  votedOptionId: string | null;

  generateInviteCode: () => string;
  createVote: (title: string, description: string, optionsData: Array<{ text: string; color: string; icon: IconType }>) => Vote;
  joinVote: (inviteCode: string) => Vote | null;
  findVoteByCode: (inviteCode: string) => Vote | null;
  castVote: (optionId: string) => void;
  endVote: () => void;
  getResult: () => VoteResult;
  setCurrentVote: (vote: Vote | null) => void;
  setUserName: (name: string) => void;
  syncVoteFromBroadcast: (vote: Vote) => void;
  saveVoteToDB: () => Promise<void>;
  loadVoteFromDB: (inviteCode: string) => Promise<Vote | null>;
  loadAllVotesFromDB: () => Promise<void>;
  broadcastChannel: BroadcastChannel | null;
  initBroadcastChannel: (inviteCode: string) => void;
  closeBroadcastChannel: () => void;
}

const generateUserId = () => {
  let id = localStorage.getItem('voteCanvas_userId');
  if (!id) {
    id = uuidv4();
    localStorage.setItem('voteCanvas_userId', id);
  }
  return id;
};

const generateUserName = () => {
  const names = ['用户小明', '画画达人', '创意家', '观察者', '参与者', '艺术家'];
  return localStorage.getItem('voteCanvas_userName') || names[Math.floor(Math.random() * names.length)];
};

export const useVoteStore = create<VoteState>((set, get) => ({
  currentVote: null,
  currentUserId: generateUserId(),
  currentUserName: generateUserName(),
  allVotes: new Map(),
  hasVoted: false,
  votedOptionId: null,
  broadcastChannel: null,

  generateInviteCode: () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  },

  createVote: (title, description, optionsData) => {
    const { currentUserId, currentUserName, generateInviteCode, allVotes, initBroadcastChannel, saveVoteToDB } = get();
    const inviteCode = generateInviteCode();

    const options: Option[] = optionsData.map((o) => ({
      id: uuidv4(),
      text: o.text,
      color: o.color,
      icon: o.icon,
      votes: 0
    }));

    const vote: Vote = {
      id: uuidv4(),
      title,
      description,
      options,
      inviteCode,
      createdAt: Date.now(),
      creatorId: currentUserId,
      creatorName: currentUserName,
      status: 'active',
      voteRecords: []
    };

    const newAllVotes = new Map(allVotes);
    newAllVotes.set(inviteCode, vote);

    set({
      currentVote: vote,
      allVotes: newAllVotes,
      hasVoted: false,
      votedOptionId: null
    });

    initBroadcastChannel(inviteCode);
    saveVoteToDB();

    return vote;
  },

  joinVote: (inviteCode) => {
    const { allVotes, findVoteByCode, loadVoteFromDB, initBroadcastChannel } = get();
    const code = inviteCode.toUpperCase().trim();

    let vote = allVotes.get(code) || findVoteByCode(code);

    set({
      currentVote: vote || null,
      hasVoted: false,
      votedOptionId: null
    });

    if (vote) {
      initBroadcastChannel(code);
    } else {
      loadVoteFromDB(code).then((dbVote) => {
        if (dbVote) {
          set({ currentVote: dbVote });
          initBroadcastChannel(code);
          const newAllVotes = new Map(get().allVotes);
          newAllVotes.set(code, dbVote);
          set({ allVotes: newAllVotes });
        }
      });
    }

    return vote;
  },

  findVoteByCode: (inviteCode) => {
    const { allVotes } = get();
    return allVotes.get(inviteCode.toUpperCase().trim()) || null;
  },

  castVote: (optionId) => {
    const { currentVote, currentUserId, currentUserName, hasVoted, broadcastChannel, saveVoteToDB } = get();
    if (!currentVote || hasVoted) return;

    const updatedOptions = currentVote.options.map((opt) =>
      opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
    );

    const record: VoteRecord = {
      id: uuidv4(),
      optionId,
      userId: currentUserId,
      userName: currentUserName,
      timestamp: Date.now()
    };

    const updatedVote: Vote = {
      ...currentVote,
      options: updatedOptions,
      voteRecords: [...currentVote.voteRecords, record]
    };

    const newAllVotes = new Map(get().allVotes);
    newAllVotes.set(updatedVote.inviteCode, updatedVote);

    set({
      currentVote: updatedVote,
      allVotes: newAllVotes,
      hasVoted: true,
      votedOptionId: optionId
    });

    if (broadcastChannel) {
      broadcastChannel.postMessage({
        type: 'VOTE_UPDATE',
        vote: updatedVote
      });
    }

    saveVoteToDB();
  },

  endVote: () => {
    const { currentVote, broadcastChannel, saveVoteToDB } = get();
    if (!currentVote) return;

    const updatedVote: Vote = {
      ...currentVote,
      status: 'ended'
    };

    const newAllVotes = new Map(get().allVotes);
    newAllVotes.set(updatedVote.inviteCode, updatedVote);

    set({
      currentVote: updatedVote,
      allVotes: newAllVotes
    });

    if (broadcastChannel) {
      broadcastChannel.postMessage({
        type: 'VOTE_END',
        vote: updatedVote
      });
    }

    saveVoteToDB();
  },

  getResult: () => {
    const { currentVote } = get();
    if (!currentVote) {
      return { totalVotes: 0, items: [] };
    }

    const totalVotes = currentVote.options.reduce((sum, opt) => sum + opt.votes, 0);

    const items = currentVote.options.map((opt) => ({
      option: opt,
      count: opt.votes,
      percentage: totalVotes === 0 ? 0 : Math.round((opt.votes / totalVotes) * 100)
    }));

    return { totalVotes, items };
  },

  setCurrentVote: (vote) => set({ currentVote: vote }),

  setUserName: (name) => {
    localStorage.setItem('voteCanvas_userName', name);
    set({ currentUserName: name });
  },

  syncVoteFromBroadcast: (vote) => {
    const { currentVote, currentUserId } = get();
    if (!currentVote || vote.inviteCode !== currentVote.inviteCode) return;

    const newAllVotes = new Map(get().allVotes);
    newAllVotes.set(vote.inviteCode, vote);

    const userVoted = vote.voteRecords.some((r) => r.userId === currentUserId);
    const votedRecord = vote.voteRecords.find((r) => r.userId === currentUserId);

    set({
      currentVote: vote,
      allVotes: newAllVotes,
      hasVoted: userVoted,
      votedOptionId: votedRecord?.optionId || null
    });
  },

  saveVoteToDB: async () => {
    const { currentVote } = get();
    if (!currentVote) return;
    try {
      await set(`vote_${currentVote.inviteCode}`, JSON.parse(JSON.stringify(currentVote)));
    } catch (e) {
      console.warn('Failed to save vote to IndexedDB:', e);
    }
  },

  loadVoteFromDB: async (inviteCode) => {
    try {
      const data = await get(`vote_${inviteCode.toUpperCase().trim()}`);
      return data ? (data as Vote) : null;
    } catch (e) {
      console.warn('Failed to load vote from IndexedDB:', e);
      return null;
    }
  },

  loadAllVotesFromDB: async () => {
    // 简化版：可以后续扩展加载所有存储的投票
  },

  initBroadcastChannel: (inviteCode) => {
    const { closeBroadcastChannel, syncVoteFromBroadcast, currentVote } = get();
    closeBroadcastChannel();

    try {
      const channel = new BroadcastChannel(`voteCanvas_${inviteCode}`);
      channel.onmessage = (event) => {
        const data = event.data;
        if (data.type === 'VOTE_UPDATE' || data.type === 'VOTE_END') {
          syncVoteFromBroadcast(data.vote);
        }
        if (data.type === 'REQUEST_STATE' && currentVote) {
          channel.postMessage({
            type: 'STATE_RESPONSE',
            vote: currentVote
          });
        }
        if (data.type === 'STATE_RESPONSE') {
          syncVoteFromBroadcast(data.vote);
        }
      };

      channel.postMessage({ type: 'REQUEST_STATE' });
      set({ broadcastChannel: channel });
    } catch (e) {
      console.warn('BroadcastChannel not supported:', e);
    }
  },

  closeBroadcastChannel: () => {
    const { broadcastChannel } = get();
    if (broadcastChannel) {
      broadcastChannel.close();
      set({ broadcastChannel: null });
    }
  }
}));
