import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type DebatePhase = 'waiting' | 'speaking-pro' | 'speaking-con' | 'voting' | 'finished';
export type Side = 'pro' | 'con';

export interface Debater {
  id: string;
  name: string;
  side: Side;
}

export interface Argument {
  id: string;
  side: Side;
  content: string;
  timestamp: number;
  round: number;
}

export interface VoteData {
  proVotes: number;
  conVotes: number;
  totalVotes: number;
  isVotingOpen: boolean;
  userVoted: Side | null;
}

interface DebateState {
  roomId: string;
  topic: string;
  currentRound: number;
  totalRounds: number;
  phase: DebatePhase;
  timeRemaining: number;
  proDebaters: Debater[];
  conDebaters: Debater[];
  arguments: Argument[];
  voteData: VoteData;
  currentSpeaker: string | null;
  userName: string;
  userSide: Side | null;

  setRoomId: (id: string) => void;
  setTopic: (topic: string) => void;
  setUserName: (name: string) => void;
  joinAs: (side: Side, name: string) => void;
  startDebate: () => void;
  addArgument: (side: Side, content: string) => void;
  startVoting: () => void;
  castVote: (side: Side) => void;
  endVoting: () => void;
  nextRound: () => void;
  endDebate: () => void;
  setTimeRemaining: (time: number) => void;
  decrementTime: () => void;
  resetDebate: () => void;
  generateRoomId: () => string;
}

const TOTAL_ROUNDS = 3;
const SPEAKING_TIME = 90;
const VOTING_TIME = 10;

export const useDebateStore = create<DebateState>((set, get) => ({
  roomId: '',
  topic: '人工智能是否会取代人类教师？',
  currentRound: 1,
  totalRounds: TOTAL_ROUNDS,
  phase: 'waiting',
  timeRemaining: SPEAKING_TIME,
  proDebaters: [],
  conDebaters: [],
  arguments: [],
  voteData: {
    proVotes: 0,
    conVotes: 0,
    totalVotes: 0,
    isVotingOpen: false,
    userVoted: null,
  },
  currentSpeaker: null,
  userName: '',
  userSide: null,

  setRoomId: (id) => set({ roomId: id }),
  setTopic: (topic) => set({ topic }),
  setUserName: (name) => set({ userName: name }),

  joinAs: (side, name) => {
    const debater: Debater = {
      id: uuidv4(),
      name,
      side,
    };
    if (side === 'pro') {
      set((state) => ({
        proDebaters: [...state.proDebaters, debater],
        userName: name,
        userSide: side,
      }));
    } else {
      set((state) => ({
        conDebaters: [...state.conDebaters, debater],
        userName: name,
        userSide: side,
      }));
    }
  },

  startDebate: () => {
    set({
      phase: 'speaking-pro',
      timeRemaining: SPEAKING_TIME,
      currentRound: 1,
      arguments: [],
      voteData: {
        proVotes: 0,
        conVotes: 0,
        totalVotes: 0,
        isVotingOpen: false,
        userVoted: null,
      },
    });
  },

  addArgument: (side, content) => {
    const { currentRound } = get();
    const argument: Argument = {
      id: uuidv4(),
      side,
      content,
      timestamp: Date.now(),
      round: currentRound,
    };
    set((state) => ({
      arguments: [...state.arguments, argument],
    }));
  },

  startVoting: () => {
    set({
      phase: 'voting',
      timeRemaining: VOTING_TIME,
      voteData: {
        proVotes: 0,
        conVotes: 0,
        totalVotes: 0,
        isVotingOpen: true,
        userVoted: null,
      },
    });
  },

  castVote: (side) => {
    set((state) => {
      if (state.voteData.userVoted) return state;
      return {
        voteData: {
          ...state.voteData,
          proVotes: side === 'pro' ? state.voteData.proVotes + 1 : state.voteData.proVotes,
          conVotes: side === 'con' ? state.voteData.conVotes + 1 : state.voteData.conVotes,
          totalVotes: state.voteData.totalVotes + 1,
          userVoted: side,
        },
      };
    });
  },

  endVoting: () => {
    set((state) => ({
      voteData: {
        ...state.voteData,
        isVotingOpen: false,
      },
    }));
  },

  nextRound: () => {
    const { currentRound, totalRounds } = get();
    if (currentRound >= totalRounds) {
      get().endDebate();
      return;
    }
    set({
      currentRound: currentRound + 1,
      phase: 'speaking-pro',
      timeRemaining: SPEAKING_TIME,
      voteData: {
        proVotes: 0,
        conVotes: 0,
        totalVotes: 0,
        isVotingOpen: false,
        userVoted: null,
      },
    });
  },

  endDebate: () => {
    set({
      phase: 'finished',
      timeRemaining: 0,
    });
  },

  setTimeRemaining: (time) => set({ timeRemaining: time }),

  decrementTime: () => {
    set((state) => {
      if (state.timeRemaining <= 0) return state;
      const newTime = state.timeRemaining - 1;
      if (newTime <= 0) {
        if (state.phase === 'speaking-pro') {
          return { phase: 'speaking-con', timeRemaining: SPEAKING_TIME };
        } else if (state.phase === 'speaking-con') {
          return { 
            phase: 'voting', 
            timeRemaining: VOTING_TIME,
            voteData: {
              ...state.voteData,
              isVotingOpen: true,
            }
          };
        } else if (state.phase === 'voting') {
          const { currentRound, totalRounds } = get();
          if (currentRound >= totalRounds) {
            return { phase: 'finished', timeRemaining: 0, voteData: { ...state.voteData, isVotingOpen: false } };
          }
          return { 
            currentRound: currentRound + 1,
            phase: 'speaking-pro', 
            timeRemaining: SPEAKING_TIME,
            voteData: {
              ...state.voteData,
              isVotingOpen: false,
            }
          };
        }
      }
      return { timeRemaining: newTime };
    });
  },

  resetDebate: () => {
    set({
      phase: 'waiting',
      timeRemaining: SPEAKING_TIME,
      currentRound: 1,
      arguments: [],
      voteData: {
        proVotes: 0,
        conVotes: 0,
        totalVotes: 0,
        isVotingOpen: false,
        userVoted: null,
      },
    });
  },

  generateRoomId: () => {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    set({ roomId: id });
    return id;
  },
}));
