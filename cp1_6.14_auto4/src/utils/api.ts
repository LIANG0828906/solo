/**
 * 【组件职责】封装后端 REST API 调用，统一管理 axios 实例、请求/响应拦截器及错误处理
 * 【被调用方】store/useSessionStore、各页面组件（Home、MatchDetail 等）、各业务组件
 * 【数据流向】前端组件调用本模块方法 → axios 实例发送 HTTP 请求 → 后端返回 JSON → 拦截器统一解析/抛错 → 返回给调用方
 */
import axios, { AxiosInstance, AxiosError } from 'axios';

export interface User {
  id: string;
  nickname: string;
  avatar?: string;
  email?: string;
  position?: string;
}

export interface Match {
  id: string;
  title: string;
  mode: '3v3' | '5v5';
  dateTime: string;
  location: string;
  ownerId: string;
  ownerNickname: string;
  maxPlayers: number;
  currentPlayers: number;
  status: 'open' | 'full' | 'cancelled' | 'finished';
  description?: string;
  players?: Player[];
  createdAt: string;
}

export interface Player {
  id: string;
  nickname: string;
  position: string;
  avatar?: string;
  joinedAt: string;
}

export interface RegisterPayload {
  nickname: string;
  email: string;
  password: string;
  position?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface CreateMatchPayload {
  title: string;
  mode: '3v3' | '5v5';
  dateTime: string;
  location: string;
  maxPlayers: number;
  description?: string;
}

export interface UpdateMatchPayload {
  title?: string;
  mode?: '3v3' | '5v5';
  dateTime?: string;
  location?: string;
  maxPlayers?: number;
  description?: string;
}

export interface RecommendPlayer {
  id: string;
  nickname: string;
  position: string;
  matchCount: number;
  winRate: number;
  avatar?: string;
}

export interface ApiError {
  message: string;
  code?: number;
}

const instance: AxiosInstance = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 10000,
});

instance.interceptors.request.use(
  (config) => {
    return config;
  },
  (error: AxiosError) => {
    const apiError: ApiError = {
      message: '请求发送失败，请检查网络连接',
      code: error.response?.status,
    };
    return Promise.reject(apiError);
  },
);

instance.interceptors.response.use(
  (response) => {
    const data = response.data as { success?: boolean; message?: string; data?: unknown };
    if (data && typeof data === 'object' && 'success' in data) {
      if (data.success === false) {
        const apiError: ApiError = {
          message: data.message || '操作失败',
          code: response.status,
        };
        return Promise.reject(apiError);
      }
      return (data.data !== undefined ? data.data : data) as unknown;
    }
    return response.data;
  },
  (error: AxiosError) => {
    const responseData = error.response?.data as { message?: string } | undefined;
    let message = '';
    if (error.code === 'ECONNABORTED') {
      message = '请求超时，请稍后重试';
    } else if (error.response) {
      switch (error.response.status) {
        case 400:
          message = responseData?.message || '请求参数错误';
          break;
        case 401:
          message = responseData?.message || '未登录或登录已过期';
          break;
        case 403:
          message = responseData?.message || '无权限执行此操作';
          break;
        case 404:
          message = responseData?.message || '请求的资源不存在';
          break;
        case 409:
          message = responseData?.message || '资源冲突，请刷新后重试';
          break;
        case 500:
          message = responseData?.message || '服务器内部错误';
          break;
        default:
          message = responseData?.message || `请求失败 (${error.response.status})`;
      }
    } else {
      message = '网络连接失败，请检查网络后重试';
    }
    const apiError: ApiError = {
      message,
      code: error.response?.status,
    };
    return Promise.reject(apiError);
  },
);

export const getSession = (): Promise<User> => {
  return instance.get<User, User>('/auth/session');
};

export const register = (payload: RegisterPayload): Promise<User> => {
  return instance.post<RegisterPayload, User>('/auth/register', payload);
};

export const login = (payload: LoginPayload): Promise<User> => {
  return instance.post<LoginPayload, User>('/auth/login', payload);
};

export const logout = (): Promise<void> => {
  return instance.post<void, void>('/auth/logout');
};

export const getMatches = (params?: { status?: string; mode?: string }): Promise<Match[]> => {
  return instance.get<Match[], Match[]>('/matches', { params });
};

export const createMatch = (payload: CreateMatchPayload): Promise<Match> => {
  return instance.post<CreateMatchPayload, Match>('/matches', payload);
};

export const getMatch = (id: string): Promise<Match> => {
  return instance.get<Match, Match>(`/matches/${id}`);
};

export const updateMatch = (id: string, payload: UpdateMatchPayload): Promise<Match> => {
  return instance.put<UpdateMatchPayload, Match>(`/matches/${id}`, payload);
};

export const cancelMatch = (id: string): Promise<Match> => {
  return instance.post<Match, Match>(`/matches/${id}/cancel`);
};

export const joinMatch = (id: string): Promise<Match> => {
  return instance.post<Match, Match>(`/matches/${id}/join`);
};

export const leaveMatch = (id: string): Promise<Match> => {
  return instance.post<Match, Match>(`/matches/${id}/leave`);
};

export const getRecommendPlayers = (matchId: string): Promise<RecommendPlayer[]> => {
  return instance.get<RecommendPlayer[], RecommendPlayer[]>(`/matches/${matchId}/recommend`, {
    timeout: 1000,
  });
};

export const finishMatch = (id: string): Promise<Match> => {
  return instance.post<Match, Match>(`/matches/${id}/finish`);
};

export const getMyHistory = (): Promise<Match[]> => {
  return instance.get<Match[], Match[]>('/matches/my/history');
};
