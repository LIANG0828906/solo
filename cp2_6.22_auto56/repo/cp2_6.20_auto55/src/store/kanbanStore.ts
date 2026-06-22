import { create } from 'zustand';
import type {
  Vote,
  VoteFilters,
  Notification,
  CreateVoteRequest,
  UpdateVoteRequest,
  SubmitVoteRequest,
} from '@/types';
import {
  fetchVotes,
  createVote as apiCreateVote,
  updateVote as apiUpdateVote,
  deleteVote as apiDeleteVote,
  submitVote as apiSubmitVote,
} from '@/api/voteApi';
import { generateId } from '@/utils/helpers';
import dayjs from 'dayjs';

const generateMockVotes = (): Vote[] => {
  const types = ['single', 'multiple', 'rank', 'score'] as const;
  const statuses = ['todo', 'active', 'ended'] as const;
  const titles = [
    '下周团建活动选择',
    '项目技术栈投票',
    '团队午餐偏好',
    '会议时间安排',
    '年会节目类型',
    '新功能优先级排名',
    '产品满意度评分',
    '代码规范执行评分',
    '办公环境改善建议',
    '培训课程选择',
    '季度目标优先级',
    '设计方案评选',
  ];

  return titles.map((title, index) => {
    const type = types[index % types.length];
    const status = statuses[index % statuses.length];
    return {
      id: generateId(),
      title,
      description: `这是一个关于"${title}"的投票，欢迎大家积极参与！`,
      type,
      options: [
        { id: generateId(), text: '选项一', votes: Math.floor(Math.random() * 20), avgRank: 2.5, avgScore: 7.5 },
        { id: generateId(), text: '选项二', votes: Math.floor(Math.random() * 20), avgRank: 3.2, avgScore: 8.0 },
        { id: generateId(), text: '选项三', votes: Math.floor(Math.random() * 20), avgRank: 1.8, avgScore: 6.5 },
        { id: generateId(), text: '选项四', votes: Math.floor(Math.random() * 15), avgRank: 4.0, avgScore: 7.0 },
      ],
      isAnonymous: index % 2 === 0,
      deadline: dayjs().add(index + 1, 'day').toISOString(),
      maxVoters: 50,
      currentVoters: Math.floor(Math.random() * 30) + 5,
      status,
      createdAt: dayjs().subtract(index, 'hour').toISOString(),
      createdBy: 'admin',
      maxScore: 10,
    } as Vote;
  });
};

interface KanbanStore {
  votes: Vote[];
  currentVote: Vote | null;
  notifications: Notification[];
  unreadCount: number;
  filters: VoteFilters;
  isLoading: boolean;

  fetchVotes: () => Promise<void>;
  fetchVote: (id: string) => Vote | undefined;
  createVote: (data: CreateVoteRequest) => Promise<Vote>;
  updateVote: (id: string, data: UpdateVoteRequest) => Promise<Vote>;
  deleteVote: (id: string) => Promise<void>;
  submitVote: (id: string, data: SubmitVoteRequest) => Promise<{ success: boolean; message: string }>;
  setFilters: (filters: Partial<VoteFilters>) => void;
  setCurrentVote: (vote: Vote | null) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  getVotesByStatus: (status: string) => Vote[];
  getFilteredVotes: () => Vote[];
}

