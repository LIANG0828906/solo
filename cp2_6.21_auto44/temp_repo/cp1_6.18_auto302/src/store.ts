import { create } from 'zustand';
import { Member, TourGroup } from './types';

interface AppState {
  role: 'leader' | 'member' | null;
  tourGroup: TourGroup | null;
  currentMemberId: string | null;
  sidebarCollapsed: boolean;
  selectedMemberId: string | null;
  rollCallActive: boolean;
  rollCallEndTime: number | null;
  missingMembers: string[];

  setRole: (role: 'leader' | 'member') => void;
  setTourGroup: (group: TourGroup) => void;
  setCurrentMemberId: (id: string) => void;
  toggleSidebar: () => void;
  setSelectedMemberId: (id: string | null) => void;
  updateMember: (member: Member) => void;
  setMemberPulse: (memberId: string, pulse: boolean) => void;
  setRollCallActive: (active: boolean, endTime?: number) => void;
  setMemberMissing: (memberId: string, missing: boolean) => void;
  clearMissingWarnings: () => void;
  setMembersOnlineStatus: (onlineMemberIds: string[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  role: null,
  tourGroup: null,
  currentMemberId: null,
  sidebarCollapsed: false,
  selectedMemberId: null,
  rollCallActive: false,
  rollCallEndTime: null,
  missingMembers: [],

  setRole: (role) => set({ role }),
  setTourGroup: (group) => set({ tourGroup: group }),
  setCurrentMemberId: (id) => set({ currentMemberId: id }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSelectedMemberId: (id) => set({ selectedMemberId: id }),
  updateMember: (member) =>
    set((state) => {
      if (!state.tourGroup) return {};
      const members = state.tourGroup.members.map((m) =>
        m.id === member.id ? member : m
      );
      return { tourGroup: { ...state.tourGroup, members } };
    }),
  setMemberPulse: (memberId, pulse) =>
    set((state) => {
      if (!state.tourGroup) return {};
      const members = state.tourGroup.members.map((m) =>
        m.id === memberId ? { ...m, pulseGreen: pulse } : m
      );
      return { tourGroup: { ...state.tourGroup, members } };
    }),
  setRollCallActive: (active, endTime) =>
    set({ rollCallActive: active, rollCallEndTime: endTime || null }),
  setMemberMissing: (memberId, missing) =>
    set((state) => {
      if (!state.tourGroup) return {};
      const members = state.tourGroup.members.map((m) =>
        m.id === memberId ? { ...m, missing } : m
      );
      const missingMembers = missing
        ? [...state.missingMembers, memberId]
        : state.missingMembers.filter((id) => id !== memberId);
      return { tourGroup: { ...state.tourGroup, members }, missingMembers };
    }),
  clearMissingWarnings: () =>
    set((state) => {
      if (!state.tourGroup) return {};
      const members = state.tourGroup.members.map((m) => ({ ...m, missing: false }));
      return { tourGroup: { ...state.tourGroup, members }, missingMembers: [] };
    }),
  setMembersOnlineStatus: (onlineMemberIds) =>
    set((state) => {
      if (!state.tourGroup) return {};
      const members = state.tourGroup.members.map((m) => ({
        ...m,
        isOnline: onlineMemberIds.includes(m.id),
      }));
      return { tourGroup: { ...state.tourGroup, members } };
    }),
}));
