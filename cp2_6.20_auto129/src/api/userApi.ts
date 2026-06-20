import { User } from '../types';

const mockUser: User = {
  id: 'user-001',
  nickname: '文学爱好者',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=reader'
};

export const userApi = {
  async getCurrentUser(): Promise<User> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockUser), 300);
    });
  },

  async login(): Promise<User> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockUser), 500);
    });
  },

  async getUserById(id: string): Promise<User | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (id === mockUser.id) {
          resolve(mockUser);
        } else {
          resolve({
            id,
            nickname: `用户${id.slice(-3)}`,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`
          });
        }
      }, 200);
    });
  }
};
