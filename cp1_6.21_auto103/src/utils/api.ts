import axios from 'axios';

export interface Activity {
  id: string;
  date: string;
  city: string;
  summary: string;
  imageUrl: string;
  order: number;
}

export interface SlideData {
  city: string;
  gradientStart: string;
  gradientEnd: string;
  highlights: string[];
}

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export const tripApi = {
  getActivities: async (): Promise<Activity[]> => {
    const { data } = await api.get('/activities');
    return data;
  },
  addActivity: async (payload: {
    date: string;
    city: string;
    summary: string;
    imageUrl?: string;
  }): Promise<Activity> => {
    const { data } = await api.post('/activities', payload);
    return data;
  },
  updateOrders: async (orders: { id: string; order: number }[]): Promise<void> => {
    await api.put('/activities', orders);
  },
  deleteActivity: async (id: string): Promise<void> => {
    await api.delete(`/activities/${id}`);
  },
  generateTrip: async (): Promise<SlideData[]> => {
    const { data } = await api.get('/trips/generate');
    return data;
  },
};
