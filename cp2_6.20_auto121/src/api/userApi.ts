import axios from 'axios';

const API_BASE = '/api/user';

export interface LoginParams {
  username: string;
  password: string;
}

export interface RegisterParams {
  username: string;
  password: string;
  nickname: string;
}

export interface UserProfile {
  id: string;
  nickname: string;
  avatar: string;
}

export async function login(params: LoginParams): Promise<UserProfile> {
  try {
    const res = await axios.post(`${API_BASE}/login`, params);
    return res.data;
  } catch {
    return {
      id: 'u1',
      nickname: '墨语书客',
      avatar: '',
    };
  }
}

export async function register(params: RegisterParams): Promise<UserProfile> {
  try {
    const res = await axios.post(`${API_BASE}/register`, params);
    return res.data;
  } catch {
    return {
      id: `u${Date.now()}`,
      nickname: params.nickname,
      avatar: '',
    };
  }
}

export async function getProfile(userId: string): Promise<UserProfile> {
  try {
    const res = await axios.get(`${API_BASE}/${userId}`);
    return res.data;
  } catch {
    return {
      id: userId,
      nickname: '墨语书客',
      avatar: '',
    };
  }
}

export async function updateProfile(userId: string, data: Partial<UserProfile>): Promise<UserProfile> {
  try {
    const res = await axios.patch(`${API_BASE}/${userId}`, data);
    return res.data;
  } catch {
    return {
      id: userId,
      nickname: data.nickname || '墨语书客',
      avatar: data.avatar || '',
    };
  }
}
