import type {
  Event,
  Registration,
  ApiResponse,
  EventStats,
  CreateEventData,
  RegisterData,
  SignInData,
} from '../types';

const API_BASE = '/api';

let loadingCount = 0;
const loadingListeners: Set<(loading: boolean) => void> = new Set();

function notifyLoadingListeners() {
  const isLoading = loadingCount > 0;
  loadingListeners.forEach((listener) => listener(isLoading));
}

export function addLoadingListener(listener: (loading: boolean) => void) {
  loadingListeners.add(listener);
  return () => loadingListeners.delete(listener);
}

function startLoading() {
  loadingCount++;
  notifyLoadingListeners();
}

function stopLoading() {
  loadingCount = Math.max(0, loadingCount - 1);
  notifyLoadingListeners();
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number = 500) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  startLoading();
  try {
    const response = await fetch(`${API_BASE}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data: ApiResponse<T> = await response.json();

    if (!response.ok || !data.success) {
      throw new ApiError(
        data.error || `请求失败: ${response.status}`,
        response.status
      );
    }

    return data.data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof Error) {
      throw new ApiError(error.message);
    }
    throw new ApiError('网络请求失败');
  } finally {
    stopLoading();
  }
}

export const api = {
  async getEvents(): Promise<Event[]> {
    try {
      return await request<Event[]>('/events', { method: 'GET' });
    } catch (error) {
      throw error instanceof ApiError ? error : new ApiError('获取活动列表失败');
    }
  },

  async getEvent(id: string): Promise<Event> {
    try {
      return await request<Event>(`/events/${id}`, { method: 'GET' });
    } catch (error) {
      throw error instanceof ApiError ? error : new ApiError('获取活动详情失败');
    }
  },

  async createEvent(data: CreateEventData): Promise<Event> {
    try {
      return await request<Event>('/events', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      throw error instanceof ApiError ? error : new ApiError('创建活动失败');
    }
  },

  async updateEvent(id: string, data: CreateEventData): Promise<Event> {
    try {
      return await request<Event>(`/events/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (error) {
      throw error instanceof ApiError ? error : new ApiError('更新活动失败');
    }
  },

  async deleteEvent(id: string): Promise<void> {
    try {
      await request<void>(`/events/${id}`, { method: 'DELETE' });
    } catch (error) {
      throw error instanceof ApiError ? error : new ApiError('删除活动失败');
    }
  },

  async registerEvent(
    id: string,
    data: RegisterData
  ): Promise<{ registration: Registration; qrCode: string }> {
    try {
      return await request<{ registration: Registration; qrCode: string }>(
        `/events/${id}/register`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
    } catch (error) {
      throw error instanceof ApiError ? error : new ApiError('活动报名失败');
    }
  },

  async signIn(
    id: string,
    data: SignInData
  ): Promise<{ success: boolean; signedInAt: string }> {
    try {
      return await request<{ success: boolean; signedInAt: string }>(
        `/events/${id}/signin`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
    } catch (error) {
      throw error instanceof ApiError ? error : new ApiError('签到失败');
    }
  },

  async getRegistrations(id: string): Promise<Registration[]> {
    try {
      return await request<Registration[]>(`/events/${id}/registrations`, {
        method: 'GET',
      });
    } catch (error) {
      throw error instanceof ApiError ? error : new ApiError('获取报名列表失败');
    }
  },

  async getEventStats(id: string): Promise<EventStats> {
    try {
      return await request<EventStats>(`/events/${id}/stats`, { method: 'GET' });
    } catch (error) {
      throw error instanceof ApiError ? error : new ApiError('获取活动统计失败');
    }
  },
};

export default api;