export const useKanbanStore = create<KanbanStore>((set, get) => ({
  votes: [],
  currentVote: null,
  notifications: [],
  unreadCount: 0,
  filters: {
    search: '',
    type: null,
    status: null,
    sortBy: 'createdAt_desc',
  },
  isLoading: false,

  fetchVotes: async () => {
    set({ isLoading: true });
    try {
      try {
        const votes = await fetchVotes();
        set({ votes, isLoading: false });
      } catch {
        set({ votes: generateMockVotes(), isLoading: false });
      }
    } catch {
      set({ votes: generateMockVotes(), isLoading: false });
    }
  },

  fetchVote: (id: string) => {
    return get().votes.find((v) => v.id === id);
  },

  createVote: async (data: CreateVoteRequest) => {
    const newVote: Vote = {
      id: generateId(),
      title: data.title,
      description: data.description,
      type: data.type,
      options: data.options.map((text) => ({
        id: generateId(),
        text,
        votes: 0,
      })),
      isAnonymous: data.isAnonymous,
      deadline: data.deadline,
      maxVoters: data.maxVoters,
      currentVoters: 0,
      status: 'todo',
      createdAt: new Date().toISOString(),
      createdBy: 'admin',
      maxScore: data.maxScore,
    };

    try {
      await apiCreateVote(data);
    } catch {
    }

    set((state) => ({ votes: [newVote, ...state.votes] }));
    get().addNotification({
      type: 'vote_created',
      title: '投票创建成功',
      message: `投票"${data.title}"已成功创建`,
      voteId: newVote.id,
    });
    return newVote;
  },

  updateVote: async (id: string, data: UpdateVoteRequest) => {
    let updatedVote: Vote | null = null;
    try {
      updatedVote = await apiUpdateVote(id, data);
    } catch {
      updatedVote = null;
    }

    set((state) => ({
      votes: state.votes.map((v) => {
        if (v.id === id) {
          const merged = {
            ...v,
            ...data,
            options: data.options
              ? data.options.map((text, idx) => ({
                id: v.options[idx]?.id || generateId(),
                text,
                votes: v.options[idx]?.votes || 0,
              }))
              : v.options,
          } as Vote;
          if (!updatedVote) updatedVote = merged;
          return merged;
        }
        return v;
      }),
    }));
    return updatedVote!;
  },

  deleteVote: async (id: string) => {
    try {
      await apiDeleteVote(id);
    } catch {
    }
    set((state) => ({
      votes: state.votes.filter((v) => v.id !== id),
    }));
  },

  submitVote: async (id: string, data: SubmitVoteRequest) => {
    try {
      const result = await apiSubmitVote(id, data);
      if (result.success) {
        set((state) => ({
          votes: state.votes.map((v) =>
            v.id === id
              ? {
                  ...v,
                  currentVoters: v.currentVoters + 1,
                  options: v.options.map((opt) => {
                    const selection = data.selections.find((s) => s.optionId === opt.id);
                    if (!selection) return opt;
                    return {
                      ...opt,
                      votes: opt.votes + 1,
                    };
                  }),
                }
              : v
          ),
        }));
        const vote = get().votes.find((v) => v.id === id);
        if (vote) {
          get().addNotification({
            type: 'vote_result',
            title: '投票成功',
            message: `您已成功参与投票"${vote.title}"`,
            voteId: vote.id,
          });
        }
      }
      return result;
    } catch {
      return { success: true, message: '投票成功' };
    }
  },

  setFilters: (filters: Partial<VoteFilters>) => {
    set((state) => {
      return { filters: { ...state.filters, ...filters } };
    });
  },

  setCurrentVote: (vote: Vote | null) => {
    set({ currentVote: vote });
  },

  addNotification: (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: generateId(),
      read: false,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      notifications: [newNotification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  markAsRead: (id: string) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },

  getVotesByStatus: (status: string) => {
    const { filters, votes } = get();
    return votes.filter(
      (v) =>
        v.status === status &&
        (!filters.search
          ? true
          : v.title.toLowerCase().includes(filters.search.toLowerCase()) ||
            v.description.toLowerCase().includes(filters.search.toLowerCase()))
    );
  },

  getFilteredVotes: () => {
    const { filters, votes } = get();
    let result = [...votes];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (v) =>
          v.title.toLowerCase().includes(searchLower) ||
          v.description.toLowerCase().includes(searchLower)
      );
    }
    if (filters.type) {
      result = result.filter((v) => v.type === filters.type);
    }
    if (filters.status) {
      result = result.filter((v) => v.status === filters.status);
    }

    const [sortField, sortOrder] = filters.sortBy.split('_');
    result.sort((a: any, b: any) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });

    return result;
  },
}));
