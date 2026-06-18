import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import type { GroupBuy, Member, TimeSlot } from '../../../types';
import { createGroupBuyApi, fetchGroupBuysApi, joinGroupBuyApi } from '../../../api/mockApi';

interface GroupBuyState {
  groupBuys: GroupBuy[];
  loading: boolean;
  error: string | null;
  selectedGroup: GroupBuy | null;
  fetchGroupBuys: () => Promise<void>;
  createGroupBuy: (data: Omit<GroupBuy, 'id' | 'code' | 'shareLink' | 'currentMembers' | 'creatorId' | 'status' | 'createdAt' | 'assignedSlot'>) => Promise<GroupBuy>;
  joinGroupBuy: (groupId: string) => Promise<void>;
  setSelectedGroup: (group: GroupBuy | null) => void;
  updateGroupStatus: (groupId: string, status: GroupBuy['status']) => void;
  setAssignedSlot: (groupId: string, slot: TimeSlot) => void;
  checkAndCloseExpired: () => void;
}

export const useGroupBuyStore = create<GroupBuyState>((set, get) => ({
  groupBuys: [],
  loading: false,
  error: null,
  selectedGroup: null,

  fetchGroupBuys: async () => {
    set({ loading: true, error: null });
    try {
      const data = await fetchGroupBuysApi();
      set({ groupBuys: data, loading: false });
      get().checkAndCloseExpired();
    } catch (error) {
      set({ error: '获取团购列表失败', loading: false });
    }
  },

  createGroupBuy: async (data) => {
    set({ loading: true, error: null });
    try {
      const newGroup = await createGroupBuyApi(data);
      set((state) => ({
        groupBuys: [newGroup, ...state.groupBuys],
        loading: false,
      }));
      return newGroup;
    } catch (error) {
      set({ error: '创建团购失败', loading: false });
      throw error;
    }
  },

  joinGroupBuy: async (groupId) => {
    set({ loading: true, error: null });
    const mockMember: Omit<Member, 'joinedAt'> = {
      id: uuidv4(),
      nickname: '新团员' + Math.floor(Math.random() * 100),
      avatar: 'U',
    };

    try {
      const member = await joinGroupBuyApi(groupId, mockMember);
      set((state) => {
        const updatedGroups = state.groupBuys.map((g) => {
          if (g.id === groupId) {
            const newMembers = [...g.currentMembers, member];
            return { ...g, currentMembers: newMembers };
          }
          return g;
        });
        return { groupBuys: updatedGroups, loading: false };
      });

      const { groupBuys } = get();
      const updatedGroup = groupBuys.find((g) => g.id === groupId);
      if (updatedGroup && updatedGroup.currentMembers.length >= updatedGroup.minMembers) {
        get().updateGroupStatus(groupId, 'success');
      }
    } catch (error) {
      set({ error: '加入团购失败', loading: false });
      throw error;
    }
  },

  setSelectedGroup: (group) => set({ selectedGroup: group }),

  updateGroupStatus: (groupId, status) => {
    set((state) => ({
      groupBuys: state.groupBuys.map((g) =>
        g.id === groupId ? { ...g, status } : g
      ),
    }));
  },

  setAssignedSlot: (groupId, slot) => {
    set((state) => ({
      groupBuys: state.groupBuys.map((g) =>
        g.id === groupId ? { ...g, assignedSlot: slot } : g
      ),
    }));
  },

  checkAndCloseExpired: () => {
    const now = dayjs();
    set((state) => ({
      groupBuys: state.groupBuys.map((g) => {
        if (g.status === 'pending' && now.isAfter(dayjs(g.endTime))) {
          return { ...g, status: 'closed' };
        }
        return g;
      }),
    }));
  },
}));
