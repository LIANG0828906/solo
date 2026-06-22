import {
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  Recipe,
  RecipeWithDetails,
  CreateRecipeData,
  SubmitVoteData,
  SubmitChallengeData,
  Challenge,
  ChallengeSubmission,
  UserProfile,
  Vote,
  Comment,
  ApiError,
} from '../types';

const BASE_URL = '/api';

const getToken = (): string | null => {
  return localStorage.getItem('token');
};

const setToken = (token: string): void => {
  localStorage.setItem('token', token);
};

const clearToken = (): void => {
  localStorage.removeItem('token');
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    let errorData: ApiError = { message: '请求失败' };
    try {
      errorData = await response.json();
    } catch {
      errorData = {
        message: response.statusText || '请求失败',
        status: response.status,
      };
    }
    throw errorData;
  }
  if (response.status === 204) {
    return {} as T;
  }
  return response.json();
};

const request = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearToken();
    window.location.href = '/login';
    throw { message: '未授权，请重新登录', status: 401 } as ApiError;
  }

  return handleResponse<T>(response);
};

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    setToken(response.token);
    return response;
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const response = await request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    setToken(response.token);
    return response;
  },

  logout: (): void => {
    clearToken();
  },

  getCurrentUser: async (): Promise<UserProfile> => {
    return request<UserProfile>('/auth/me');
  },
};

export const recipesApi = {
  getAll: async (): Promise<Recipe[]> => {
    return request<Recipe[]>('/recipes');
  },

  getById: async (id: string): Promise<RecipeWithDetails> => {
    return request<RecipeWithDetails>(`/recipes/${id}`);
  },

  create: async (data: CreateRecipeData): Promise<Recipe> => {
    return request<Recipe>('/recipes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: Partial<CreateRecipeData>): Promise<Recipe> => {
    return request<Recipe>(`/recipes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<void> => {
    return request<void>(`/recipes/${id}`, {
      method: 'DELETE',
    });
  },
};

export const votesApi = {
  submit: async (data: SubmitVoteData): Promise<Vote> => {
    return request<Vote>('/votes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

export const commentsApi = {
  getByRecipeId: async (recipeId: string): Promise<Comment[]> => {
    return request<Comment[]>(`/comments/recipe/${recipeId}`);
  },

  create: async (recipeId: string, content: string): Promise<Comment> => {
    return request<Comment>('/comments', {
      method: 'POST',
      body: JSON.stringify({ recipeId, content }),
    });
  },
};

export const challengesApi = {
  getCurrent: async (): Promise<Challenge> => {
    return request<Challenge>('/challenges/current');
  },

  getAll: async (): Promise<Challenge[]> => {
    return request<Challenge[]>('/challenges');
  },

  submit: async (data: SubmitChallengeData): Promise<ChallengeSubmission> => {
    return request<ChallengeSubmission>('/challenges/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getSubmissions: async (challengeId: string): Promise<ChallengeSubmission[]> => {
    return request<ChallengeSubmission[]>(`/challenges/${challengeId}/submissions`);
  },
};

export const profileApi = {
  getByUsername: async (username: string): Promise<UserProfile> => {
    return request<UserProfile>(`/profile/${username}`);
  },

  getCurrent: async (): Promise<UserProfile> => {
    return request<UserProfile>('/profile/me');
  },

  getMyRecipes: async (): Promise<Recipe[]> => {
    return request<Recipe[]>('/profile/me/recipes');
  },
};

export const api = {
  auth: authApi,
  recipes: recipesApi,
  votes: votesApi,
  comments: commentsApi,
  challenges: challengesApi,
  profile: profileApi,
  getToken,
  setToken,
  clearToken,
};

export default api;
