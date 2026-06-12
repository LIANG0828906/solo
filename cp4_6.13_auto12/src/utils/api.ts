import type {
  User,
  Subject,
  StudySession,
  Achievement,
  StatisticsData,
  SessionCreatePayload,
} from '@/types';

const API_BASE = '/api';

const getToken = (): string | null => localStorage.getItem('auth_token');

interface RequestOptions extends RequestInit {
  auth?: boolean;
}

async function request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { auth = true, headers, ...rest } = options;
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (auth) {
    const token = getToken();
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
  }
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: { ...defaultHeaders, ...headers },
    ...rest,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `请求失败 (${response.status})`);
  }
  return data as T;
}

interface AuthResponse {
  token: string;
  user: User;
}

export const authApi = {
  register: (username: string, password: string, nickname: string) =>
    request<AuthResponse>('/register', {
      auth: false,
      method: 'POST',
      body: JSON.stringify({ username, password, nickname }),
    }),
  login: (username: string, password: string) =>
    request<AuthResponse>('/login', {
      auth: false,
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
};

export const subjectApi = {
  getAll: () => request<Subject[]>('/subjects'),
  create: (data: Partial<Subject>) =>
    request<Subject>('/subjects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: Partial<Subject>) =>
    request<Subject>(`/subjects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  remove: (id: number) =>
    request<{ success: boolean }>(`/subjects/${id}`, { method: 'DELETE' }),
};

interface SessionCreateResponse {
  session: StudySession;
  newAchievements: Achievement[];
}

export const sessionApi = {
  getAll: (params?: { start_date?: string; end_date?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.start_date) query.set('start_date', params.start_date);
    if (params?.end_date) query.set('end_date', params.end_date);
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    return request<StudySession[]>(`/sessions${qs ? `?${qs}` : ''}`);
  },
  create: (payload: SessionCreatePayload) =>
    request<SessionCreateResponse>('/sessions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

export const statsApi = {
  getStatistics: (range: 7 | 30 | 90 = 30) =>
    request<StatisticsData>(`/statistics?range=${range}`),
};

export const achievementApi = {
  getAll: () => request<Achievement[]>('/achievements'),
};

export const userApi = {
  updateProfile: (data: { nickname?: string; avatar?: string; reminder_time?: string | null }) =>
    request<User>('/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  exportPdf: (week_start?: string) =>
    request<{ success: boolean; message: string }>('/export-pdf', {
      method: 'POST',
      body: JSON.stringify({ week_start }),
    }),
};

export default {
  auth: authApi,
  subject: subjectApi,
  session: sessionApi,
  stats: statsApi,
  achievement: achievementApi,
  user: userApi,
};
