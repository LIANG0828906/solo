import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

export interface User {
  id: string;
  name: string;
  avatar: string;
  points: number;
}

export interface Activity {
  id: string;
  userId: string;
  category: string;
  subcategory: string;
  value: number;
  unit: string;
  emission: number;
  timestamp: string;
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  targetDays: number;
  points: number;
  participants: number;
  deadline: string;
  category: string;
}

export interface UserChallenge {
  id: string;
  userId: string;
  challengeId: string;
  startDate: string;
  completed: boolean;
  progress: number;
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  avatar: string;
  points: number;
}

export interface CategoryItem {
  id: string;
  label: string;
  unit: string;
  factor: number;
}

export interface Categories {
  transport: { label: string; items: CategoryItem[] };
  food: { label: string; items: CategoryItem[] };
  electricity: { label: string; items: CategoryItem[] };
}

interface FootprintState {
  socket: Socket | null;
  currentUser: User | null;
  activities: Activity[];
  challenges: Challenge[];
  userChallenges: UserChallenge[];
  leaderboard: LeaderboardEntry[];
  categories: Categories | null;
  connected: boolean;

  connect: (userId: string) => void;
  disconnect: () => void;
  addActivity: (activity: Omit<Activity, 'id' | 'timestamp'>) => void;
  joinChallenge: (challengeId: string) => void;
  setCurrentUser: (user: User | null) => void;
}

const ACHIEVEMENTS = [
  { id: 'leaf', name: '绿叶先锋', icon: '🍃', condition: '总减排超过50kg' },
  { id: 'bike', name: '骑行达人', icon: '🚲', condition: '完成3个挑战' },
  { id: 'earth', name: '地球守护者', icon: '🌍', condition: '积分超过500' },
  { id: 'tree', name: '种树计划', icon: '🌳', condition: '记录30次活动' },
  { id: 'star', name: '环保之星', icon: '⭐', condition: '积分超过1000' },
];

export { ACHIEVEMENTS };

export const useFootprintStore = create<FootprintState>((set, get) => ({
  socket: null,
  currentUser: null,
  activities: [],
  challenges: [],
  userChallenges: [],
  leaderboard: [],
  categories: null,
  connected: false,

  connect: (userId: string) => {
    const socket = io({ transports: ['websocket', 'polling'] });

    socket.on('connect', () => {
      set({ connected: true });
      socket.emit('user:login', userId);
    });

    socket.on('disconnect', () => {
      set({ connected: false });
    });

    socket.on('init:data', (data: {
      user: User;
      activities: Activity[];
      challenges: Challenge[];
      userChallenges: UserChallenge[];
      leaderboard: LeaderboardEntry[];
      categories: Categories;
    }) => {
      set({
        currentUser: data.user,
        activities: data.activities,
        challenges: data.challenges,
        userChallenges: data.userChallenges,
        leaderboard: data.leaderboard,
        categories: data.categories,
      });
    });

    socket.on('activity:created', (payload: { activity: Activity; earnedPoints: number }) => {
      set((state) => ({
        activities: [...state.activities, payload.activity],
      }));
    });

    socket.on('leaderboard:update', (leaderboard: LeaderboardEntry[]) => {
      set({ leaderboard });
    });

    socket.on('points:update', (payload: { userId: string; points: number }) => {
      const { currentUser } = get();
      if (currentUser && currentUser.id === payload.userId) {
        set({ currentUser: { ...currentUser, points: payload.points } });
      }
    });

    socket.on('challenges:update', (challenges: Challenge[]) => {
      set({ challenges });
    });

    socket.on('userChallenges:update', (payload: { userId: string; userChallenges: UserChallenge[] }) => {
      const { currentUser } = get();
      if (currentUser && currentUser.id === payload.userId) {
        set({ userChallenges: payload.userChallenges });
      }
    });

    socket.on('challenge:joined', (payload: { challengeId: string; success: boolean; userChallenge?: UserChallenge }) => {
      if (payload.success && payload.userChallenge) {
        set((state) => ({
          userChallenges: [...state.userChallenges, payload.userChallenge!],
        }));
      }
    });

    socket.on('challenge:completed', () => {
    });

    set({ socket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, connected: false });
    }
  },

  addActivity: (activity) => {
    const { socket } = get();
    if (socket) {
      socket.emit('activity:create', activity);
    }
  },

  joinChallenge: (challengeId) => {
    const { socket, currentUser } = get();
    if (socket && currentUser) {
      socket.emit('challenge:join', { userId: currentUser.id, challengeId });
    }
  },

  setCurrentUser: (user) => {
    set({ currentUser: user });
  },
}));
