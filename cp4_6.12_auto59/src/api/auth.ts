import client from './client';
import type { User } from '@/types';

export interface LoginResponse {
  user: User;
  token: string;
}

export const login = (
  username: string,
  password: string
): Promise<LoginResponse> => {
  return client
    .post('/auth/login', { username, password })
    .then((res) => res.data);
};
