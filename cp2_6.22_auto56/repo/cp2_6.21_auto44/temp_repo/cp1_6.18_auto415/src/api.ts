import {
  AuthResponse,
  User,
  Work,
  WorkListItem,
  SentimentResponse,
  ShareResponse,
  SharedWork,
  TextSegment
} from './types';

const API_BASE = '/api';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = this.token;
    }
    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  async register(email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getMe(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  async getWorks(): Promise<WorkListItem[]> {
    return this.request<WorkListItem[]>('/works');
  }

  async createWork(title: string): Promise<Work> {
    return this.request<Work>('/works', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  }

  async getWork(id: string): Promise<Work> {
    return this.request<Work>(`/works/${id}`);
  }

  async updateWork(
    id: string,
    data: {
      title?: string;
      duration?: number;
      text_segments?: Omit<TextSegment, 'id' | 'emotion' | 'confidence'>[];
    }
  ): Promise<Work> {
    return this.request<Work>(`/works/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteWork(id: string): Promise<void> {
    return this.request<void>(`/works/${id}`, {
      method: 'DELETE',
    });
  }

  async uploadAudio(workId: string, file: File): Promise<{ audio_path: string; audio_url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.request(`/works/${workId}/audio`, {
      method: 'POST',
      body: formData,
      headers: {},
    });
  }

  async uploadImage(workId: string, file: File): Promise<{ image_path: string; image_url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.request(`/works/${workId}/image`, {
      method: 'POST',
      body: formData,
      headers: {},
    });
  }

  async analyzeSentiment(text: string): Promise<SentimentResponse> {
    const formData = new FormData();
    formData.append('text', text);
    
    return this.request('/analyze/sentiment', {
      method: 'POST',
      body: formData,
      headers: {},
    });
  }

  async getShareLink(workId: string): Promise<ShareResponse> {
    return this.request<ShareResponse>(`/share/${workId}`);
  }

  async getSharedWork(shareToken: string): Promise<SharedWork> {
    return this.request<SharedWork>(`/share/public/${shareToken}`);
  }
}

export const api = new ApiClient();
