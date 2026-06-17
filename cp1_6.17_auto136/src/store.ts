import { create } from 'zustand';

export interface PoemMessage {
  id: string;
  nickname: string;
  lines: [string, string, string];
  emotions: { keyword: string; color: string }[];
  timestamp: number;
}

export interface RoomState {
  roomId: string | null;
  nickname: string | null;
  onlineCount: number;
  messages: PoemMessage[];
  setRoom: (roomId: string, nickname: string) => void;
  setOnlineCount: (count: number) => void;
  addMessage: (msg: PoemMessage) => void;
  setMessages: (msgs: PoemMessage[]) => void;
  leaveRoom: () => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  roomId: null,
  nickname: null,
  onlineCount: 1,
  messages: [],
  setRoom: (roomId, nickname) => set({ roomId, nickname, messages: [], onlineCount: 1 }),
  setOnlineCount: (count) => set({ onlineCount: count }),
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  setMessages: (msgs) => set({ messages: msgs }),
  leaveRoom: () => set({ roomId: null, nickname: null, messages: [], onlineCount: 1 }),
}));
