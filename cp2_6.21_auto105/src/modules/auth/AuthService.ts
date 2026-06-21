import api from '@/utils/api';
import type { User, AuthState } from '@/types';

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

class AuthService {
  private state: AuthState = {
    user: null,
    token: null,
    isLoading: false,
    error: null,
  };

  private listeners: Set<(state: AuthState) => void> = new Set();

  constructor() {
    this.initializeFromStorage();
    this.setupStorageListener();
  }

  private initializeFromStorage() {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.state = {
          ...this.state,
          user,
          token,
        };
      } catch {
        this.clearAuth();
      }
    }
  }

  private setupStorageListener() {
    window.addEventListener('storage', (e) => {
      if (e.key === 'token' || e.key === 'user') {
        this.initializeFromStorage();
        this.notifyListeners();
      }
    });
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => {
      listener({ ...this.state });
    });
  }

  subscribe(listener: (state: AuthState) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getState(): AuthState {
    return { ...this.state };
  }

  isAuthenticated(): boolean {
    return !!this.state.token && !!this.state.user;
  }

  getToken(): string | null {
    return this.state.token;
  }

  getUser(): User | null {
    return this.state.user;
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    this.state = { ...this.state, isLoading: true, error: null };
    this.notifyListeners();

    try {
      const response = await api.post<AuthResponse>('/auth/login', credentials);
      const { user, token } = response.data;

      this.state = {
        user,
        token,
        isLoading: false,
        error: null,
      };

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      this.notifyListeners();
      window.dispatchEvent(new CustomEvent('auth:login', { detail: { user } }));

      return { user, token };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '登录失败';
      this.state = {
        ...this.state,
        isLoading: false,
        error: errorMessage,
      };
      this.notifyListeners();
      throw error;
    }
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    this.state = { ...this.state, isLoading: true, error: null };
    this.notifyListeners();

    try {
      const response = await api.post<AuthResponse>('/auth/register', data);
      const { user, token } = response.data;

      this.state = {
        user,
        token,
        isLoading: false,
        error: null,
      };

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      this.notifyListeners();
      window.dispatchEvent(new CustomEvent('auth:register', { detail: { user } }));

      return { user, token };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '注册失败';
      this.state = {
        ...this.state,
        isLoading: false,
        error: errorMessage,
      };
      this.notifyListeners();
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore error on logout
    }

    this.clearAuth();
    window.dispatchEvent(new CustomEvent('auth:logout'));
  }

  private clearAuth() {
    this.state = {
      user: null,
      token: null,
      isLoading: false,
      error: null,
    };

    localStorage.removeItem('token');
    localStorage.removeItem('user');

    this.notifyListeners();
  }

  async fetchCurrentUser(): Promise<User> {
    const response = await api.get<User>('/auth/me');
    const user = response.data;

    this.state = {
      ...this.state,
      user,
    };

    localStorage.setItem('user', JSON.stringify(user));
    this.notifyListeners();

    return user;
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.put<User>('/auth/profile', data);
    const user = response.data;

    this.state = {
      ...this.state,
      user,
    };

    localStorage.setItem('user', JSON.stringify(user));
    this.notifyListeners();

    return user;
  }
}

export const authService = new AuthService();
export default authService;
