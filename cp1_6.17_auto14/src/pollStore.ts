import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import type {
  Poll,
  PollListItem,
  CreatePollDto,
  SubmitVoteDto,
  Question,
} from './types';

interface PollStore {
  polls: PollListItem[];
  currentPoll: Poll | null;
  wsConnected: boolean;
  lastUpdateTime: number | null;
  highlightQuestionId: string | null;
  wsError: string | null;
  _socket: Socket | null;
  _pendingUpdates: Map<string, Poll>;
  _flushTimer: number | null;

  initWebSocket: () => void;
  fetchPolls: () => Promise<void>;
  fetchPollDetail: (id: string) => Promise<void>;
  fetchPollByCode: (shortCode: string) => Promise<Poll | null>;
  createPoll: (data: CreatePollDto) => Promise<Poll>;
  setCurrentPoll: (id: string | null) => void;
  submitVote: (data: SubmitVoteDto) => Promise<void>;
  closePoll: (id: string) => Promise<void>;
  addQuestion: (
    pollId: string,
    question: Omit<Question, 'id' | 'order'>
  ) => Promise<Question | null>;
  exportCSV: (pollId: string) => void;
  mergePoll: (poll: Poll) => void;
  clearHighlight: () => void;
}

export const usePollStore = create<PollStore>((set, get) => ({
  polls: [],
  currentPoll: null,
  wsConnected: false,
  lastUpdateTime: null,
  highlightQuestionId: null,
  wsError: null,
  _socket: null,
  _pendingUpdates: new Map(),
  _flushTimer: null,

  initWebSocket: () => {
    if (get()._socket) return;
    const socket = io({ transports: ['websocket', 'polling'] });

    socket.on('connect', () => {
      set({ wsConnected: true, wsError: null });
    });

    socket.on('disconnect', () => {
      set({ wsConnected: false });
    });

    socket.on('connect_error', (err) => {
      set({ wsConnected: false, wsError: err.message });
    });

    socket.on('pollUpdate', (poll: Poll) => {
      const { _pendingUpdates } = get();
      _pendingUpdates.set(poll.id, poll);

      if (get()._flushTimer !== null) return;
      const timer = window.setTimeout(() => {
        const pending = get()._pendingUpdates;
        pending.forEach((p) => get().mergePoll(p));
        pending.clear();
        set({ _flushTimer: null });
      }, 50);
      set({ _flushTimer: timer });
    });

    socket.on('questionAdded', ({ pollId, question }: { pollId: string; question: Question }) => {
      const { currentPoll } = get();
      if (currentPoll && currentPoll.id === pollId) {
        set({
          currentPoll: {
            ...currentPoll,
            questions: [...currentPoll.questions, question],
          },
          highlightQuestionId: question.id,
        });
      }
    });

    set({ _socket: socket });
  },

  fetchPolls: async () => {
    const res = await fetch('/api/polls');
    if (!res.ok) throw new Error('获取投票列表失败');
    const polls = (await res.json()) as PollListItem[];
    set({ polls });
  },

  fetchPollDetail: async (id: string) => {
    const res = await fetch(`/api/polls/${id}`);
    if (!res.ok) throw new Error('投票不存在');
    const poll = (await res.json()) as Poll;
    set({ currentPoll: poll, lastUpdateTime: Date.now() });
  },

  fetchPollByCode: async (shortCode: string) => {
    const res = await fetch(`/api/polls/code/${shortCode.toUpperCase()}`);
    if (!res.ok) return null;
    return (await res.json()) as Poll;
  },

  createPoll: async (data: CreatePollDto) => {
    const res = await fetch('/api/polls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: '创建失败' }));
      throw new Error(err.error || '创建失败');
    }
    const { poll } = await res.json();
    set((state) => ({
      polls: [
        {
          id: poll.id,
          shortCode: poll.shortCode,
          title: poll.title,
          description: poll.description,
          questionCount: poll.questions.length,
          submissionCount: 0,
          createdAt: poll.createdAt,
          isActive: poll.isActive,
        },
        ...state.polls,
      ],
      currentPoll: poll,
    }));
    return poll as Poll;
  },

  setCurrentPoll: (id: string | null) => {
    if (!id) {
      set({ currentPoll: null });
      return;
    }
    get().fetchPollDetail(id);
  },

  submitVote: async (data: SubmitVoteDto) => {
    const socket = get()._socket;
    return new Promise<void>((resolve, reject) => {
      if (!socket || !socket.connected) {
        reject(new Error('网络连接未就绪'));
        return;
      }
      socket.emit('newVote', data);
      socket.once('voteSuccess', () => resolve());
      socket.once('voteError', (err: { error: string }) => reject(new Error(err.error)));
      setTimeout(() => reject(new Error('提交超时，请重试')), 10000);
    });
  },

  closePoll: async (id: string) => {
    const res = await fetch(`/api/polls/${id}/close`, { method: 'PATCH' });
    if (!res.ok) throw new Error('操作失败');
    const updated = (await res.json()) as Poll;
    set((state) => ({
      polls: state.polls.map((p) =>
        p.id === id ? { ...p, isActive: false, closedAt: updated.closedAt } : p
      ),
      currentPoll: state.currentPoll?.id === id ? updated : state.currentPoll,
    }));
  },

  addQuestion: async (pollId, question) => {
    const res = await fetch(`/api/polls/${pollId}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(question),
    });
    if (!res.ok) return null;
    const updated = (await res.json()) as Poll;
    const newQ = updated.questions[updated.questions.length - 1];
    set({ highlightQuestionId: newQ.id });
    return newQ;
  },

  exportCSV: (pollId) => {
    const a = document.createElement('a');
    a.href = `/api/polls/${pollId}/export`;
    a.download = '';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },

  mergePoll: (poll: Poll) => {
    set((state) => {
      const listIdx = state.polls.findIndex((p) => p.id === poll.id);
      const newPolls = [...state.polls];
      if (listIdx !== -1) {
        newPolls[listIdx] = {
          ...newPolls[listIdx],
          submissionCount: poll.submissions.length,
          isActive: poll.isActive,
        };
      }
      return {
        polls: newPolls,
        currentPoll: state.currentPoll?.id === poll.id ? poll : state.currentPoll,
        lastUpdateTime: Date.now(),
      };
    });
  },

  clearHighlight: () => set({ highlightQuestionId: null }),
}));
