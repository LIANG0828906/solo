import axios from 'axios';
import type { Photo, Project, License, Comment, ViewRecord } from './types';

const api = axios.create({
  baseURL: '/api',
});

export const getProjects = (): Promise<Project[]> =>
  api.get('/projects').then(res => res.data);

export const getPhotos = (projectId?: string): Promise<Photo[]> => {
  if (projectId) {
    return api.get(`/projects/${projectId}/photos`).then(res => res.data);
  }
  return api.get('/photos').then(res => res.data);
};

export const getPhoto = (id: string): Promise<Photo> =>
  api.get(`/photos/${id}`).then(res => res.data);

export const recordView = (id: string, ip?: string): Promise<{ success: boolean }> =>
  api.post(`/photos/${id}/view`, { ip }).then(res => res.data);

export const getPhotoViews = (id: string): Promise<ViewRecord[]> =>
  api.get(`/photos/${id}/views`).then(res => res.data);

export const uploadPhoto = (
  file: File,
  projectId: string,
  photographerName: string
): Promise<Photo> => {
  const formData = new FormData();
  formData.append('photo', file);
  formData.append('projectId', projectId);
  formData.append('photographerName', photographerName);
  return api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(res => res.data);
};

export const getPhotoLicenses = (photoId: string): Promise<License[]> =>
  api.get(`/licenses/photo/${photoId}`).then(res => res.data);

export const getAllLicenses = (): Promise<License[]> =>
  api.get('/licenses').then(res => res.data);

export const applyLicense = (
  data: Omit<License, 'id' | 'status' | 'paymentId' | 'createdAt' | 'approvedAt' | 'expiresAt'>
): Promise<License> =>
  api.post('/licenses', data).then(res => res.data);

export const approveLicense = (id: string): Promise<License> =>
  api.put(`/licenses/${id}/approve`).then(res => res.data);

export const getCertificate = (id: string): Promise<string> =>
  api.get(`/licenses/${id}/certificate`).then(res => res.data);

export const getPhotoComments = (photoId: string): Promise<Comment[]> =>
  api.get(`/comments/photo/${photoId}`).then(res => res.data);

export const addComment = (
  data: Omit<Comment, 'id' | 'reply' | 'createdAt' | 'repliedAt'>
): Promise<Comment> =>
  api.post('/comments', data).then(res => res.data);

export const replyComment = (id: string, reply: string): Promise<Comment> =>
  api.put(`/comments/${id}/reply`, { reply }).then(res => res.data);

export default api;
