import { create } from 'zustand';

interface User {
  id: string;
  nickname: string;
  avatar: string;
}

interface UserStore {
  user: User | null;
  isLoggedIn: boolean;
  login: (user?: Partial<User>) => void;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

const mockUsers: User[] = [
  {
    id: 'user-001',
    nickname: '阅读达人',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=reader1',
  },
  {
    id: 'user-002',
    nickname: '书虫小明',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=reader2',
  },
];

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  isLoggedIn: false,

  login: (user) => {
    const mockUser = user?.id
      ? mockUsers.find((u) => u.id === user.id) || mockUsers[0]
      : mockUsers[0];

    set({
      user: {
        ...mockUser,
        ...user,
      },
      isLoggedIn: true,
    });
  },

  logout: () => {
    set({
      user: null,
      isLoggedIn: false,
    });
  },

  updateUser: (data) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...data } : null,
    }));
  },
}));

export default useUserStore;
