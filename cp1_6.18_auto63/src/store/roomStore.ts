import { create } from 'zustand';
import { Room, VoteResult } from '@/shared/types';
import { mockApi } from '@/shared/mockApi';

interface RoomState {
  roomId: string | null;
  room: Room | null;
  results: VoteResult[] | null;
  isLoading: boolean;
  error: string | null;

  createRoom: () => Promise<void>;
  joinRoom: (id: string) => Promise<boolean>;
  submitVote: (candidateId: string) => Promise<string | null>;
  endVoting: () => Promise<void>;
  resetRoom: () => Promise<void>;
  leaveRoom: () => void;
}

export const useRoomStore = create<RoomState>((set, get) => ({
  roomId: null,
  room: null,
  results: null,
  isLoading: false,
  error: null,

  createRoom: async () => {
    set({ isLoading: true, error: null });
    try {
      const room = await mockApi.createRoom();
      set({ roomId: room.id, room, results: null, isLoading: false });
    } catch (e) {
      set({ error: '创建房间失败', isLoading: false });
    }
  },

  joinRoom: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const room = await mockApi.joinRoom(id);
      if (room) {
        set({ roomId: room.id, room, results: null, isLoading: false });
        return true;
      } else {
        set({ error: '房间不存在', isLoading: false });
        return false;
      }
    } catch (e) {
      set({ error: '加入房间失败', isLoading: false });
      return false;
    }
  },

  submitVote: async (candidateId: string) => {
    const { roomId } = get();
    if (!roomId) return null;

    try {
      const result = await mockApi.submitVote(roomId, candidateId);
      if (result) {
        set({ room: result.room });
        return result.color;
      }
      return null;
    } catch (e) {
      return null;
    }
  },

  endVoting: async () => {
    const { roomId } = get();
    if (!roomId) return;

    try {
      const results = await mockApi.endVoting(roomId);
      if (results) {
        set({ results, room: mockApi.getRoom(roomId) });
      }
    } catch (e) {
      set({ error: '结束投票失败' });
    }
  },

  resetRoom: async () => {
    const { roomId } = get();
    if (!roomId) return;

    try {
      const room = await mockApi.resetRoom(roomId);
      if (room) {
        set({ room, results: null });
      }
    } catch (e) {
      set({ error: '重置房间失败' });
    }
  },

  leaveRoom: () => {
    set({ roomId: null, room: null, results: null, error: null });
  },
}));
