import { create } from 'zustand';
import dayjs from 'dayjs';
import type { TimeSlot, ScheduleAssignment } from '../../../types';
import { assignTimeSlotApi } from '../../../api/mockApi';
import { useGroupBuyStore } from '../../groupBuy/store/groupBuyStore';

interface ScheduleState {
  timeSlots: TimeSlot[];
  assignments: ScheduleAssignment[];
  loading: boolean;
  error: string | null;
  fetchSlots: () => Promise<void>;
  autoAssignSlot: (groupId: string) => Promise<TimeSlot | null>;
  confirmSlot: (groupId: string, slotId: string) => Promise<void>;
  getSlotsByDate: (date: string) => TimeSlot[];
  getAssignmentByGroupId: (groupId: string) => ScheduleAssignment | undefined;
  getUserAssignments: (userId: string) => (ScheduleAssignment & { slot: TimeSlot; groupName: string })[];
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  timeSlots: [],
  assignments: [],
  loading: false,
  error: null,

  fetchSlots: async () => {
    const now = dayjs();
    const slots: TimeSlot[] = [];
    for (let i = 1; i <= 7; i++) {
      const date = now.add(i, 'day').format('YYYY-MM-DD');
      slots.push(
        { id: `slot-${i}-1`, date, startTime: '09:00', endTime: '11:00', maxCapacity: 20, currentCount: Math.floor(Math.random() * 15) },
        { id: `slot-${i}-2`, date, startTime: '11:00', endTime: '13:00', maxCapacity: 20, currentCount: Math.floor(Math.random() * 15) },
        { id: `slot-${i}-3`, date, startTime: '14:00', endTime: '16:00', maxCapacity: 20, currentCount: Math.floor(Math.random() * 15) },
        { id: `slot-${i}-4`, date, startTime: '16:00', endTime: '18:00', maxCapacity: 20, currentCount: Math.floor(Math.random() * 15) },
      );
    }
    set({ timeSlots: slots });
  },

  autoAssignSlot: async (groupId) => {
    set({ loading: true, error: null });
    const { groupBuys } = useGroupBuyStore.getState();
    const group = groupBuys.find((g) => g.id === groupId);

    if (!group) {
      set({ loading: false, error: '团购不存在' });
      return null;
    }

    try {
      const availableSlots = group.availableSlots;
      if (availableSlots.length === 0) {
        set({ loading: false, error: '没有可用时段' });
        return null;
      }

      const sortedSlots = [...availableSlots].sort((a, b) => a.currentCount - b.currentCount);
      const bestSlot = sortedSlots[0];

      const updatedSlot = await assignTimeSlotApi(groupId, bestSlot);

      set((state) => ({
        timeSlots: state.timeSlots.map((s) =>
          s.id === updatedSlot.id ? updatedSlot : s
        ),
        assignments: [
          ...state.assignments,
          {
            groupBuyId: groupId,
            slotId: updatedSlot.id,
            assignedAt: dayjs().toISOString(),
          },
        ],
        loading: false,
      }));

      useGroupBuyStore.getState().setAssignedSlot(groupId, updatedSlot);
      return updatedSlot;
    } catch (error) {
      set({ error: '自动分配时段失败', loading: false });
      return null;
    }
  },

  confirmSlot: async (groupId, slotId) => {
    set({ loading: true, error: null });
    const slot = get().timeSlots.find((s) => s.id === slotId);
    if (!slot) {
      set({ loading: false, error: '时段不存在' });
      return;
    }

    try {
      const updatedSlot = await assignTimeSlotApi(groupId, slot);
      set((state) => ({
        timeSlots: state.timeSlots.map((s) =>
          s.id === updatedSlot.id ? updatedSlot : s
        ),
        assignments: [
          ...state.assignments,
          {
            groupBuyId: groupId,
            slotId: updatedSlot.id,
            assignedAt: dayjs().toISOString(),
          },
        ],
        loading: false,
      }));

      useGroupBuyStore.getState().setAssignedSlot(groupId, updatedSlot);
    } catch (error) {
      set({ error: '确认时段失败', loading: false });
    }
  },

  getSlotsByDate: (date) => {
    return get().timeSlots.filter((s) => s.date === date);
  },

  getAssignmentByGroupId: (groupId) => {
    return get().assignments.find((a) => a.groupBuyId === groupId);
  },

  getUserAssignments: (userId) => {
    const { groupBuys } = useGroupBuyStore.getState();
    const userGroups = groupBuys.filter(
      (g) => g.creatorId === userId || g.currentMembers.some((m) => m.id === userId)
    );

    return get()
      .assignments.map((a) => {
        const group = userGroups.find((g) => g.id === a.groupBuyId);
        if (!group || !group.assignedSlot) return null;
        return { ...a, slot: group.assignedSlot, groupName: group.productName };
      })
      .filter(Boolean) as (ScheduleAssignment & { slot: TimeSlot; groupName: string })[];
  },
}));
