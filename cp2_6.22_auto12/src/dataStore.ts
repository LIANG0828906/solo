import axios from 'axios';
import type { Trip, CreateTripData, Activity, CreateActivityData, Location, CreateLocationData } from './types';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

export const tripApi = {
  getAll: async (): Promise<Trip[]> => {
    const { data } = await api.get('/trips');
    return data;
  },

  getById: async (id: string): Promise<Trip> => {
    const { data } = await api.get(`/trips/${id}`);
    return data;
  },

  create: async (tripData: CreateTripData): Promise<Trip> => {
    const { data } = await api.post('/trips', tripData);
    return data;
  },

  update: async (id: string, updates: Partial<Trip>): Promise<Trip> => {
    const { data } = await api.put(`/trips/${id}`, updates);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/trips/${id}`);
  },

  addActivity: async (tripId: string, activity: CreateActivityData): Promise<Activity> => {
    const { data } = await api.post(`/trips/${tripId}/activities`, activity);
    return data;
  },

  updateActivity: async (tripId: string, activityId: string, updates: Partial<Activity>): Promise<Activity> => {
    const { data } = await api.put(`/trips/${tripId}/activities/${activityId}`, updates);
    return data;
  },

  deleteActivity: async (tripId: string, activityId: string): Promise<void> => {
    await api.delete(`/trips/${tripId}/activities/${activityId}`);
  },

  reorderActivities: async (tripId: string, activityIds: string[], dayIndex: number): Promise<void> => {
    await api.put(`/trips/${tripId}/activities/reorder`, { activityIds, dayIndex });
  },

  addLocation: async (tripId: string, location: CreateLocationData): Promise<Location> => {
    const { data } = await api.post(`/trips/${tripId}/locations`, location);
    return data;
  },

  deleteLocation: async (tripId: string, locationId: string): Promise<void> => {
    await api.delete(`/trips/${tripId}/locations/${locationId}`);
  },

  uploadCoverImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.url;
  },
};
