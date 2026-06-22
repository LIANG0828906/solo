import { create } from 'zustand';
import type { Member } from '../types';
import api from '../utils/api';

interface MemberState {
  members: Member[];
  fetchMembers: () => Promise<void>;
  addMember: (member: Omit<Member, 'id'>) => Promise<void>;
}

export const useMemberStore = create<MemberState>((set, get) => ({
  members: [],
  fetchMembers: async () => {
    const response = await api.get<Member[]>('/members');
    set({ members: response.data });
  },
  addMember: async (member) => {
    const response = await api.post<Member>('/members', member);
    set({
      members: [...get().members, response.data],
    });
  },
}));
