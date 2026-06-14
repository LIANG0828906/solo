import type {
  Event,
  Registration,
  EventStats,
  CreateEventData,
  RegisterData,
  SignInData,
} from '../types';

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
  try {
    const response = await fetch(`/api${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new ApiError(
        body.error || `请求失败: ${response.status}`,
        response.status
      );
    }

    return response.json() as Promise<T>;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof Error) {
      throw new ApiError(error.message);
    }
    throw new ApiError('网络请求失败');
  }
}

export const api = {
  async getEvents(): Promise<Event[]> {
    return request<Event[]>('/events');
  },

  async getEvent(id: string): Promise<Event> {
    return request<Event>(`/events/${id}`);
  },

  async createEvent(data: CreateEventData): Promise<Event> {
    return request<Event>('/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateEvent(id: string, data: CreateEventData): Promise<Event> {
    return request<Event>(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteEvent(id: string): Promise<void> {
    await request<void>(`/events/${id}`, { method: 'DELETE' });
  },

  async registerEvent(
    id: string,
    data: RegisterData
  ): Promise<{ registration: Registration; qrCode: string }> {
    return request<{ registration: Registration; qrCode: string }>(
      `/events/${id}/register`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  },

  async signIn(
    id: string,
    data: SignInData
  ): Promise<{ success: boolean; signedInAt: string }> {
    return request<{ success: boolean; signedInAt: string }>(
      `/events/${id}/signin`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  },

  async getRegistrations(id: string): Promise<Registration[]> {
    return request<Registration[]>(`/events/${id}/registrations`);
  },

  async getEventStats(id: string): Promise<EventStats> {
    return request<EventStats>(`/events/${id}/stats`);
  },
};

export default api;
