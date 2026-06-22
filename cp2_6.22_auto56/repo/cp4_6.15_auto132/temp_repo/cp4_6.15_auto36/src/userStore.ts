import { create } from 'zustand';
import type { User } from './types';

interface UserStore {
  currentUser: User | null;
  users: User[];
  setCurrentUser: (user: User) => void;
  registerUser: (
    userData: Omit<User, 'id'>
  ) => User;
  getUserById: (id: string) => User | undefined;
  getCommunityMemberCount: (community: string) => number;
}

const mockUsers: User[] = [
  {
    id: 'user_1',
    nickname: '小橙橙',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=orange',
    community: '阳光花园小区',
    addressRange: '3号楼附近',
    skillTags: ['园艺', '手工'],
  },
  {
    id: 'user_2',
    nickname: '书虫小明',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bookworm',
    community: '阳光花园小区',
    addressRange: '5号楼附近',
    skillTags: ['书籍'],
  },
  {
    id: 'user_3',
    nickname: '咖啡爱好者',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=coffee',
    community: '阳光花园小区',
    addressRange: '1号楼附近',
    skillTags: ['家居', '烹饪'],
  },
  {
    id: 'user_4',
    nickname: '玩具达人',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=toys',
    community: '阳光花园小区',
    addressRange: '7号楼附近',
    skillTags: ['玩具', '手工'],
  },
  {
    id: 'user_5',
    nickname: '健身小美',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=fitness',
    community: '阳光花园小区',
    addressRange: '2号楼附近',
    skillTags: ['运动'],
  },
  {
    id: 'user_6',
    nickname: '绿手指',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=green',
    community: '阳光花园小区',
    addressRange: '6号楼附近',
    skillTags: ['园艺', '家居'],
  },
];

export const useUserStore = create<UserStore>((set, get) => ({
  currentUser: mockUsers[0],
  users: mockUsers,

  setCurrentUser: (user) => {
    set({ currentUser: user });
  },

  registerUser: (userData) => {
    const newUser: User = {
      ...userData,
      id: 'user_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
    };
    set((state) => ({
      users: [...state.users, newUser],
      currentUser: newUser,
    }));
    return newUser;
  },

  getUserById: (id) => {
    return get().users.find((user) => user.id === id);
  },

  getCommunityMemberCount: (community) => {
    return get().users.filter((user) => user.community === community).length;
  },
}));
