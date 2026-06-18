import axios from 'axios';

const api = axios.create({
  baseURL: '/api/auth',
});

export interface AuthResponse {
  id: number;
  username: string;
  email: string;
  token: string;
}

export const authApi = {
  async register(username: string, email: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post('/register', { username, email, password });
    return data;
  },

  async login(username: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post('/login', { username, password });
    return data;
  },
};
