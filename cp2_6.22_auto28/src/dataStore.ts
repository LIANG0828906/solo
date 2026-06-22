import axios from 'axios';
import type { Trip, Activity, DayPlan } from './types';

const API_BASE = '/api';

export const dataStore = {
  async getAllTrips(): Promise<Trip[]> {
    const response = await axios.get(`${API_BASE}/trips`);
    return response.data;
  },

  async getTrip(id: string): Promise<Trip> {
    const response = await axios.get(`${API_BASE}/trips/${id}`);
    return response.data;
  },

  async createTrip(tripData: Partial<Trip>): Promise<Trip> {
    const response = await axios.post(`${API_BASE}/trips`, tripData);
    return response.data;
  },

  async updateTrip(id: string, tripData: Partial<Trip>): Promise<Trip> {
    const response = await axios.put(`${API_BASE}/trips/${id}`, tripData);
    return response.data;
  },

  async deleteTrip(id: string): Promise<void> {
    await axios.delete(`${API_BASE}/trips/${id}`);
  },

  async updateDays(tripId: string, days: DayPlan[]): Promise<Trip> {
    const response = await axios.put(`${API_BASE}/trips/${tripId}/days`, { days });
    return response.data;
  },

  async addActivity(tripId: string, date: string, activityData: Partial<Activity>): Promise<Activity> {
    const response = await axios.post(
      `${API_BASE}/trips/${tripId}/days/${date}/activities`,
      activityData
    );
    return response.data;
  },

  async updateActivity(tripId: string, activityId: string, activityData: Partial<Activity>): Promise<Activity> {
    const response = await axios.put(
      `${API_BASE}/trips/${tripId}/activities/${activityId}`,
      activityData
    );
    return response.data;
  },

  async deleteActivity(tripId: string, activityId: string): Promise<void> {
    await axios.delete(`${API_BASE}/trips/${tripId}/activities/${activityId}`);
  }
};
