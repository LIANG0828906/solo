import axios, { AxiosInstance } from 'axios';
import type { User } from './types';

export { User } from './types';

const BASE_URL = 'http://localhost:8000';

export const authAxios: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

authAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export interface RegisterResponse {
  user: User;
  token: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export const authApi = {
  axios: authAxios,

  register: async (username: string, email: string, password: string): Promise<RegisterResponse> => {
    const response = await authAxios.post<RegisterResponse>('/api/auth/register', {
      username,
      email,
      password,
    });
    return response.data;
  },

  login: async (username: string, password: string): Promise<LoginResponse> => {
    const response = await authAxios.post<LoginResponse>('/api/auth/login', {
      username,
      password,
    });
    return response.data;
  },
};
