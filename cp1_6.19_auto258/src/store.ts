import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Guest, LotteryState, QaItem, VipLevel } from './types';

function generateCode(existingCodes: Set<string>): string {
  let code: string;
  do {
    const n = Math.floor(Math.random() * 10000);
    const digits = String(n).padStart(4, '0');
    const check = digits.split('').reduce((s, d) => s + parseInt(d, 10), 0) % 10;
    code = digits + String(check);
  } while (existingCodes.has(code));
  return code;
}

interface AppState {
  guests: Guest[];
  seats: Record<string, string | null>;
  lotteryState: LotteryState;
  qaItems: QaItem[];
  qaWallOpen: boolean;
  sidebarOpen: boolean;

  addGuest: (data: { name: string; company: string; position: string; phone: string; vipLevel: VipLevel }) => void;
  removeGuest: (id: string) => void;
  assignSeat: (row: number, col: number, guestId: string) => void;
  clearSeat: (row: number, col: number) => void;
  startLottery: () => void;
  setLotteryCurrent: (code: string) => void;
  endLottery: (winnerId: string) => void;
  resetLottery: () => void;
  addQuestion: (content: string) => void;
  toggleQaWall: () => void;
  toggleSidebar: () => void;
}

const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      guests: [],
      seats: {},
      lotteryState: { isActive: false, currentCode: '', winnerId: null, isComplete: false },
      qaItems: [],
      qaWallOpen: false,
      sidebarOpen: false,

      addGuest: (data) => {
        const existingCodes = new Set(get().guests.map((g) => g.code));
        const code = generateCode(existingCodes);
        const id = crypto.randomUUID();
        const guest: Guest = { id, code, ...data };
        set((state) => ({ guests: [...state.guests, guest] }));
      },

      removeGuest: (id) => {
        set((state) => {
          const newSeats = { ...state.seats };
          for (const key of Object.keys(newSeats)) {
            if (newSeats[key] === id) {
              newSeats[key] = null;
            }
          }
          return {
            guests: state.guests.filter((g) => g.id !== id),
            seats: newSeats,
          };
        });
      },

      assignSeat: (row, col, guestId) => {
        const key = `${row}-${col}`;
        set((state) => {
          const newSeats = { ...state.seats };
          for (const [k, v] of Object.entries(newSeats)) {
            if (v === guestId) {
              newSeats[k] = null;
            }
          }
          newSeats[key] = guestId;
          return { seats: newSeats };
        });
      },

      clearSeat: (row, col) => {
        const key = `${row}-${col}`;
        set((state) => ({
          seats: { ...state.seats, [key]: null },
        }));
      },

      startLottery: () => {
        const guests = get().guests;
        if (guests.length === 0) return;
        const winnerIndex = Math.floor(Math.random() * guests.length);
        const winnerId = guests[winnerIndex].id;
        set({
          lotteryState: { isActive: true, currentCode: '', winnerId, isComplete: false },
        });
      },

      setLotteryCurrent: (code) => {
        set((state) => ({
          lotteryState: { ...state.lotteryState, currentCode: code },
        }));
      },

      endLottery: (winnerId) => {
        const guests = get().guests;
        const winner = guests.find((g) => g.id === winnerId);
        set({
          lotteryState: {
            isActive: true,
            currentCode: winner?.code ?? '',
            winnerId,
            isComplete: true,
          },
        });
      },

      resetLottery: () => {
        set({
          lotteryState: { isActive: false, currentCode: '', winnerId: null, isComplete: false },
        });
      },

      addQuestion: (content) => {
        const item: QaItem = {
          id: crypto.randomUUID(),
          content,
          timestamp: Date.now(),
        };
        set((state) => ({ qaItems: [item, ...state.qaItems] }));
      },

      toggleQaWall: () => {
        set((state) => ({ qaWallOpen: !state.qaWallOpen }));
      },

      toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }));
      },
    }),
    {
      name: 'event-planner-storage',
      partialize: (state) => ({
        guests: state.guests,
        seats: state.seats,
        qaItems: state.qaItems,
      }),
    }
  )
);

export default useAppStore;
