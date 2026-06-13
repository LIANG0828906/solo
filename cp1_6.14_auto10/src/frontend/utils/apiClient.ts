import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

export interface User {
  id: string;
  name: string;
  avatar: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  leaderId: string;
  leaderName: string;
  memberCount: number;
  createdAt: number;
}

export interface Activity {
  id: string;
  groupId: string;
  title: string;
  description: string;
  startTime: number;
  endTime: number;
  location: string;
  maxParticipants: number;
  currentParticipants: number;
  status: 'upcoming' | 'ongoing' | 'ended';
  createdAt: number;
}

export interface Registration {
  id: string;
  activityId: string;
  userId: string;
  userName: string;
  createdAt: number;
}

export interface Rating {
  id: string;
  activityId: string;
  userId: string;
  userName: string;
  score: number;
  comment: string;
  createdAt: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

const apiClient: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    config.headers['Content-Type'] = 'application/json';
    return config;
  },
  (error: unknown) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    const result: ApiResponse<unknown> = response.data;
    if (result.success && result.data !== undefined) {
      return result.data;
    }
    return Promise.reject(new Error(result.message || '请求失败'));
  },
  (error) => {
    const message = error.response?.data?.message || error.message || '网络错误';
    return Promise.reject(new Error(message));
  }
);

export const getGroups = (page?: number, pageSize?: number): Promise<PaginatedResponse<Group>> => {
  const params: Record<string, number> = {};
  if (page !== undefined) params.page = page;
  if (pageSize !== undefined) params.pageSize = pageSize;
  return apiClient.get('/groups', { params });
};

export const getGroup = (id: string): Promise<Group> => {
  return apiClient.get(`/groups/${id}`);
};

export const createGroup = (data: {
  name: string;
  description: string;
  coverImage: string;
}): Promise<Group> => {
  return apiClient.post('/groups', data);
};

export const updateGroup = (
  id: string,
  data: Partial<{ name: string; description: string; coverImage: string }>
): Promise<Group> => {
  return apiClient.put(`/groups/${id}`, data);
};

export const deleteGroup = (id: string): Promise<void> => {
  return apiClient.delete(`/groups/${id}`);
};

export const getActivities = (
  groupId: string,
  page?: number,
  pageSize?: number
): Promise<PaginatedResponse<Activity>> => {
  const params: Record<string, number | string> = { groupId };
  if (page !== undefined) params.page = page;
  if (pageSize !== undefined) params.pageSize = pageSize;
  return apiClient.get('/activities', { params });
};

export const createActivity = (
  groupId: string,
  data: {
    title: string;
    description: string;
    startTime: number;
    endTime: number;
    location: string;
    maxParticipants: number;
  }
): Promise<Activity> => {
  return apiClient.post('/activities', { groupId, ...data });
};

export const getActivity = (id: string): Promise<Activity> => {
  return apiClient.get(`/activities/${id}`);
};

export const registerActivity = (id: string): Promise<Registration> => {
  return apiClient.post(`/activities/${id}/register`);
};

export const unregisterActivity = (id: string): Promise<void> => {
  return apiClient.delete(`/activities/${id}/register`);
};

export const getRatings = (activityId: string): Promise<Rating[]> => {
  return apiClient.get(`/activities/${activityId}/ratings`);
};

export const createRating = (
  activityId: string,
  data: { score: number; comment: string }
): Promise<Rating> => {
  return apiClient.post(`/activities/${activityId}/ratings`, data);
};

export const getUserGroups = (userId: string): Promise<Group[]> => {
  return apiClient.get(`/users/${userId}/groups`);
};

export const getUserActivities = (userId: string): Promise<Activity[]> => {
  return apiClient.get(`/users/${userId}/activities`);
};

export const getUserRatings = (userId: string): Promise<Rating[]> => {
  return apiClient.get(`/users/${userId}/ratings`);
};

export const getCurrentUser = (): Promise<User> => {
  return apiClient.get('/users/me');
};

export default apiClient;
