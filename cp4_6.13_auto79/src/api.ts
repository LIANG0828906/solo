export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  userId: string;
  lastEditedAt: string;
  createdAt: string;
}

export interface Shot {
  id: string;
  projectId: string;
  shotIndex: number;
  duration: number;
  description: string;
  imageUrl: string | null;
  createdAt: string;
}

const BASE_URL = '';

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || '请求失败');
  }

  return data as T;
}

export const authApi = {
  login(email: string, password: string): Promise<{ token: string; user: User }> {
    return request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  register(email: string, password: string): Promise<{ token: string; user: User }> {
    return request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
};

export const projectApi = {
  getProjects(): Promise<Project[]> {
    return request('/api/projects');
  },

  createProject(name: string): Promise<Project> {
    return request('/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },
};

export const shotApi = {
  getShots(projectId: string): Promise<Shot[]> {
    return request(`/api/projects/${projectId}/shots`);
  },

  createShot(
    projectId: string,
    data: { duration?: number; description?: string; imageUrl?: string | null }
  ): Promise<Shot> {
    return request(`/api/projects/${projectId}/shots`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateShot(
    shotId: string,
    data: { duration?: number; description?: string; imageUrl?: string | null }
  ): Promise<Shot> {
    return request(`/api/shots/${shotId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteShot(shotId: string): Promise<{ success: boolean; deletedIndex: number }> {
    return request(`/api/shots/${shotId}`, {
      method: 'DELETE',
    });
  },

  reorderShots(
    projectId: string,
    shotId: string,
    newIndex: number
  ): Promise<{ success: boolean; shots: Shot[] }> {
    return request(`/api/projects/${projectId}/shots/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ shotId, newIndex }),
    });
  },

  batchDelete(shotIds: string[]): Promise<{ success: boolean; deletedCount: number }> {
    return request('/api/shots/batch', {
      method: 'DELETE',
      body: JSON.stringify({ shotIds }),
    });
  },

  batchSetDuration(
    shotIds: string[], duration: number
  ): Promise<{ success: boolean; updatedCount: number }> {
    return request('/api/shots/batch/duration', {
      method: 'PUT',
      body: JSON.stringify({ shotIds, duration }),
    });
  },

  uploadImage(imageData: string, filename: string): Promise<{ imageUrl: string }> {
    return request('/api/upload', {
      method: 'POST',
      body: JSON.stringify({ image: imageData, filename }),
    });
  },
};
