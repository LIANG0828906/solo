import { v4 as uuidv4 } from 'uuid';
import { userStore } from '../store/memory.store';
import type { User } from '../../src/types';

export const usersService = {
  register: (username: string, password: string): { user: Omit<User, 'password'>; token: string } | { error: string } => {
    if (userStore.exists(username)) {
      return { error: '用户名已存在' };
    }
    
    const user: User = {
      id: uuidv4(),
      username,
      password,
      createdAt: new Date().toISOString(),
    };
    
    userStore.create(user);
    
    const { password: _, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      token: `token_${uuidv4()}`,
    };
  },
  
  login: (username: string, password: string): { user: Omit<User, 'password'>; token: string } | { error: string } => {
    const user = userStore.findByUsername(username);
    
    if (!user || user.password !== password) {
      return { error: '用户名或密码错误' };
    }
    
    const { password: _, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      token: `token_${uuidv4()}`,
    };
  },
};
