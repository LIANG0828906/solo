import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data: { email: string; password: string; name: string }) =>
    api.post('/auth/register', data).then((res) => res.data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data).then((res) => res.data),
  getMe: () => api.get('/auth/me').then((res) => res.data),
};

export const worksAPI = {
  create: (data: { title: string; type: string }) =>
    api.post('/works', data).then((res) => res.data),
  getList: () => api.get('/works').then((res) => res.data),
  getById: (id: string) => api.get(`/works/${id}`).then((res) => res.data),
  update: (id: string, data: any) =>
    api.put(`/works/${id}`, data).then((res) => res.data),
  delete: (id: string) => api.delete(`/works/${id}`).then((res) => res.data),
  addCollaborator: (workId: string, email: string, role: string) =>
    api.post(`/works/${workId}/collaborators`, { email, role }).then((res) => res.data),
  getVersions: (workId: string) =>
    api.get(`/works/${workId}/versions`).then((res) => res.data),
  getVersion: (workId: string, versionId: string) =>
    api.get(`/works/${workId}/versions/${versionId}`).then((res) => res.data),
};

export const invitationsAPI = {
  getList: () => api.get('/invitations').then((res) => res.data),
  accept: (id: string) =>
    api.post(`/invitations/${id}/accept`).then((res) => res.data),
  reject: (id: string) =>
    api.post(`/invitations/${id}/reject`).then((res) => res.data),
};

export const inspirationsAPI = {
  getByWork: (workId: string) =>
    api.get(`/inspirations/work/${workId}`).then((res) => res.data),
  create: (data: any) => api.post('/inspirations', data).then((res) => res.data),
  update: (id: string, data: any) =>
    api.put(`/inspirations/${id}`, data).then((res) => res.data),
  delete: (id: string) => api.delete(`/inspirations/${id}`).then((res) => res.data),
  reorder: (cards: any[]) =>
    api.put('/inspirations/batch/reorder', { cards }).then((res) => res.data),
};

export default api;
