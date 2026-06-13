import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

export const getActivities = (params?: { page?: number; limit?: number; userId?: string }) => {
  return api.get('/activities', { params });
};

export const getActivity = (id: string) => {
  return api.get(`/activities/${id}`);
};

export const createActivity = (data: {
  bookTitle: string;
  bookAuthor: string;
  startDate: string;
  endDate: string;
  description: string;
  organizerId: string;
}) => {
  return api.post('/activities', data);
};

export const joinActivity = (
  id: string,
  data: { inviteCode: string; memberName: string; memberAvatar: string }
) => {
  return api.post(`/activities/${id}/join`, data);
};

export const checkIn = (
  id: string,
  data: { memberId: string; date: string; status: string; pages: number; note?: string }
) => {
  return api.post(`/activities/${id}/checkin`, data);
};

export const getCheckIns = (id: string, params?: { page?: number; limit?: number }) => {
  return api.get(`/activities/${id}/checkins`, { params });
};

export const uploadCover = (id: string, file: File) => {
  const formData = new FormData();
  formData.append('cover', file);
  return api.post(`/activities/${id}/cover`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const getReport = (id: string) => {
  return api.get(`/activities/${id}/report`);
};

export const exportReport = (id: string) => {
  return api.get(`/activities/${id}/report/export`, {
    responseType: 'blob',
  });
};

export default api;
